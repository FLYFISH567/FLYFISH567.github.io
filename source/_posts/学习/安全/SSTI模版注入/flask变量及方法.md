---
title: flask基本架构、变量及方法
categories:
  - 学习
tags:
  - SSTI
abbrlink: 4d5bd16f
---

![image-20250324172647170](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250324172647170.png)

### Flask基本架构

```python
from flask import Flask #启动flask模块，创建一个Flask类
app = Flask(__name__) #__name__是系统变量，指的是本py文件的文件名

@app.route('/FLYFISH') 
#@app.route() 是一个装饰器，用于定义 URL 路由规则
#'/' 表示网站的根路径（首页）
#路由 基于浏览器输入的字符串寻址，当用户访问根路径时，Flask 会调用					   被装饰的函数来处理请求
					
def hello():  
    return "hello FLYFISH"
#视图函数 hello() 处理来自客户端的请求，返回的字符串会作为 HTTP 响应内容发送给浏览器

if __name__=='__main__':
	app.run(debug=True) 
#if __name__ == '__main__' 确保只有在直接运行该脚本时才会启动服务器
#app.run() 启动 Flask 内置的开发服务器
#调试模式：可通过 app.run(debug=True) 开启，会自动重载代码并显示错误信息
```



### Flask传参规则

#### 格式化字符串

**向规则参数添加变量部分，动态构建URL**

```python
from flask import Flask 
app = Flask(__name__) 

@app.route('/hello/<name>') #@app.route('/FLYFISH') 

#通过变量传参的方式将URL查询的内容变为输出的内容
def hello(name):  
    return "hello %s" % name #return "hello FLYFISH"

if __name__=='__main__':
	app.run(debug=True) 
    
#查询地址 127.0.0.1:5000/hello/动态变量
```

```python
# 路由定义格式
@app.route('/path/<parameter_type:variable_name>')
```

| **类型** | **语法**       | **说明**                             | **示例**                 |
| :------- | :------------- | :----------------------------------- | :----------------------- |
| 字符串   | `<string:var>` | 默认类型（可省略）接受不带斜杠的文本 | `/user/<string:name>`    |
| 整型     | `<int:var>`    | 仅接受正整数                         | `/post/<int:post_id>`    |
| 浮点型   | `<float:var>`  | 接受浮点数                           | `/value/<float:num>`     |
| 路径型   | `<path:var>`   | 类似字符串但接受斜杠                 | `/file/<path:file_path>` |
| UUID     | `<uuid:var>`   | 验证 UUID 格式                       | `/resource/<uuid:uid>`   |

**特性：**

- 自动类型校验（类型不匹配返回 404）

- 参数直接作为视图函数参数

- 支持多参数组合：

  ```python
  @app.route('/blog/<int:year>/<month>/<slug:title>')
  def show_post(year, month, title):
      return f"{year}年{month}月文章：{title}"
  ```

**示例：**

```python
@app.route('/product/<category>/<int:product_id>')
def product_detail(category, product_id):
    return f"{category}类商品ID：{product_id}"
```

#### 变量传参方法

**HTTP方法**

| **方式**  | **获取方法**            | **适用场景**     | **示例**                  |
| :-------- | :---------------------- | :--------------- | :------------------------ |
| 查询参数  | `request.args.get()`    | GET 请求附加参数 | `?page=2&sort=price`      |
| 表单数据  | `request.form.get()`    | POST 表单提交    | 登录表单字段              |
| JSON 数据 | `request.get_json()`    | API 请求         | `{"username": "flyfish"}` |
| 文件上传  | `request.files.get()`   | 文件上传         | 图片/文档上传             |
| Cookies   | `request.cookies.get()` | 客户端状态保持   | 用户身份标识              |
| 请求头    | `request.headers.get()` | 获取特殊头信息   | 认证令牌获取              |

**通用参数获取方法：**

```python
from flask import request

# 获取单个参数（带默认值）
page = request.args.get('page', 1, type=int)

# 获取多个同名参数
tags = request.args.getlist('tags')

# 强制类型转换
price_min = request.args.get('price_min', 0.0, type=float)
```

**混合使用示例：**

```python
@app.route('/search')
def search():
    # 路径参数 + 查询参数
    keyword = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    return f"搜索 {keyword} - 第 {page} 页"
```