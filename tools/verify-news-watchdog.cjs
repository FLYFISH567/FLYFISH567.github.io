'use strict';
const assert = require('node:assert/strict');
(async () => {
  const {checkAndDispatch, default: worker} = await import('../infra/news-watchdog/worker.mjs');
  const now = Date.parse('2026-10-28T12:00:00Z');
  const env = {GITHUB_NEWS_TOKEN: 'test-only-secret'};
  async function scenario({age = 30, runs = [], runStatus = 200, dispatchStatus = 200, dispatchBody = {workflow_run_id: 123}, offline = false, staleMinutes} = {}) {
    const calls = [];
    const fetcher = async (url, options) => {
      calls.push({url, options});
      if (url.startsWith('https://flyfish567.github.io/')) {
        assert.equal(options.headers.Authorization, undefined);
        if (offline) throw new Error('offline');
        return Response.json({news_checked_at: new Date(now - age * 60000).toISOString()});
      }
      assert.equal(new URL(url).hostname, 'api.github.com');
      assert.equal(options.redirect, 'manual', 'Workers-compatible requests must not follow credential redirects');
      if (url.includes('/runs?')) return Response.json({workflow_runs: runs}, {status: runStatus});
      assert.deepEqual(JSON.parse(options.body), {ref: 'source'});
      return dispatchStatus === 200 ? Response.json(dispatchBody) : new Response(null, {status: dispatchStatus});
    };
    return {result: await checkAndDispatch({...env, ...(staleMinutes === undefined ? {} : {STALE_AFTER_MINUTES: staleMinutes})}, fetcher, now), calls};
  }
  const fresh = await scenario({age: 5});
  assert.equal(fresh.result.status, 'fresh'); assert.equal(fresh.calls.length, 1);
  assert.equal((await scenario()).result.status, 'dispatched');
  assert.equal((await scenario()).result.runId, 123);
  assert.equal((await scenario({dispatchStatus: 204})).result.status, 'dispatched');
  await assert.rejects(scenario({dispatchBody: {}}), /Invalid GitHub dispatch response/);
  assert.equal((await scenario({age: 19})).result.status, 'fresh');
  assert.equal((await scenario({age: 20})).result.status, 'dispatched');
  assert.equal((await scenario({age: 5, staleMinutes: '1'})).result.status, 'dispatched');
  for (const staleMinutes of ['0', '61', 'garbage', '1.5']) await assert.rejects(scenario({staleMinutes}), /Invalid freshness threshold/);
  assert.equal((await scenario({offline: true})).result.status, 'dispatched');
  assert.equal((await scenario({age: -60})).result.status, 'dispatched');
  for (const status of ['queued', 'in_progress', 'waiting', 'pending', 'requested']) {
    const active = await scenario({runs: [{status}]});
    assert.equal(active.result.status, 'running'); assert.equal(active.calls.length, 2);
  }
  await assert.rejects(scenario({runStatus: 401}), /run check failed \(401\)/);
  await assert.rejects(scenario({runStatus: 302}), /run check failed \(302\)/);
  await assert.rejects(scenario({dispatchStatus: 302}), /dispatch failed \(302\)/);
  await assert.rejects(scenario({dispatchStatus: 429}), /dispatch failed \(429\)/);
  await assert.rejects(checkAndDispatch({}, () => {throw new Error('must not fetch');}, now), /secret is missing/);
  assert.equal(worker.fetch().status, 404);
  const originalFetch = global.fetch, originalError = console.error, errors = [];
  try {
    global.fetch = async () => {throw new Error(env.GITHUB_NEWS_TOKEN);};
    console.error = line => errors.push(line);
    let pending;
    worker.scheduled({}, env, {waitUntil(promise) {pending = promise;}});
    await assert.rejects(pending, /Network request failed/);
    assert.ok(!errors.join('').includes(env.GITHUB_NEWS_TOKEN), 'External errors cannot expose credentials in logs');
  } finally {global.fetch = originalFetch; console.error = originalError;}
  console.log('PASS: news watchdog freshness, recovery, duplicate suppression and secret boundaries.');
})().catch(error => {console.error(error); process.exit(1);});
