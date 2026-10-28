'use strict';
const fs=require('fs'),{execFileSync}=require('child_process');
const news=JSON.parse(fs.readFileSync('public/briefing/feed.json','utf8'));
const commit=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
fs.writeFileSync('public/release.json',JSON.stringify({source_commit:commit,published_at:new Date().toISOString(),url:'https://flyfish567.github.io',news_checked_at:news.checkedAt,news_sources_ok:Object.values(news.health||{}).filter(h=>h.status==='ok').length,workflow_run:process.env.GITHUB_RUN_ID||null,workflow_event:process.env.GITHUB_EVENT_NAME||'local'},null,2)+'\n');
