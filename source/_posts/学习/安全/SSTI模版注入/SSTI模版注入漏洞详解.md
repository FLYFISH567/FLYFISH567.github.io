---
title: SSTI模版注入漏洞详解
categories:
  - 学习
tags:
  - SSTI
abbrlink: b884c77c
---

![image-20250324172647170](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgweb.imgweb.imgimage-20250324172647170.png)

### 漏洞成因

1. 渲染模版时，没有严格控制对用户的输入

2. 使用了危险的模版，导致用户可以和flask程序进行交互

### 漏洞演示

#### 正常代码

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
    html_str='''
    	<html>
        <head><head>
        <body>{{str}}<body>
        <html>
        '''
	#my_word通过render_template_string函数加载到body中间
    #str是被{{}}包括起来的，会被预先渲染转义，然后才输出，不会被渲染执行
	return render_template_string(html_str，str=my_word)
                                                 
if __name__=='__main__':
	app.run()
```

#### 漏洞代码

```python
from importlib.resources import contents
import time
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
    html_str='''
    	<html>
        <head><head>
        <body>{{0}}<body> #{}里可以定义任何参数
        <html>
        '''.format(my_word)#my_word通过format()函数填充到body中间，
    #先将my_word填充到html_str中，再用render_template_string函数执行
	return render_template_string(html_str)#render_template_string会把{}内的字符串当做										  代码指令执行
                                                 
if __name__=='__main__':
	app.run()
```

#### 判断流程图

![image-20250324172647170](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250324172647170.png)