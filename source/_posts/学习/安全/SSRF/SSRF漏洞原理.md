---
title: SSRF漏洞原理
categories:
  - 学习
tags:
  - SSRF
abbrlink: 7cd8d249
---

SSRF(service side request forgery)服务器请求伪造

### 定义

是一种由攻击者形成服务器端发起的安全漏洞，本质上是属于信息泄露漏洞

### 攻击目标

从外网无法访问的**内部系统**

### **形成原因**

大部分是由于服务器提供了从其他服务器应用**获取数据**的功能，且没有对目标地址做过滤和限制

1. 从指定URL地址获取网页文本内容
2. 加载指定地址的图片，下载
3. 百度识图，给出一串URL就能识别出图片

#### 相关函数

漏洞产生相关函数：

```php
file_get_contents()、fsockopen()、curl_exec()、fopen()、readfile()
```

（1）file_get_contents()

```php
<?php
$url = $_GET['url'];;
echo file_get_contents($url);
?>
```

`file_get_content`函数从用户指定的url获取内容，然后指定一个文件名进行保存，并展示给用户。file_put_content函数把一个字符串写入文件中。

（2）fsockopen()

```php
<?php 
function GetFile($host,$port,$link) { 
    $fp = fsockopen($host, intval($port), $errno, $errstr, 30);   
    if (!$fp) { 
        echo "$errstr (error number $errno) \n"; 
    } else { 
        $out = "GET $link HTTP/1.1\r\n"; 
        $out .= "Host: $host\r\n"; 
        $out .= "Connection: Close\r\n\r\n"; 
        $out .= "\r\n"; 
        fwrite($fp, $out); 
        $contents=''; 
        while (!feof($fp)) { 
            $contents.= fgets($fp, 1024); 
        } 
        fclose($fp); 
        return $contents; 
    } 
}
?>
```

`fsockopen`函数实现对用户指定url数据的获取，该函数使用socket（端口跟服务器建立tcp连接，传输数据。变量host为主机名，port为端口，errstr表示错误信息将以字符串的信息返回，30为时限

（3）curl_exec()

```php
<?php 
if (isset($_POST['url'])){
    $link = $_POST['url'];
    $curlobj = curl_init();// 创建新的 cURL 资源
    curl_setopt($curlobj, CURLOPT_POST, 0);
    curl_setopt($curlobj,CURLOPT_URL,$link);
    curl_setopt($curlobj, CURLOPT_RETURNTRANSFER, 1);// 设置 URL 和相应的选项
    $result=curl_exec($curlobj);// 抓取 URL 并把它传递给浏览器
    curl_close($curlobj);// 关闭 cURL 资源，并且释放系统资源

    $filename = './curled/'.rand().'.txt';
    file_put_contents($filename, $result); 
    echo $result;
}
?>
```

`curl_exec`函数用于执行指定的cURL会话

**注意：**

```php
1.一般情况下PHP不会开启fopen的gopher wrapper
2.file_get_contents的gopher协议不能URL编码
3.file_get_contents关于Gopher的302跳转会出现bug，导致利用失败
4.curl/libcurl 7.43 上gopher协议存在bug(%00截断) 经测试7.49 可用
5.curl_exec() //默认不跟踪跳转，
6.file_get_contents() // file_get_contents支持php://input协议
```

### 攻击方式

![image-20250330161106857](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250330161106857.png)

### 漏洞利用

![image-20250330161814650](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250330161814650.png)

