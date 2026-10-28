const REPO = 'FLYFISH567/FLYFISH567.github.io';
const WORKFLOW = 'news-pages.yml';
const SITE = 'https://flyfish567.github.io/release.json';
const ACTIVE = new Set(['queued', 'in_progress', 'waiting', 'pending', 'requested']);

export async function checkAndDispatch(env, fetcher = fetch, now = Date.now()) {
  if (!env.GITHUB_NEWS_TOKEN) throw new Error('GitHub secret is missing');
  const request = (url, options = {}) => fetcher(url, {
    ...options, redirect: 'error', signal: AbortSignal.timeout(10000)
  });
  let checkedAt = NaN;
  try {
    const response = await request(`${SITE}?watchdog=${now}`, {headers: {'Cache-Control': 'no-cache'}});
    if (response.ok) checkedAt = Date.parse((await response.json()).news_checked_at);
  } catch { /* An unavailable snapshot also needs recovery. */ }
  const age = now - checkedAt;
  if (Number.isFinite(age) && age >= -60000 && age < 20 * 60000) return {status: 'fresh'};

  const api = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_NEWS_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2026-03-10',
    'User-Agent': 'flyfish-news-watchdog',
    'Content-Type': 'application/json'
  };
  const runsResponse = await request(`${api}/runs?branch=source&per_page=10`, {headers});
  if (!runsResponse.ok) throw new Error(`GitHub run check failed (${runsResponse.status})`);
  const runs = await runsResponse.json();
  if (!Array.isArray(runs.workflow_runs)) throw new Error('Invalid GitHub run response');
  if (runs.workflow_runs.some(run => ACTIVE.has(run.status))) return {status: 'running'};
  const response = await request(`${api}/dispatches`, {method: 'POST', headers, body: JSON.stringify({ref: 'source'})});
  if (response.status !== 204) throw new Error(`GitHub dispatch failed (${response.status})`);
  return {status: 'dispatched'};
}

export default {
  scheduled(event, env, ctx) {
    ctx.waitUntil(checkAndDispatch(env).then(result => {
      console.log(JSON.stringify({event: 'news-watchdog', ...result}));
    }).catch(error => {
      // Only our fixed diagnostic messages may reach logs or runtime exceptions.
      const message = /^(GitHub secret is missing|Invalid GitHub run response|GitHub (run check|dispatch) failed \(\d{3}\))$/.test(error?.message)
        ? error.message : 'Network request failed';
      console.error(JSON.stringify({event: 'news-watchdog', status: 'failed', error: message}));
      throw new Error(message);
    }));
  },
  fetch() { return new Response('Not found', {status: 404}); }
};
