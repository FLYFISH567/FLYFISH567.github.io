---
title: PHP反序列化基础知识
categories:
  - 学习
tags:
  - PHP反序列化
---

### 面向对象

PHP 的面向对象是一种编程范式，通过将数据和操作数据的方法封装成独立的单元（即**类**和**对象**），使代码更模块化、可重用且易于维护。核心概念包括：

- **封装（Encapsulation）**：隐藏内部实现细节，暴露必要接口。
- **继承（Inheritance）**：子类可以继承父类的属性和方法。
- **多态（Polymorphism）**：同一方法在不同对象中有不同实现。

### 类

#### 类的结构

**结构**：定义类名、定义成员变量（属性）、定义成员函数（方法）

```php
class class_Name{
    //成员变量声明
    //成员函数声明
}
```

#### 类的内容

**创建一个类**

```php+HTML
<?php
class hero{				 #定义类（类名）
	var $name;			 #//声明成员变量
	var $sex;			 #var为一种修饰符
	function FLY($var1){  #声明成员函数
		echo $this->name; #使用预定义$this调用成员变量
		echo $var1;		 # 成员函数传参$var1可直接调用
	}
}
?>
```



#### 实例化和赋值

```php
<?php
class hero{				 #定义类（类名）
	var $name;			 #//声明成员变量
	var $sex;			 #var为一种修饰符
	function FLY($var1){  #声明成员函数
		echo $this->name; #使用预定义$this调用成员变量
		echo $var1;		 # 成员函数传参$var1可直接调用
	}
}

$a=new hero();			  #实例化类hero()为对象a
$a->name='FLYFISH'; 	  #参数赋值
$a->sex='Unknown';
$a->FLY('刚满十八岁~');    #调用函数 
print_r($a);			 #打印对象a
?>
#输出
FLYFISH刚满十八岁~hero Object
(
    [name] => FLYFISH
    [sex] => Unknown
)
```



#### 类的修饰符

在类中直接声明的变量成为成员属性

可以在类中声明多个变量，即"对象"中可以有多个成员属性，每个变量都存储"对象"不同的属性信息

访问权限修饰符：对属性的定义

常用访问权限修饰符：

|             | 类的内部 | 类的子部 | 类的外部 |
| :---------: | :------: | :------: | :------: |
|  `public`   |    √     |    √     |    √     |
| `protected` |    √     |    √     |    ×     |
|  `private`  |    √     |    ×     |    ×     |

```php
<?php
class hero{				 #定义类（类名）
	public $name='FLYFISH'; #公有
	private $sex='Unknown'; #私有
    protected $length='170'; #受保护，子类可用
	function FLY($var1){  #声明成员函数
		echo $this->name; #使用预定义$this调用成员变量
		echo $var1;		 # 成员函数传参$var1可直接调用
	}
}

$a=new hero();			  #实例化类hero()为对象a
echo $a->name;			  #public 外部可用
echo $a->sex;			  #private 外部不可用
echo $a->length;		  #protected外部不可用

?>
```

```php
<?php
class hero{				 #定义类（类名）
	public $name='FLYFISH'; #公有
	private $sex='Unknown'; #私有
    protected $length='170'; #受保护，子类可用
	function FLY($var1){  #声明成员函数
		echo $this->name; #使用预定义$this调用成员变量
		echo $var1;		 # 成员函数传参$var1可直接调用
	}
}

class heroson expends hero{
    function test(){
        echo $this->name; #public 子类可用
        echo $this->sex;  #private 子类不可用
        echo $this->length;# protected 子类可用
    }
}

$a=new hero();			  #实例化类hero()为对象a
$b=new heroson();
echo $hero->name;  		  #外部只可用public
echo $hero->test();		  #子类内部只可用public和protected

?>
```

### 序列化基础知识

#### 序列化的作用

**序列化**是指将对象的状态信息（属性）转化为可以存储或传输的形式的过程

| 对象或数组 | 序列化 | 可存储可运输 |
| :--------: | :----: | :----------: |
|    对象    | ————>  |    字符串    |

#### 序列化之后的表达方式/格式

```php
#所有格式第一位是数据类型的英文字母简写
<?php
#空字符
$a=null;  
echo serialize($a);  #输出N;  !有分号

#整形
$b=6;
echo serialize($b);  #i:6;

#浮点型
$c=6.6;
echo serialize($c);  #d:6.6;

#布尔型
$d=true(false);
echo serialize($d)   #b:1;(b:0;)
    
#字符串
$e='FLYFISH';
echo serialize($e)    #s:7:"FLYFISH";

#数组
$f=array("flyfish","18","6.66");
echo $f[0];   
#flyfish
echo serialize($f); 
#a(代表数字):3(3个内容):{i:0(编号);s:7(长度):"flyfish";i:1;s:2:"18";i:2;s:4:"6.66";}
?>
```

#### 对象序列化

**不能序列化类，可以序列化对象**

**不序列化成员函数，只序列化成员变量**

##### 公有变量

```php
<?php
class hero{				 #定义类（类名）
	public $name = 'FLYFISH'; #公有
	function FLY($var1){  #声明成员函数
		echo $this->name; #使用预定义$this调用成员变量
		echo $var1;		 # 成员函数传参$var1可直接调用
	}
}

$a=new hero();			  #实例化类hero()为对象a
echo serialize($a);
#O:4(长度):"hero"(类名):1(变量数量):{s:4(变量名字长度):"name"(变量名字);s:7(值的长度):"FLYFISH"(变量值);}
?>
    
```

##### 私有变量

**`private`私有属性序列化时，在变量名前加`%00类名%00`**

```php
<?php
class hero{				 #定义类（类名）
	private $name = 'FLYFISH'; #私有
	function FLY($var1){  #声明成员函数
		echo $this->name; #使用预定义$this调用成员变量
		echo $var1;		 # 成员函数传参$var1可直接调用
	}
}

$a=new hero();			  #实例化类hero()为对象a
echo serialize($a);
#O:4:"hero":1:{s:10:"heroname";s:7:"FLYFISH";}
#这里看不见空白符
echo urlencode(serialize($a));
#O%3A4%3A%22hero%22%3A1%3A%7Bs%3A10%3A%22%00hero%00name%22%3Bs%3A7%3A%22FLYFISH%22%3B%7D 
#可以注意到私有变量name前自动添加了%00hero%00
?>
```

##### 受保护变量

**`protected`受保护属性序列化时，在变量名前加`%00*%00`**

```php
<?php
class hero{				 #定义类（类名）
	protected $name = 'FLYFISH'; #受保护
	function FLY($var1){  #声明成员函数
		echo $this->name; #使用预定义$this调用成员变量
		echo $var1;		 # 成员函数传参$var1可直接调用
	}
}

$a=new hero();			  #实例化类hero()为对象a
echo serialize($a);
#O:4:"hero":1:{s:7:"*name";s:7:"FLYFISH";}
?>
```

##### 对象序列化

```php
<?php
highlight_file(__FILE__);
class test{
    var $pub='benben';
    function jineng(){
        echo $this->pub;
    }
}
class test2{
    var $ben;
    function __construct(){
        $this->ben=new test();
    }
}
$a = new test2();
echo serialize($a);
?>
#O:5(类名长度):"test2(类名)":1(变量数):{s:3(变量名长度):"ben(变量名)";O:4(类名长度):"test":1:{s:3:"pub";s:6:"benben";}}
```

### 反序列化

#### 特性

1. **反序列化之后的内容为一个对象**

2. **反序列化生成的对象里的值，由反序列化中的值提供；与原有类预定义的值无关**
3. **反序列化不触发类的成员方法；需要调用方法后才能触发**

#### 作用

**将序列化后的参数还原成实例化的对象**

![image-20250407083338915](https://flyfish567.oss-cn-shenzhen.aliyuncs.com/web.imgimage-20250407083338915.png)

### 例题

```php
<?php
highlight_file(__FILE__);
error_reporting(0);
class test{
    public $a = 'echo "this is test!!";';
    public function displayVar() {
        eval($this->a);
    }
}


$get = $_GET["benben"];		//benben为对象序列化后的字符串
$b = unserialize($get);		//$b把字符串$get反序列化为对象，可通过更改字符串得到对象$a的值
$b->displayVar() ;			//通过调用方法触发可控代码

?>
```

`?benben=O:4:"test":1:{s:1:"a";s:13:"system("id");";};`

获取id内容
