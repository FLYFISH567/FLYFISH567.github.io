'use strict';
const assert = require('node:assert/strict');
(async () => {
  const {checkAndDispatch, default: worker} = await import('../infra/news-watchdog/worker.mjs');
  const now = Date.parse('2026-10-28T12:00:00Z');
  const env = {GITHUB_NEWS_TOKEN: 'test-only-secret'};
  async function scenario({age = 30, runs = [], runStatus = 200, dispatchStatus = 204, offline = false} = {}) {
    const calls = [];
    const fetcher = async (url, options) => {
      calls.push({url, options});
      if (url.startsWith('https://flyfish567.github.io/')) {
        assert.equal(options.headers.Authorization, undefined);
        if (offline) throw new Error('offline');
        return Response.json({news_checked_at: new Date(now - age * 60000).toISOString()});
      }
      assert.equal(new URL(url).hostname, 'api.github.com');
      assert.equal(options.redirect, 'error');
      if (url.includes('/runs?')) return Response.json({workflow_runs: runs}, {status: runStatus});
      assert.deepEqual(JSON.parse(options.body), {ref: 'source'});
      return new Response(null, {status: dispatchStatus});
    };
    return {result: await checkAndDispatch(env, fetcher, now), calls};
  }
  const fresh = await scenario({age: 5});
  assert.equal(fresh.result.status, 'fresh'); assert.equal(fresh.calls.length, 1);
  assert.equal((await scenario()).result.status, 'dispatched');
  assert.equal((await scenario({offline: true})).result.status, 'dispatched');
  assert.equal((await scenario({age: -60})).result.status, 'dispatched');
  for (const status of ['queued', 'in_progress', 'waiting', 'pending', 'requested']) {
    const active = await scenario({runs: [{status}]});
    assert.equal(active.result.status, 'running'); assert.equal(active.calls.length, 2);
  }
  await assert.rejects(scenario({runStatus: 401}), /run check failed \(401\)/);
  await assert.rejects(scenario({dispatchStatus: 429}), /dispatch failed \(429\)/);
  await assert.rejects(checkAndDispatch({}, () => {throw new Error('must not fetch');}, now), /secret is missing/);
  assert.equal(worker.fetch().status, 404);
  console.log('PASS: news watchdog freshness, recovery, duplicate suppression and secret boundaries.');
})().catch(error => {console.error(error); process.exit(1);});
