---
title: SSRF基础知识
categories:
  - 学习
tags:
  - SSRF
abbrlink: 527f0671
---

## `curl`

### **1. `curl_init()`：初始化 cURL 会话**

#### **功能**

创建一个新的 cURL 句柄（资源对象），用于后续配置和请求。

#### **语法**

```
resource|false curl_init(?string $url = null)
```

#### **参数**

$url（可选）：初始化时直接设置请求的 URL。

- 若留空，需后续通过 `curl_setopt(CURLOPT_URL)` 设置。

#### **返回值**

- 成功：返回 cURL 句柄（`resource` 类型）。
- 失败：返回 `false`（极罕见，通常因内存不足）。

#### **示例**

```
$ch = curl_init("https://api.example.com/data"); // 直接初始化并设置 URL
```

#### **注意事项**

- **必须关闭句柄**：使用后务必调用 `curl_close($ch)` 释放资源。
- **复用句柄**：可通过 `curl_reset($ch)` 重置配置，避免重复初始化。

------

### **2. `curl_setopt()`：配置 cURL 选项**

#### **功能**

设置 cURL 会话的请求参数，控制请求方式、超时时间、返回格式等核心行为。

#### **语法**

```
bool curl_setopt(resource $ch, int $option, mixed $value)
```

#### **参数**

- `$ch`：cURL 句柄（由 `curl_init()` 返回）。
- `$option`：选项常量（如 `CURLOPT_URL`）。
- `$value`：选项值，类型由 `$option` 决定（如字符串、布尔值、数组）。

#### **常用选项**

| 选项常量                 | 作用                            | 值类型         |
| ------------------------ | ------------------------------- | -------------- |
| `CURLOPT_URL`            | 设置请求 URL                    | 字符串         |
| `CURLOPT_RETURNTRANSFER` | 返回内容到变量（不直接输出）    | `true`/`false` |
| `CURLOPT_POST`           | 启用 POST 请求                  | `true`/`false` |
| `CURLOPT_POSTFIELDS`     | 设置 POST 数据（表单或 JSON）   | 字符串/数组    |
| `CURLOPT_HTTPHEADER`     | 设置请求头（如 `Content-Type`） | 数组           |
| `CURLOPT_TIMEOUT`        | 设置超时时间（秒）              | 整数           |

#### **返回值**

- 成功：返回 `true`。
- 失败：返回 `false`（如无效选项或值类型错误）。

#### **示例**

```
curl_setopt($ch, CURLOPT_URL, "https://api.example.com");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // 返回内容到变量
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
```

#### **注意事项**

- **选项顺序**：必须在 `curl_exec()` 前调用。
- **类型匹配**：选项值与类型严格对应（如 `CURLOPT_TIMEOUT` 必须为整数）。

------

### **3. `curl_exec()`：执行 cURL 请求**

#### **功能**

根据配置发起 HTTP 请求，并返回服务器响应。

#### **语法**

```
mixed curl_exec(resource $ch)
```

#### **参数**

- `$ch`：已配置的 cURL 句柄。

#### **返回值**

- **成功且 `CURLOPT_RETURNTRANSFER=true`**：返回响应内容（字符串）。
- **成功但 `CURLOPT_RETURNTRANSFER=false`**：直接输出内容，返回 `true`。
- **失败**：返回 `false`（需结合 `curl_errno()` 排查错误）。

#### **示例**

```
$response = curl_exec($ch);
if ($response === false) {
    echo "Error: " . curl_error($ch);
} else {
    echo $response;
}
```

#### **注意事项**

- **输出控制**：务必设置 `CURLOPT_RETURNTRANSFER=true` 避免直接输出内容。
- **错误处理**：必须检查返回值是否为 `false`，防止静默失败。

------

### **4. `curl_close()`：关闭 cURL 会话**

#### **功能**

释放 cURL 句柄占用的系统资源，终止会话。

#### **语法**

```
void curl_close(resource $ch)
```

#### **参数**

- `$ch`：要关闭的 cURL 句柄。

#### **示例**

```
curl_close($ch); // 释放资源
```

#### **注意事项**

- **必须调用**：未关闭句柄会导致内存泄漏。
- **不可复用**：关闭后句柄失效，需重新初始化。

------

### **5. `curl_errno()`：获取错误代码**

#### **功能**

返回最后一次 cURL 操作的错误代码（整数形式）。

#### **语法**

```
int curl_errno(resource $ch)
```

#### **参数**

- `$ch`：已执行过 `curl_exec()` 的 cURL 句柄。

#### **返回值**

- **无错误**：返回 `0`。
- **有错误**：返回非零错误码（如 `6` 表示域名解析失败）。

#### **常见错误码**

| 错误码 | 常量名                       | 含义           |
| ------ | ---------------------------- | -------------- |
| `6`    | `CURLE_COULDNT_RESOLVE_HOST` | 域名解析失败   |
| `7`    | `CURLE_COULDNT_CONNECT`      | 连接服务器失败 |
| `28`   | `CURLE_OPERATION_TIMEOUTED`  | 请求超时       |

#### **示例**

```
if (curl_errno($ch)) {
    echo "Error Code: " . curl_errno($ch); // 输出错误码
}
```

#### **注意事项**

- **调用时机**：必须在 `curl_exec()` 之后调用，否则返回 `0`。
- **组合使用**：通常与 `curl_error()` 搭配获取详细错误信息。

------

### **完整使用流程示例**

```
// 1. 初始化
$ch = curl_init();

// 2. 配置选项
curl_setopt($ch, CURLOPT_URL, "https://api.example.com/data");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

// 3. 执行请求
$response = curl_exec($ch);

// 4. 错误处理
if ($response === false) {
    $errorCode = curl_errno($ch);
    $errorMsg = curl_error($ch);
    echo json_encode(["error" => "Code $errorCode: $errorMsg"]);
} else {
    echo $response;
}

// 5. 关闭会话
curl_close($ch);
```

------

### **总结**

| 函数            | 核心作用           | 关键注意事项                   |
| --------------- | ------------------ | ------------------------------ |
| `curl_init()`   | 创建会话句柄       | 必须关闭句柄（`curl_close()`） |
| `curl_setopt()` | 配置请求参数       | 严格匹配选项类型               |
| `curl_exec()`   | 执行请求并返回响应 | 检查返回值是否为 `false`       |
| `curl_close()`  | 释放资源           | 不可省略，避免内存泄漏         |
| `curl_errno()`  | 获取错误代码       | 必须与 `curl_error()` 结合使用 |

通