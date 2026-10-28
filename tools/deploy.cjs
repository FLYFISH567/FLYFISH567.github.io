'use strict';
// GitHub Actions 负责采集、验证、发布与上线检查；本机只触发，不复制静态文件覆盖线上新数据。
const {execFileSync}=require('child_process');
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
try{
  if(git(['branch','--show-current'])!=='source')throw Error('请在 source 分支发布。');
  if(git(['status','--porcelain']))throw Error('请先提交源码并推送 source 分支。');
  git(['fetch','origin','source']);
  if(git(['rev-parse','HEAD'])!==git(['rev-parse','origin/source']))throw Error('远程 source 与本地不同，请先同步源码。');
  execFileSync('gh',['workflow','run','pages.yml','--ref','source'],{stdio:'inherit'});
  console.log('已触发后台采集与发布：https://github.com/FLYFISH567/FLYFISH567.github.io/actions/workflows/pages.yml');
}catch(error){console.error(error.message);process.exitCode=1;}
