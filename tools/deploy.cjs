'use strict';
// 保留 source 分支中的源码；只将 public 复制到独立、可检查的 main 工作树。
// 普通 fast-forward 推送，不使用 --force。失败时留下工作树，方便检查和重试。
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process'),yaml=require('js-yaml');
const root=path.resolve(__dirname,'..'),output=path.join(root,'output');
function git(args,cwd=root){return execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
function inside(parent,target){const relative=path.relative(parent,target);if(!relative||relative.startsWith('..')||path.isAbsolute(relative))throw Error('Unsafe deployment path: '+target);return target;}
function main(){
  if(git(['branch','--show-current'])!=='source')throw Error('请在 source 分支发布，避免将生成网页当成源码。');
  if(git(['status','--porcelain']))throw Error('请先提交源码并推送 source 分支，再运行发布。');
  const config=yaml.load(fs.readFileSync(path.join(root,'_config.yml'),'utf8'));
  const branch=config.deploy?.branch||'main';
  if(branch==='source'||!/^[a-zA-Z0-9/_-]+$/.test(branch))throw Error('Invalid publishing branch');
  const source=git(['rev-parse','HEAD']);
  git(['fetch','origin','source',branch]);
  if(git(['rev-parse','origin/source'])!==source)throw Error('远程 source 与本地不同，请先推送最新源码。');
  const publicDir=inside(root,path.join(root,config.public_dir||'public'));
  for(const file of ['index.html','articles/index.html','music/index.html','search-index.json','.nojekyll'])if(!fs.existsSync(path.join(publicDir,file)))throw Error('Missing generated file: '+file+'，请先运行 npm run verify。');
  fs.mkdirSync(output,{recursive:true});
  const destination=inside(output,fs.mkdtempSync(path.join(output,'deploy-')));
  git(['worktree','add','--detach',destination,'origin/'+branch]);
  // 确认绝对路径属于本次创建的专用工作树后，才清理旧网页；保留 Git 元数据。
  for(const entry of fs.readdirSync(destination,{withFileTypes:true})){
    if(entry.name==='.git')continue;
    const target=inside(destination,path.resolve(destination,entry.name));
    fs.rmSync(target,{recursive:true,force:true});
  }
  for(const entry of fs.readdirSync(publicDir,{withFileTypes:true}))fs.cpSync(path.join(publicDir,entry.name),inside(destination,path.join(destination,entry.name)),{recursive:true});
  fs.writeFileSync(path.join(destination,'release.json'),JSON.stringify({source_commit:source,published_at:new Date().toISOString(),url:config.url},null,2)+'\n');
  fs.writeFileSync(path.join(destination,'README.md'),'# FLYFISHING\n\n网站：https://flyfish567.github.io/\n\n本分支是生成的静态网页。完整源码、文章和维护说明在 [source 分支](https://github.com/FLYFISH567/FLYFISH567.github.io/tree/source)。\n');
  git(['add','-A'],destination);git(['commit','-m','Publish FLYFISHING from source '+source.slice(0,12)],destination);
  const result={directory:destination,branch,source_commit:source,site_commit:git(['rev-parse','HEAD'],destination),url:config.url};
  fs.writeFileSync(path.join(output,'release-ready.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
  if(process.argv.includes('--prepare-only'))return;
  git(['push','origin','HEAD:'+branch],destination);
  git(['worktree','remove',destination]);console.log('Published: '+config.url);
}
try{main();}catch(error){console.error(error.stderr?.toString()||error.message);process.exitCode=1;}
