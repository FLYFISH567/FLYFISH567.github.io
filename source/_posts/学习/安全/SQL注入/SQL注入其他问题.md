---
title: SQL注入其他问题
categories:
  - 学习
tags:
  - SQL注入
  - 奇奇怪怪的问题
abbrlink: f829d9e
---

## id=-1 和id= 1 的区别

**两种场景的本质区别**

| **场景**               | `id=-1` + `UNION`            | `id=1` + `ORDER BY`            |
| :--------------------- | :--------------------------- | :----------------------------- |
| **目标**               | 显示 `UNION` 后的自定义数据  | 探测原查询的列数               |
| **原查询是否需要结果** | 不需要（需返回空）           | 需要（确保 `ORDER BY` 能执行） |
| **核心逻辑**           | 绕过原数据，强制显示注入结果 | 利用错误或页面变化推断列数     |
| **数值选择**           | 用不存在的值（如 `-1`）      | 用存在的值（如 `1`）           |

## SQL注入语句注释

在 Sql 注入中，需要使用 Mysql 的注释符号，需要去注释注入语句后面的语句不被执行，Mysql中单行注释有两种方式，分别是#和-- (--后面有空格)

但是，需要注意的是，在url中，如果是get请求，解释执行的时候，url中#号是用来指导浏览器动作的，对服务器端无用。所以，HTTP请求中使用 get 传参时不包括#，因为使用 # 闭合无法注释，会报错；而使用-- （有个空格），在传输过程中空格会被忽略，同样导致无法注释，所以在get请求传参注入时才会使用 --+ 的方式来闭合，因为+会被解释成空格。

### 注释符号的差异与使用场景

**(1) `#` 符号**

- **特性**：

  - 在 MySQL 中为单行注释符号。

  - 在 URL 中的问题    #在 URL 中表示锚点（Hash），浏览器不会将其发送到服务器。

    ```
    ?id=1' UNION SELECT 1,2,3#
    ```

    实际发送到服务器的请求为 `?id=1' UNION SELECT 1,2,3`，`#` 及后续内容被丢弃，导致注释失效。

- **解决方案**：
  若需在 GET 请求中使用 `#`，需对其进行 URL 编码为 `%23`：

  ```url
  ?id=1' UNION SELECT 1,2,3%23
  ```

  服务器接收到的内容为 `1' UNION SELECT 1,2,3#`，注释生效。

**(2) `-- `（双破折号 + 空格）**

- **特性**：

  - 标准 SQL 单行注释符号，要求末尾必须跟随空格。

  - 在 URL 中的问题

    URL 传输时会自动忽略空格，导致注释失效。

    例如：

    ```url
    ?id=1' UNION SELECT 1,2,3-- 
    ```

    实际发送到服务器的请求为 `?id=1' UNION SELECT 1,2,3--`，缺少空格导致注释未生效。

- **解决方案**：
  使用 `--+` 或 `%20` 替代空格：

  ```url
  ?id=1' UNION SELECT 1,2,3--+    // + 被解析为空格
  ?id=1' UNION SELECT 1,2,3%20%20 // 直接编码空格为 %20
  ```

  服务器接收到的内容为 `1' UNION SELECT 1,2,3-- `，注释生效。

### 编码与传输细节

**(1) GET 请求的编码规则**

- **空格处理**：
  URL 中空格默认编码为 `%20`，但某些场景（如表单提交）可能转换为 `+`。
- **特殊符号**：
  `+` 在 URL 中表示空格，`%2B` 表示字面量 `+`。

**(2) 注释符号的编码总结**

| 符号 | 直接输入（浏览器自动处理） | 手动编码（确保安全）  |
| :--- | :------------------------- | :-------------------- |
| `#`  | ❌ 无效（被丢弃）           | `%23`                 |
| `--` | ❌ 空格丢失                 | `--%20` 或 `--+`      |
| `+`  | ✅ 解析为空格               | `%2B`（如需保留 `+`） |



## 主查询？子查询！

写题目的时候命令经常出错，感觉和wp里面命令没区别，但是自己写的又没有办法运行

（除少打，漏打，错打单词这些问题外）

所以总结了一下这个问题（感谢恩师deepseek）

```sql
快问快答,以下哪些命令有效，哪些命令无效
a. union select 1, (group_concat(table_name) FROM information_schema.tables), 3 -- 

b. union select 1, (select group_concat(table_name) FROM information_schema.tables),    3 --  

c.union select 1, group_concat(table_name) FROM information_schema.tables, 3 --   

d.union select 1, group_concat(table_name), 3  FROM information_schema.tables--   

```

~~a,c 无效  b,d 有效~~ ~~why?baby,why?tell,me!~~

#### 为什么a无效，b有效

**省流**

**子查询（` 主查询：union select 1,(子查询),3`）中一定要select！！！** 

**无论子查询是否包含 `FROM` 子句，都必须以 `SELECT` 开头**

**a. 无效语句**：

```sql
union select 1, (group_concat(table_name) FROM information_schema.tables), 3 --
```

错误原因：

1. **缺少`SELECT`关键字**：
   子查询 `(group_concat(table_name) FROM information_schema.tables)` 中没有 `SELECT`，导致语法不完整。
2. **非法结构**：
   SQL引擎会将 `group_concat(table_name) FROM ...` 解析为**字段表达式**（类似 `1+1`），但 `FROM` 子句不能直接附加在字段表达式后。
3. **错误提示**：
   数据库会报类似错误：
   `You have an error in your SQL syntax near 'FROM information_schema.tables)'`。

**b. 有效语句**：

```sql
union select 1, (SELECT group_concat(table_name) FROM information_schema.tables), 3 --
```

正确原因：

1. **子查询语法完整**：
   子查询 `(SELECT group_concat(table_name) FROM ...)` 是一个完整的 `SELECT` 语句，符合SQL语法规则。
2. **独立查询逻辑**：
   子查询独立执行，返回 `group_concat(table_name)` 的聚合结果，作为外层 `UNION SELECT` 的第二列值。

**对比总结**：

| 特性           | 语句a（无效）               | 语句b（有效）                      |
| :------------- | :-------------------------- | :--------------------------------- |
| **子查询结构** | `(group_concat() FROM ...)` | `(SELECT group_concat() FROM ...)` |
| **语法合法性** | ❌ 非法（缺少`SELECT`）      | ✅ 合法（子查询完整）               |
| **执行逻辑**   | 无法解析，查询终止          | 子查询独立执行，返回聚合结果       |

**为什么SQL强制要求子查询必须有`SELECT`？**

1. **语法规则**：
   SQL规定，子查询必须是一个完整的 `SELECT` 语句，即使它只返回一个值。

   ```sql
   -- 合法子查询（完整SELECT）
   (SELECT column FROM table)
   
   -- 非法子查询（缺少SELECT）
   (column FROM table)  -- 错误！
   ```

2. **语义明确性**：
   `SELECT` 关键字明确标识这是一个查询操作，而非字段表达式或函数调用。

#### 为什么c无效，d有效

~~**省流**~~

- **语句c** 因 `FROM` 子句后的非法表名 `3` 和字段数不匹配而失败。
- **语句d** 语法正确且字段数匹配，因此有效。

**c. 无效语句**：

```sql
union select 1, group_concat(table_name) FROM information_schema.tables, 3 -- 
```

错误原因：

1. **`FROM` 子句位置错误**：
   SQL 解析器会将 `FROM information_schema.tables, 3` 解释为：

   - `FROM information_schema.tables`：从 `information_schema.tables` 表查询。
   - `, 3`：试图将 `3` 作为另一个表名或别名，但 `3` 是数字，非法表名。

   这会导致语法错误：
   `You have an error in your SQL syntax near '3'`.

2. **字段数量不匹配**（如果存在 UNION 前置查询）：
   假设原查询有 3 列，而 `UNION SELECT` 后的语句实际返回 **2 列**（`1` 和 `group_concat(table_name)`），因为 `FROM` 子句被错误截断，导致字段数与原查询不匹配。

**d. 有效语句**：

```sql
union select 1, group_concat(table_name), 3 FROM information_schema.tables-- 
```

正确原因：

1. **语法正确性**：
   - `SELECT` 后明确列出 3 个字段：`1`, `group_concat(table_name)`, `3`。
   - `FROM information_schema.tables` 正确指向数据来源表，无额外非法符号。
2. **字段数量匹配**：
   此查询返回 3 列，与原查询（假设原查询有 3 列）匹配，满足 `UNION` 操作要求。

**对比总结**：

| 特性          | 语句c（无效）                               | 语句d（有效）                            |
| :------------ | :------------------------------------------ | :--------------------------------------- |
| **字段列表**  | `1, group_concat(table_name)`               | `1, group_concat(table_name), 3`         |
| **FROM 子句** | `FROM information_schema.tables, 3`（非法） | `FROM information_schema.tables`（合法） |
| **字段数量**  | 2 列（与原查询不匹配）                      | 3 列（与原查询匹配）                     |
| **解析结果**  | 语法错误（非法表名 `3`）                    | 合法查询                                 |

关键点解释：

1. **`FROM` 子句的语法规则**：
   `FROM` 后必须跟随 **表名或子查询**，不能直接跟数字或字段值。语句c中的 `, 3` 被解析为表名，导致非法语法。
2. **UNION 的字段数量要求**：
   `UNION` 操作要求前后查询的字段数一致。语句c实际返回 2 列（因 `FROM` 错误截断），与原查询的 3 列不匹配，导致执行失败（即使语法正确也会因字段数不匹配报错）。
3. **语句d的完整性**：
   - 明确返回 3 列：`1`, `group_concat(...)`, `3`。
   - `FROM` 子句正确指向表，无额外符号。
