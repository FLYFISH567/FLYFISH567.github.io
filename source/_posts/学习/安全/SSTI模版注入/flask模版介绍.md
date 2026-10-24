---
title: flask模版介绍
categories:
  - 学习
tags:
  - SSTI
abbrlink: ecf57750
---

![image-20250324172647170](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgweb.imgimage-20250324172647170.png)

### 视图函数

**作用**：生成请求的响应

**视图函数**只处理业务逻辑和数据处理

**使用模版**使用静态的页面html展示动态的内容

### Flask模版

**作用**：取得视图函数的数据进行展示，返回响应内容

#### `render_template`

**作用:**加载html文件。默认文件路径再templates目录

```python
from flask import Flask,render_template
app=Flask(__name__)
@app.route('/',methods=['GET'])
#定义视图函数index()
#读取index.html文件，将该模块内容进行渲染返回
def index():
	#静态提交
	my_str='hello flyfish'
	my_age=18
	#动态提交
	my_word=request.args.get('flyfish')
	#render template函数将my_str和my_age赋值后的变量传入index.html
	return render template("index.htm!",
                          my_str=my_str,
                          my_age=my_age,
                          my_word=my_word #动态获取
                          )
                                                 
if __name__=='__main__':
	app.run()
                                                 
                                                 
#在templates目录下创建index.html文件 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
模版页面
<br>
{{ my_str }} #接受传入的my_str内容，并执行将内容输出
<br>
{{ my_word }} #接受动态传入的my_word，并将内容输出
<br>
{% set a='flyfish' %}
{{ a }} #输出flyfish
</body>
</html>
```

#### `render_template_string`

**作用：**用于渲染字符串，直接定义内容

```python
from flask import Flask,render_template_string,request
app=Flask(__name__)
@app.route('/',methods=['GET'])
#定义视图函数index()
#读取index.html文件，将该模块内容进行渲染返回
def index():
	#静态提交
	my_str='hello flyfish'
	my_age=18
	#动态提交
	my_word=request.args.get('flyfish')
	#render_template_string函数将my_str和my_age赋值后的变量传入index.html
	return render_template_string('<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document</title></head><body>模版页面<br>%s</body></html>'%my_word)
                                                 
if __name__=='__main__':
	app.run()
```

