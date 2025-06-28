var posts=["article/大学/大学/","article/hello-world/","article/生活/生活/","article/学习study/学习/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };