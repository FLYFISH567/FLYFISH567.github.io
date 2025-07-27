var posts=["article/hello-world/","article/大学/大学/","article/学习study/学习/","article/生活/生活/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };