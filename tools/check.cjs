'use strict';
const {spawnSync}=require('child_process');
const checks=['redesign','about-explore','daily-card','toolbox','comments','travel-map','gallery-motion','pointer-play','background-fish','life-nav','details','motion','global-music','music-import','music-collections','navigation','prefetch','effects','search','briefing','markets','news-pipeline','news-watchdog'];
for(const check of checks){const result=spawnSync(process.execPath,[`tools/verify-${check}.cjs`],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`PASS: ${checks.length} site checks.`);
