---
title: SSRF漏洞利用
categories:
  - 学习
tags:
  - SSRF
abbrlink: 9e62485f
---

### SSRF漏洞利用步骤：

1. 查找内网存活主机IP`file`
2. 查找内网主机开放端口 `dict`
3. 目录扫描 `http`
4. 漏洞利用

### 命令执行

#### GET提交

**利用`shell.php`进行命令执行**

1. `http://IP:80.shell.php?cmd=ls`执行命令
2. `gopher`~~记得加端口号和占位符~~

![image-20250401181646155](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250401181646155.png)

#### POST提交

1. `gopher`~~记得加端口号和占位符~~

![image-20250401181947212](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250401181947212.png)

![image-20250401182052820](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250401182052820.png)

### XXE漏洞利用

~~听不懂~~

### SQL注入漏洞利用