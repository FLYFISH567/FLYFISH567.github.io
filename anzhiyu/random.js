var posts=["article/hello-world/","article/大学/大学/","article/生活/生活/","article/学习study/学习/","article/学习study/WP/[NSSround#28 Team ]Web WP /","article/学习study/WP/商丘师范学院第四届网络安全及信息对抗大赛/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };