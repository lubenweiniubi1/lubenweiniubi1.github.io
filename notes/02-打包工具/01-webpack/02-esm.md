# ES Module 核心特性详解

ES Module（ESM）作为JavaScript官方的模块化标准，其核心特性使其在现代前端开发中占据主导地位。以下是ES Module的六大核心特性：

## 一、静态分析（Static Analysis）

### 1.1 编译时确定依赖关系

**核心原理**：ES Module的导入导出关系在代码解析阶段即可确定，无需执行代码。

```javascript
// ✅ 正确：静态导入（编译时确定）
import { func } from './module.js';

// ❌ 错误：动态导入（运行时确定）
const moduleName = './module.js';
import { func } from moduleName; // 语法错误

// ❌ 错误：条件导入
if (condition) {
    import { func } from './module.js'; // 语法错误
}
```

### 1.2 与CommonJS的对比

```javascript
// ES Module：静态分析
import { func } from './module.js'; 
// ↑ 编译时就知道需要导入func

// CommonJS：动态分析
const module = require('./module.js');
// ↑ 运行时才知道导入了什么
```

### 1.3 静态分析的优势

- **依赖图谱构建**：打包工具可以在编译阶段构建完整的依赖关系图
- **代码优化**：支持Tree Shaking、Scope Hoisting等优化
- **类型检查**：支持静态类型检查工具（如TypeScript）
- **错误提前发现**：导入不存在的模块会在编译时报错

## 二、Tree Shaking（摇树优化）

### 2.1 核心原理

Tree Shaking是一种基于ES Module静态分析的代码优化技术，通过构建模块依赖图谱，在编译时识别并移除未被引用的"死代码"。

```javascript
// utils.js
export const usedFunc = () => console.log('used');
export const unusedFunc = () => console.log('unused');

// app.js
import { usedFunc } from './utils.js';
usedFunc();

// 打包后，unusedFunc会被移除（Tree Shaking）
```

### 2.2 Tree Shaking的工作流程

1. **静态分析**：构建模块依赖图谱
2. **标记未使用导出**：识别未被引用的导出
3. **标记副作用**：根据`sideEffects`配置判断模块是否有副作用
4. **代码压缩**：结合Terser等压缩工具移除死代码

### 2.3 Tree Shaking生效条件

```javascript
// ✅ 有效：纯ESM语法
import { func } from './module.js';

// ❌ 无效：CommonJS混用
const module = require('./module.js');

// ❌ 无效：动态导入
import('./module.js').then(module => {
    module.func();
});

// ❌ 无效：计算属性导出
export { [computedName]: value };
```

### 2.4 package.json配置

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "sideEffects": false,
  "module": "dist/esm/index.js",
  "main": "dist/cjs/index.js"
}
```


| 配置项 | 含义 | 作用 |
|--------|------|------|
| **`sideEffects`** | 副作用标记 | `false` - 告诉打包工具可安全删除未使用代码（Tree Shaking） |
| **`module`** | ESM 入口 | `"dist/esm/index.js"` - `import` 时加载，支持现代模块化 |
| **`main`** | CJS 入口 | `"dist/cjs/index.js"` - `require` 时加载，兼容 Node/旧项目 |

## 核心逻辑

- **双入口**：同时支持 ESM（现代）和 CommonJS（传统）
- **优化**：`sideEffects: false` 让打包工具能删除未使用的代码，减小体积
- **优先级**：现代构建工具（Webpack/Rollup）优先使用 `module` 字段

## 三、单例模式（Singleton）

### 3.1 模块只执行一次

**核心特性**：无论import多少次，模块只会执行一次，所有import共享同一个实例。

```javascript
// counter.js
console.log('模块执行');
export let count = 0;
export function increment() {
    count++;
}

// app1.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1

// app2.js
import { count } from './counter.js';
console.log(count); // 1（共享同一个实例）
```

### 3.2 执行流程

```
第一次import → [加载] → [解析] → [执行] → [缓存]
后续import → [从缓存获取] → [返回实例]
```

### 3.3 实际应用场景

```javascript
// store.js（单例模式）
export const store = {
    data: {},
    setData(key, value) {
        this.data[key] = value;
    },
    getData(key) {
        return this.data[key];
    }
};

// component1.js
import { store } from './store.js';
store.setData('user', { name: '张三' });

// component2.js
import { store } from './store.js';
console.log(store.getData('user')); // { name: '张三' }
```

## 四、值的绑定（Live Binding）

### 4.1 自动更新机制

**核心特性**：import的值会随着export的值变化而自动更新。

```javascript
// counter.js
export let count = 0;
export function increment() {
    count++;
}

// app.js
import { count, increment } from './counter.js';

console.log(count); // 0
increment();
console.log(count); // 1（自动更新）
```

### 4.2 与CommonJS的对比

```javascript
// ES Module：值的绑定（引用）
// counter.js
export let count = 0;
export function increment() {
    count++;
}

// app.js
import { count, increment } from './counter.js';
console.log(count); // 0
increment();
console.log(count); // 1（自动更新）

// ========================================
// CommonJS：值的拷贝（副本）
// counter.js
exports.count = 0;
exports.increment = function() {
    exports.count++;
};

// app.js
const counter = require('./counter.js');
console.log(counter.count); // 0
counter.increment();
console.log(counter.count); // 0（不会自动更新）
```

### 4.3 绑定机制详解

```javascript
// module.js
export let value = 1;

setTimeout(() => {
    value = 2; // 修改导出的值
}, 1000);

// app.js
import { value } from './module.js';

console.log(value); // 1
setTimeout(() => {
    console.log(value); // 2（自动更新）
}, 1500);
```

## 五、循环依赖处理

### 5.1 循环依赖的定义

```javascript
// a.js
import { bFunc } from './b.js';
export const aFunc = () => console.log('a');
bFunc(); // 可以正常调用

// b.js
import { aFunc } from './a.js';
export const bFunc = () => console.log('b');
aFunc(); // 可以正常调用
```

### 5.2 ES Module vs CommonJS

```javascript
// ES Module：支持循环依赖
// a.js
import { bValue } from './b.js';
export const aValue = 'A';
console.log(bValue); // undefined（但不会报错）

// b.js
import { aValue } from './a.js';
export const bValue = 'B';
console.log(aValue); // undefined（但不会报错）

// ========================================
// CommonJS：循环依赖问题
// a.js
const b = require('./b.js');
module.exports = { name: 'A' };
console.log(b.name); // undefined

// b.js
const a = require('./a.js');
module.exports = { name: 'B' };
console.log(a.name); // undefined
```

### 5.3 循环依赖的最佳实践

```javascript
// 避免循环依赖
// utils.js（公共工具）
export function helper() {
    return 'helper';
}

// moduleA.js
import { helper } from './utils.js';
export function funcA() {
    return helper();
}

// moduleB.js
import { helper } from './utils.js';
export function funcB() {
    return helper();
}
```

## 六、动态导入（Dynamic Import）

### 6.1 语法特性

```javascript
// 动态导入（返回Promise）
button.addEventListener('click', async () => {
    const module = await import('./module.js');
    module.default();
});

// 条件导入
if (condition) {
    import('./module1.js').then(module => {
        module.func();
    });
} else {
    import('./module2.js').then(module => {
        module.func();
    });
}

// 懒加载
function loadComponent(name) {
    return import(`./components/${name}.js`);
}
```

### 6.2 应用场景

```javascript
// 路由懒加载
const routes = [
    {
        path: '/home',
        component: () => import('./views/Home.vue')
    },
    {
        path: '/about',
        component: () => import('./views/About.vue')
    }
];

// 按需加载功能模块
async function loadFeature(featureName) {
    const module = await import(`./features/${featureName}.js`);
    return module.default;
}

// 条件加载
if (isMobile) {
    import('./mobile-optimized.js');
} else {
    import('./desktop-optimized.js');
}
```

## 七、核心特性对比总结

| 特性 | 说明 | 优势 | 限制 |
|------|------|------|------|
| **静态分析** | 编译时确定依赖关系 | 支持Tree Shaking、类型检查 | 不能动态导入 |
| **Tree Shaking** | 移除未使用的代码 | 减小打包体积 | 需要纯ESM语法 |
| **单例模式** | 模块只执行一次 | 共享状态、节省资源 | 无法创建多个实例 |
| **值的绑定** | import值自动更新 | 实时同步、引用传递 | 可能导致意外修改 |
| **循环依赖** | 支持模块间循环引用 | 灵活性高 | 需要谨慎设计 |
| **动态导入** | 运行时按需加载 | 代码分割、懒加载 | 不支持Tree Shaking |

## 八、实际应用示例

### 8.1 大型项目模块化

```javascript
// src/
// ├── main.js
// ├── components/
// │   ├── Header.js
// │   ├── Footer.js
// │   └── Sidebar.js
// ├── utils/
// │   ├── helpers.js
// │   └── validators.js
// └── services/
//     ├── api.js
//     └── auth.js

// main.js
import { Header, Footer } from './components';
import { apiService } from './services/api';
import { validateEmail } from './utils/validators';

// 支持Tree Shaking，未使用的导出会被移除
```

### 8.2 库开发

```javascript
// my-library/
// ├── index.js (ESM entry)
// ├── cjs/index.js (CommonJS entry)
// └── package.json

// package.json
{
  "name": "my-library",
  "version": "1.0.0",
  "main": "cjs/index.js",
  "module": "index.js",
  "sideEffects": false
}

// index.js (ESM)
export { default as Button } from './Button.js';
export { default as Modal } from './Modal.js';
```


# 其他特性
## 一、严格模式（Strict Mode）

### 1.1 自动启用严格模式

**核心特性**：ES Module**自动启用严格模式**，无需手动添加`'use strict'`。

```javascript
// ES Module文件（自动严格模式）
export function test() {
    // 这里已经是严格模式
    // 无需写 'use strict'
}

// 对比：普通脚本文件
// script.js
function test() {
    'use strict'; // 需要手动声明
}
```

### 1.2 严格模式的具体表现

#### 1.2.1 禁止使用未声明的变量

```javascript
// ❌ 错误：未声明的变量
export function test() {
    undeclaredVar = 10; // ReferenceError: undeclaredVar is not defined
}
```

#### 1.2.2 禁止删除变量和函数

```javascript
// ❌ 错误：删除变量
export function test() {
    var x = 10;
    delete x; // SyntaxError: Delete of an unqualified identifier in strict mode
}
```

#### 1.2.3 禁止使用保留字作为变量名

```javascript
// ❌ 错误：使用保留字
export function test() {
    var interface = 10; // SyntaxError: Unexpected strict mode reserved word
}
```

#### 1.2.4 this绑定规则

```javascript
// ES Module中
export function test() {
    console.log(this); // undefined（严格模式下）
}

// 普通脚本中（非严格模式）
function test() {
    console.log(this); // window
}
```

#### 1.2.5 禁止八进制字面量

```javascript
// ❌ 错误：八进制字面量
export function test() {
    var num = 010; // SyntaxError: Octal literals are not allowed in strict mode
}
```

### 1.3 严格模式的优势

- **安全性**：防止意外创建全局变量
- **性能**：JavaScript引擎可以进行更多优化
- **错误检测**：提前发现潜在问题
- **未来兼容**：为新特性铺路

---

## 二、作用域隔离（Scope Isolation）

### 2.1 模块级作用域

**核心特性**：每个ES Module拥有独立的作用域，模块间的变量不会相互污染。

```javascript
// moduleA.js
const shared = 'moduleA';
export function getShared() {
    return shared;
}

// moduleB.js
const shared = 'moduleB'; // 不会与moduleA冲突
export function getShared() {
    return shared;
}

// app.js
import { getShared as getA } from './moduleA.js';
import { getShared as getB } from './moduleB.js';

console.log(getA()); // 'moduleA'
console.log(getB()); // 'moduleB'
```

### 2.2 与全局作用域的隔离

```javascript
// module.js
const privateVar = '私有变量';
function privateFunc() {
    return privateVar;
}

export function publicFunc() {
    return privateFunc();
}

// app.js
import { publicFunc } from './module.js';
console.log(publicFunc()); // '私有变量'
console.log(privateVar); // ReferenceError: privateVar is not defined
console.log(privateFunc); // ReferenceError: privateFunc is not defined
```

### 2.3 顶层变量不会污染全局

```javascript
// module.js
var globalVar = 'module var'; // 不会挂载到window
let localVar = 'let var';
const constVar = 'const var';

export function check() {
    console.log(window.globalVar); // undefined
    console.log(window.localVar); // undefined
    console.log(window.constVar); // undefined
}

// 对比：普通脚本
// script.js
var scriptVar = 'script var';
console.log(window.scriptVar); // 'script var'（污染全局）
```

### 2.4 循环依赖中的作用域

```javascript
// a.js
console.log('a开始执行');
import { bValue } from './b.js';
export const aValue = 'A';
console.log('bValue:', bValue); // undefined（但不会报错）
console.log('a结束执行');

// b.js
console.log('b开始执行');
import { aValue } from './a.js';
export const bValue = 'B';
console.log('aValue:', aValue); // undefined（但不会报错）
console.log('b结束执行');

// 执行顺序：
// 1. a开始执行
// 2. b开始执行
// 3. aValue: undefined
// 4. b结束执行
// 5. bValue: undefined
// 6. a结束执行
```

循环引用问题本质原因：模块在执行阶段相互导入，但此时对方的变量还未初始化完成。
```
a.js 开始 → 导入 b.js → b.js 开始 → 导入 a.js 
→ a.js 返回已声明但未赋值的 aValue(undefined) → b.js 继续执行
→ b.js 返回已声明但未赋值的 bValue(undefined) → a.js 继续执行
```

#### 为什么是 undefined 而不是报错？
webpack 打包行为，直接运行报错
ES6 模块有提升机制：
+ export 声明会被提升
+ 但赋值发生在代码执行时
+ 导入时拿到的是变量的实时绑定，但此时还未赋值
---

## 三、CORS（跨域资源共享）

### 3.1 ESM的CORS要求

**核心特性**：浏览器中的ES Module**默认启用CORS检查**，跨域导入需要服务器配置CORS头。

```html
<!-- HTML中使用ESM -->
<script type="module">
    import { func } from 'https://cdn.example.com/module.js';
    func();
</script>
```

### 3.2 CORS配置要求

#### 3.2.1 服务器响应头

```http
# 必需的CORS头
Access-Control-Allow-Origin: *
# 或指定域名
Access-Control-Allow-Origin: https://your-domain.com

# 可选的CORS头
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

#### 3.2.2 Node.js服务器配置

```javascript
// Express服务器
const express = require('express');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/module.js', (req, res) => {
    res.header('Content-Type', 'application/javascript');
    res.sendFile(__dirname + '/module.js');
});

app.listen(3000);
```

#### 3.2.3 Nginx配置

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        # CORS配置
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type';
        
        # ESM MIME类型
        types {
            application/javascript js;
        }
    }
}
```

### 3.3 CORS错误示例

```javascript
// ❌ 错误：跨域导入未配置CORS
// 浏览器控制台错误：
// Access to script at 'https://other-domain.com/module.js' 
// from origin 'https://your-domain.com' has been blocked 
// by CORS policy: No 'Access-Control-Allow-Origin' header 
// is present on the requested resource.

// ✅ 正确：同域导入
import { func } from '/local/module.js'; // 不需要CORS
```

### 3.4 跨域导入的最佳实践

```javascript
// 1. 使用CDN时确保CORS配置
import { func } from 'https://cdn.jsdelivr.net/npm/my-library@1.0.0/module.js';

// 2. 开发环境使用代理
// vite.config.js
export default {
    server: {
        proxy: {
            '/api': {
                target: 'https://remote-server.com',
                changeOrigin: true
            }
        }
    }
};

// 3. 生产环境使用同域资源
import { func } from '/assets/module.js';
```

---

## 四、MIME类型检查

### 4.1 严格的MIME类型要求

**核心特性**：浏览器对ES Module的MIME类型有严格要求，必须是有效的JavaScript MIME类型。

```http
# ✅ 正确的MIME类型
Content-Type: application/javascript
Content-Type: text/javascript
Content-Type: application/ecmascript
Content-Type: text/ecmascript

# ❌ 错误的MIME类型
Content-Type: text/plain
Content-Type: application/octet-stream
```

### 4.2 MIME类型错误示例

```javascript
// ❌ 错误：服务器返回text/plain
// 浏览器控制台错误：
// Failed to load module script: The server responded with a 
// non-JavaScript MIME type of "text/plain". Strict MIME type 
// checking is enforced for module scripts per HTML spec.

// ✅ 正确：服务器返回application/javascript
// Content-Type: application/javascript
```

### 4.3 服务器MIME类型配置

#### 4.3.1 Node.js/Express

```javascript
app.get('*.js', (req, res, next) => {
    res.header('Content-Type', 'application/javascript');
    next();
});
```

#### 4.3.2 Apache

```apache
# .htaccess
<FilesMatch "\.js$">
    Header set Content-Type "application/javascript"
</FilesMatch>
```

#### 4.3.3 静态文件服务器

```javascript
// 使用正确的MIME类型
const fs = require('fs');
const http = require('http');

http.createServer((req, res) => {
    if (req.url.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
        fs.createReadStream(__dirname + req.url).pipe(res);
    }
}).listen(3000);
```

---

## 
（由于篇幅限制，我将继续补充其他核心特性）

## 五、顶层await（Top-level Await）

### 5.1 语法特性

**核心特性**：ES Module支持在模块顶层使用`await`，无需包裹在async函数中。

```javascript
// ✅ 正确：顶层await（ES2022）
const response = await fetch('/api/data');
const data = await response.json();
export const apiData = data;

// ❌ 错误：普通脚本不支持
// const data = await fetch('/api/data'); // SyntaxError
```

### 5.2 使用场景

```javascript
// 1. 初始化配置
const configResponse = await fetch('/config.json');
export const config = await configResponse.json();

// 2. 动态导入
const module = await import(`./locales/${navigator.language}.js`);
export const translations = module.default;

// 3. 资源预加载
const [user, settings] = await Promise.all([
    fetch('/api/user').then(r => r.json()),
    fetch('/api/settings').then(r => r.json())
]);
export { user, settings };
```

### 5.3 执行顺序

```javascript
// moduleA.js
console.log('A开始');
await new Promise(resolve => setTimeout(resolve, 1000));
console.log('A完成');
export const a = 'A';

// moduleB.js
console.log('B开始');
import { a } from './moduleA.js';
console.log('B导入A:', a);
export const b = 'B';

// app.js
import { b } from './moduleB.js';
console.log('app:', b);

// 执行顺序：
// 1. A开始
// 2. (等待1秒)
// 3. A完成
// 4. B开始
// 5. B导入A: A
// 6. app: B
```

---

## 六、导入断言（Import Assertions）

### 6.1 语法特性（ES2022）

**核心特性**：允许在导入时指定模块类型，增强安全性。

```javascript
// JSON导入
const { default: config } = await import('./config.json', {
    assert: { type: 'json' }
});

// CSS导入
import sheet from './styles.css' assert { type: 'css' };

// 静态导入
import config from './config.json' assert { type: 'json' };
```

### 6.2 安全性优势

```javascript
// 防止MIME类型欺骗
// 服务器返回JavaScript，但声称是JSON
// import assertions会检测并拒绝

// ✅ 安全：类型验证
import data from './data.json' assert { type: 'json' };
// 如果服务器返回非JSON，会抛出错误

// ❌ 不安全：无类型验证
import data from './data.json'; // 可能执行恶意代码
```

---

## 七、导入映射（Import Maps）

### 7.1 语法特性

**核心特性**：允许在HTML中定义模块导入的映射关系，实现别名和版本管理。

```html
<script type="importmap">
{
    "imports": {
        "react": "https://cdn.jsdelivr.net/npm/react@18.2.0/index.js",
        "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@18.2.0/index.js",
        "@utils/": "/src/utils/",
        "lodash": "/node_modules/lodash-es/lodash.js"
    }
}
</script>

<script type="module">
    import React from 'react';
    import { debounce } from 'lodash';
    import { helper } from '@utils/helpers.js';
</script>
```

### 7.2 使用场景

```html
<!-- 1. CDN别名 -->
<script type="importmap">
{
    "imports": {
        "vue": "https://cdn.jsdelivr.net/npm/vue@3.2.0/dist/vue.esm-browser.js"
    }
}
</script>

<!-- 2. 路径别名 -->
<script type="importmap">
{
    "imports": {
        "@components/": "/src/components/",
        "@utils/": "/src/utils/"
    }
}
</script>

<!-- 3. 版本管理 -->
<script type="importmap">
{
    "imports": {
        "my-library": "/libs/my-library@2.0.0/index.js"
    }
}
</script>
```

---

## 八、模块标识符解析

### 8.1 URL解析规则

```javascript
// 绝对URL
import { func } from 'https://example.com/module.js';

// 相对路径（相对于当前模块）
import { func } from './module.js';      // 同目录
import { func } from '../module.js';     // 上级目录
import { func } from './sub/module.js';  // 子目录

// 无前缀路径（相对于baseUrl）
import { func } from 'module';  // 需要import map或构建工具

// 文件扩展名（必需）
import { func } from './module.js';   // ✅ 正确
import { func } from './module';      // ❌ 错误（浏览器中）
```

### 8.2 Node.js中的解析规则

```javascript
// Node.js 14+ 支持ESM
// package.json: { "type": "module" }

// 相对路径
import { func } from './module.js';
import { func } from './module';  // ✅ Node.js支持省略扩展名

// 包导入
import express from 'express';  // 从node_modules查找

// 子路径导入
import { Router } from 'express/router';
```

---

## 九、核心特性完整对比表

| 特性 | 说明 | 浏览器支持 | Node.js支持 |
|------|------|------------|-------------|
| **静态分析** | 编译时确定依赖 | ✅ | ✅ |
| **严格模式** | 自动启用 | ✅ | ✅ |
| **作用域隔离** | 模块级作用域 | ✅ | ✅ |
| **Tree Shaking** | 移除未使用代码 | 构建工具 | 构建工具 |
| **值的绑定** | Live Binding | ✅ | ✅ |
| **单例模式** | 模块只执行一次 | ✅ | ✅ |
| **循环依赖** | 支持循环引用 | ✅ | ✅ |
| **动态导入** | 运行时导入 | ✅ | ✅ |
| **CORS** | 跨域检查 | ✅ | ❌ |
| **MIME类型** | 严格检查 | ✅ | ❌ |
| **顶层await** | 模块顶层await | ✅ (ES2022) | ✅ (v14.8+) |
| **导入断言** | 类型验证 | ✅ (ES2022) | ✅ (v17.1+) |
| **导入映射** | 别名映射 | ✅ | ❌ |
| **裸模块标识符** | 无路径导入 | ❌ (需import map) | ✅ |

---

## 十、实际应用最佳实践

### 10.1 项目配置

```javascript
// vite.config.js
export default {
    resolve: {
        alias: {
            '@': '/src',
            '@components': '/src/components',
            '@utils': '/src/utils'
        }
    },
    optimizeDeps: {
        include: ['lodash-es']  // 预构建依赖
    }
};
```

### 10.2 库开发

```javascript
// package.json
{
    "name": "my-library",
    "version": "1.0.0",
    "type": "module",
    "main": "./dist/cjs/index.js",
    "module": "./dist/esm/index.js",
    "exports": {
        ".": {
            "import": "./dist/esm/index.js",
            "require": "./dist/cjs/index.js"
        }
    },
    "sideEffects": false
}
```

### 10.3 浏览器兼容性

```html
<!-- 现代浏览器 -->
<script type="module" src="/app.js"></script>

<!-- 旧浏览器降级 -->
<script nomodule src="/app-legacy.js"></script>
```
 
 ## 十一、延迟执行脚本

 模块脚本的特殊行为。

## 一、不同类型 script 标签的执行时机对比

### 1.1 普通脚本（无属性）

```html
<script src="script.js"></script>
```

**执行时机**：
- **阻塞 HTML 解析**
- 下载并立即执行
- 执行完成后继续解析 HTML

```html
<!DOCTYPE html>
<html>
<head>
    <script src="script1.js"></script> <!-- 阻塞，等待执行完成 -->
    <script src="script2.js"></script> <!-- 阻塞，等待执行完成 -->
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

### 1.2 `defer` 属性

```html
<script defer src="script.js"></script>
```

**执行时机**：
- **不阻塞 HTML 解析**
- 下载完成后**等待 HTML 完全解析**
- **按顺序**在 DOMContentLoaded 之前执行

```html
<!DOCTYPE html>
<html>
<head>
    <script defer src="script1.js"></script> <!-- 下载但不执行 -->
    <script defer src="script2.js"></script> <!-- 下载但不执行 -->
</head>
<body>
    <div id="app"></div>
    <!-- HTML 解析完成 -->
    <!-- 然后按顺序执行 script1.js, script2.js -->
    <!-- 然后触发 DOMContentLoaded -->
</body>
</html>
```

### 1.3 `async` 属性

```html
<script async src="script.js"></script>
```

**执行时机**：
- **不阻塞 HTML 解析**
- 下载完成后**立即执行**（可能在 HTML 解析完成前）
- **不保证顺序**

```html
<!DOCTYPE html>
<html>
<head>
    <script async src="script1.js"></script> <!-- 下载完成后立即执行 -->
    <script async src="script2.js"></script> <!-- 下载完成后立即执行 -->
</head>
<body>
    <div id="app"></div>
    <!-- script1.js 和 script2.js 可能在任何时机执行 -->
</body>
</html>
```

### 1.4 `type="module"`（ES Module）

```html
<script type="module" src="module.js"></script>
```

**执行时机**：
- **不阻塞 HTML 解析**（类似 `defer`）
- 下载完成后**等待 HTML 完全解析**
- **按顺序**在 DOMContentLoaded 之前执行
- **自动启用 defer 行为**

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module" src="module1.js"></script> <!-- 下载但不执行 -->
    <script type="module" src="module2.js"></script> <!-- 下载但不执行 -->
</head>
<body>
    <div id="app"></div>
    <!-- HTML 解析完成 -->
    <!-- 然后按顺序执行 module1.js, module2.js -->
    <!-- 然后触发 DOMContentLoaded -->
</body>
</html>
```

## 二、执行时机对比表

| 类型 | 阻塞 HTML | 执行时机 | 顺序保证 | 适用场景 |
|------|-----------|----------|----------|----------|
| **普通脚本** | ✅ 阻塞 | 立即执行 | ✅ 按顺序 | 需要立即执行的脚本 |
| **defer** | ❌ 不阻塞 | HTML 完成后 | ✅ 按顺序 | 依赖 DOM 的脚本 |
| **async** | ❌ 不阻塞 | 下载完成后 | ❌ 不保证 | 独立脚本（如分析） |
| **type="module"** | ❌ 不阻塞 | HTML 完成后 | ✅ 按顺序 | ES Module 代码 |

## 三、详细执行流程演示

### 3.1 普通脚本 vs 模块脚本

```html
<!DOCTYPE html>
<html>
<head>
    <script>
        console.log('1. 普通脚本 - head');
    </script>
    
    <script type="module">
        console.log('2. 模块脚本 - head');
    </script>
</head>
<body>
    <div id="app">内容</div>
    
    <script>
        console.log('3. 普通脚本 - body');
    </script>
    
    <script type="module">
        console.log('4. 模块脚本 - body');
    </script>
    
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            console.log('5. DOMContentLoaded');
        });
    </script>
</body>
</html>
```

**实际输出顺序**：
```
1. 普通脚本 - head
3. 普通脚本 - body
2. 模块脚本 - head
4. 模块脚本 - body
5. DOMContentLoaded
```

### 3.2 完整的时间线

```html
<!DOCTYPE html>
<html>
<head>
    <script src="blocking.js"></script>
    <!-- ↑ 阻塞，等待执行 -->
    
    <script defer src="defer.js"></script>
    <!-- ↑ 下载但不执行 -->
    
    <script type="module" src="module.js"></script>
    <!-- ↑ 下载但不执行（自动 defer） -->
</head>
<body>
    <div>Loading...</div>
    
    <script async src="async.js"></script>
    <!-- ↑ 下载完成后立即执行（可能在任何时候） -->
    
    <script>
        console.log('Inline script');
    </script>
    <!-- ↑ 立即执行 -->
</body>
</html>
```

**可能的执行时间线**：
```
时间轴：
├─ HTML 开始解析
├─ 下载 blocking.js
├─ 执行 blocking.js ← 阻塞
├─ 继续解析 HTML
├─ 下载 defer.js (并行)
├─ 下载 module.js (并行)
├─ 下载 async.js (并行)
├─ 遇到 inline script，立即执行
├─ HTML 完全解析完成
├─ 执行 defer.js
├─ 执行 module.js
├─ 触发 DOMContentLoaded
└─ async.js 可能在任何时刻执行（下载完成后）
```

## 四、模块脚本的特殊行为

### 4.1 自动 defer 行为

```html
<!-- 这两种写法等价 -->
<script type="module" src="module.js"></script>
<script type="module" defer src="module.js"></script>
<!-- ↑ defer 是多余的，模块脚本自动具有 defer 行为 -->
```

### 4.2 为什么模块脚本需要延迟执行？

```javascript
// module.js
import { Component } from './components.js';

// 如果立即执行：
// 1. 需要先下载并解析所有依赖
// 2. 可能阻塞 HTML 渲染
// 3. 依赖的 DOM 可能还未准备好

// 延迟执行的好处：
// 1. 不阻塞页面渲染
// 2. 等待 DOM 准备好
// 3. 按依赖顺序执行
```

### 4.3 模块脚本的执行顺序

```html
<script type="module">
    console.log('Module A');
    import { func } from './module-b.js';
</script>

<script type="module">
    console.log('Module B');
</script>

<!-- 输出顺序：
1. Module A
2. Module B
（按文档顺序执行）
-->
```

## 五、实际应用场景

### 5.1 优化页面加载

```html
<!DOCTYPE html>
<html>
<head>
    <!-- 1. 关键 CSS（阻塞渲染） -->
    <link rel="stylesheet" href="critical.css">
    
    <!-- 2. 非关键脚本（不阻塞） -->
    <script type="module" src="app.js"></script>
    
    <!-- 3. 分析脚本（异步） -->
    <script async src="analytics.js"></script>
</head>
<body>
    <!-- 4. 内容立即可见 -->
    <div id="app">Loading...</div>
    
    <!-- 5. 内联关键脚本（立即执行） -->
    <script>
        // 初始化加载状态
        document.getElementById('app').textContent = 'Initializing...';
    </script>
</body>
</html>
```

### 5.2 模块脚本与 DOM 操作

```html
<!DOCTYPE html>
<html>
<body>
    <div id="app"></div>
    
    <script type="module">
        // ✅ 安全：DOM 已经准备好
        import { render } from './renderer.js';
        render(document.getElementById('app'));
    </script>
    
    <script>
        // ❌ 危险：DOM 可能还未准备好
        document.getElementById('app').innerHTML = 'Hello';
    </script>
</body>
</html>
```

### 5.3 性能优化对比

```html
<!-- ❌ 不推荐：阻塞渲染 -->
<script src="heavy-library.js"></script>
<script src="app.js"></script>

<!-- ✅ 推荐：不阻塞渲染 -->
<script type="module" src="app.js"></script>
<!-- 或 -->
<script defer src="app.js"></script>
```

## 六、浏览器兼容性

```javascript
// 检测模块脚本支持
const supportsModule = 'noModule' in document.createElement('script');

if (supportsModule) {
    // 现代浏览器
    // <script type="module" src="app.js"></script>
} else {
    // 旧浏览器降级
    // <script nomodule src="app-legacy.js"></script>
}
```

```html
<!-- 现代浏览器和旧浏览器兼容 -->
<script type="module" src="app-modern.js"></script>
<script nomodule src="app-legacy.js"></script>
```

## 七、总结

### 7.1 关键点

1. **`type="module"` 自动具有 `defer` 行为**
   - 不阻塞 HTML 解析
   - 等待 HTML 完成后执行
   - 按文档顺序执行

2. **与普通脚本的区别**
   - 普通脚本：阻塞 + 立即执行
   - 模块脚本：不阻塞 + 延迟执行

3. **与 `defer` 的关系**
   - 行为相同，但模块脚本还有额外特性（ESM、严格模式等）

### 7.2 最佳实践

```html
<!-- ✅ 推荐的脚本加载策略 -->
<head>
    <!-- 关键资源 -->
    <link rel="stylesheet" href="critical.css">
    
    <!-- 应用代码（模块化） -->
    <script type="module" src="app.js"></script>
    
    <!-- 分析/监控（异步） -->
    <script async src="analytics.js"></script>
</head>

<!-- ✅ 或者使用 defer -->
<head>
    <script defer src="app.js"></script>
</head>

<!-- ❌ 避免阻塞渲染 -->
<head>
    <script src="heavy.js"></script> <!-- 阻塞！ -->
</head>
```
