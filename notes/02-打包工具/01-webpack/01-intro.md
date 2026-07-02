# 模块化编程
把复杂代码按照功能不同，分成单独的模块


# 目录
+ 模块化演变过程
+ 模块化规范
+ 常用的模块化打包工具
+ 基于模块化工具构建现代 Web 应用
+ 打包工具的优化技巧

# 演变过程
[P1 开始到 P5](https://www.bilibili.com/video/BV1kP41177wp?spm_id_from=333.788.player.switch&vd_source=d66a6fb5cb08fa8db4dd3bf2bd839f71&p=1 )


## 一、早期困境：无模块化时代（2009年之前）

### 1.1 全局变量污染问题
```javascript
// 早期开发方式
var username = '张三';
var password = '123456';

function login() {
    console.log(username + '登录');
}

function logout() {
    console.log(username + '登出');
}
```
**问题分析**：
- 所有变量都挂在`window`对象上
- 多个文件同时使用`username`变量会导致覆盖
- 代码量大时命名冲突频发

### 1.2 依赖管理混乱
```html
<!-- 依赖顺序必须手动维护 -->
<script src="jquery.js"></script>
<script src="plugin1.js"></script> <!-- 依赖jquery -->
<script src="plugin2.js"></script> <!-- 依赖plugin1 -->
<script src="app.js"></script>      <!-- 依赖plugin2 -->
```
**痛点**：
- 依赖关系靠注释说明
- 加载顺序错误导致运行时错误
- 无法实现按需加载

## 二、初级解决方案（2005-2009年）

### 2.1 命名空间模式（Namespace）
```javascript
// 基础命名空间
var MyProject = {};
MyProject.ModuleA = {
    data: '数据',
    method: function() {}
};

// 嵌套命名空间
var MyProject = MyProject || {};
MyProject.Utils = MyProject.Utils || {};
MyProject.Utils.String = {
    trim: function(str) {
        return str.trim();
    }
};
```
**优缺点**：
- ✅ 减少全局变量数量
- ❌ 本质仍是全局变量，只是层级更深
- ❌ 无法真正实现私有成员

### 2.2 立即执行函数表达式（IIFE）
```javascript
// 基础IIFE
(function() {
    var privateVar = '私有变量';
    function privateFunc() {
        console.log(privateVar);
    }
    window.publicVar = '公开变量';
})();

// 带参数的IIFE
(function($) {
    $.fn.myPlugin = function() {
        // 插件代码
    };
})(jQuery);

// 模块模式
var Counter = (function() {
    var count = 0;
    return {
        increment: function() {
            return ++count;
        },
        decrement: function() {
            return --count;
        },
        getCount: function() {
            return count;
        }
    };
})();
```
**核心原理**：
- 利用闭包实现私有作用域
- 通过`return`暴露公共接口
- 解决了变量污染问题

## 三、模块化规范爆发期（2009-2015年）

### 3.1 CommonJS（2009）- Node.js的模块化标准

#### 3.1.1 历史背景
- 2009年Node.js诞生，需要服务端模块化方案
- Ryan Dahl参考Python的`import`机制设计
- 采用同步加载，适合文件系统环境

#### 3.1.2 核心语法
```javascript
// module.js
// 单个导出
exports.name = '模块名';
exports.func = function() {};

// 整体导出
module.exports = {
    name: '模块名',
    func: function() {}
};

// 导入
var module = require('./module.js');
console.log(module.name);
```

#### 3.1.3 执行机制

node 只会在启动的时候同步加载模块，执行的时候是不需要的。浏览器不是，大量同步请求出现会阻塞。
```javascript
// require的执行过程
function require(moduleName) {
    // 1. 解析路径
    var resolvedPath = path.resolve(moduleName);
    
    // 2. 检查缓存
    if (Module._cache[resolvedPath]) {
        return Module._cache[resolvedPath].exports;
    }
    
    // 3. 创建模块对象
    var module = new Module(resolvedPath);
    
    // 4. 加载并执行
    module.load();
    
    // 5. 缓存模块
    Module._cache[resolvedPath] = module;
    
    return module.exports;
}
```

#### 3.1.4 循环依赖处理
```javascript
// a.js
exports.done = false;
var b = require('./b.js');
console.log('在a中，b.done = ' + b.done);
exports.done = true;

// b.js
exports.done = false;
var a = require('./a.js');
console.log('在b中，a.done = ' + a.done);
exports.done = true;

// c.js
var a = require('./a.js');
var b = require('./b.js');
console.log('在c中，a.done = ' + a.done);
console.log('在c中，b.done = ' + b.done);
```

#### 3.1.5 优点与局限
- ✅ 语法简洁，符合直觉
- ✅ 服务端同步加载效率高
- ❌ 浏览器端无法直接使用（需要打包工具）
- ❌ 无法实现异步加载

### 3.2 AMD（Asynchronous Module Definition）- 浏览器端异步方案

#### 3.2.1 历史背景
- 2009年James Burke在RequireJS中提出
- 解决浏览器端异步加载问题
- 适合大型前端项目

#### 3.2.2 核心语法
```javascript
// 定义模块
define('module1', ['jquery', 'lodash'], function($, _) {
    var privateVar = '私有';
    
    function privateFunc() {
        return privateVar;
    }
    
    return {
        publicFunc: function() {
            console.log($, _);
        }
    };
});

// 使用模块
require(['module1'], function(module1) {
    module1.publicFunc();
});

// 简化写法（匿名模块）
define(['jquery'], function($) {
    return {
        init: function() {
            $('body').append('<div>Hello</div>');
        }
    };
});
```

#### 3.2.3 RequireJS配置
```javascript
require.config({
    baseUrl: 'js/lib',
    paths: {
        jquery: 'jquery.min',
        lodash: 'lodash.min',
        bootstrap: 'bootstrap.min'
    },
    shim: {
        bootstrap: {
            deps: ['jquery'],
            exports: 'jQuery'
        }
    },
    map: {
        '*': {
            'css': 'require-css/css'
        }
    }
});
```

#### 3.2.4 执行流程
1. 解析依赖数组
2. 异步加载所有依赖文件
3. 依赖加载完成后执行回调函数
4. 将模块结果缓存

#### 3.2.5 优点与局限
- ✅ 支持异步加载，适合浏览器环境
- ✅ 依赖前置，便于静态分析
- ✅ 支持插件系统（text、css等）
- ❌ 语法相对复杂
- ❌ 依赖数组和回调函数参数必须一一对应

### 3.3 CMD（Common Module Definition）- 国产优化方案

#### 3.3.1 历史背景
- 2011年玉伯（支付宝）在Sea.js中提出
- 针对AMD的优化，更符合中国人习惯
- 强调"就近依赖"

#### 3.3.2 核心语法
```javascript
// 定义模块
define(function(require, exports, module) {
    var $ = require('jquery');
    var _ = require('lodash');
    
    exports.name = '模块名';
    
    exports.init = function() {
        console.log($, _);
    };
    
    // 或者整体导出
    module.exports = {
        name: '模块名',
        init: function() {}
    };
});

// 使用模块
seajs.use(['module1'], function(module1) {
    module1.init();
});
```

#### 3.3.3 与AMD的核心区别

| 特性 | AMD | CMD |
|------|-----|-----|
| 依赖加载时机 | 依赖前置，提前加载 | 依赖就近，延迟加载 |
| 语法风格 | define(['dep'], function(dep) {}) | define(function(require) { var dep = require('dep'); }) |
| 执行顺序 | 依赖加载完立即执行 | 遇到require才执行 |
| 适用场景 | 适合依赖关系明确的项目 | 适合依赖关系复杂的项目 |

#### 3.3.4 执行流程对比
```javascript
// AMD：依赖前置
define(['a', 'b', 'c'], function(a, b, c) {
    // a, b, c已经全部加载完成
    a.doSomething();
    if (condition) {
        b.doSomething();
    }
    c.doSomething();
});

// CMD：依赖就近
define(function(require, exports) {
    var a = require('a');
    a.doSomething();
    
    if (condition) {
        var b = require('b');
        b.doSomething();
    }
    
    var c = require('c');
    c.doSomething();
});
```

#### 3.3.5 Sea.js配置
```javascript
seajs.config({
    base: 'js/',
    alias: {
        jquery: 'jquery/jquery/1.11.1/jquery.js',
        bootstrap: 'bootstrap/js/bootstrap.js'
    },
    paths: {
        'gallery': 'https://a.alipayobjects.com/gallery'
    },
    vars: {
        'locale': 'zh-cn'
    },
    map: [
        [/^.*$/, function(url) {
            return url + '?v=' + Date.now();
        }]
    ]
});
```

### 3.4 UMD（Universal Module Definition）- 通用模块定义

#### 3.4.1 设计理念
- 兼容AMD、CommonJS和全局变量
- 让模块可以在多种环境中使用
- 适合开发第三方库

#### 3.4.2 核心实现
```javascript
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD环境
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS环境
        module.exports = factory(require('jquery'));
    } else {
        // 浏览器全局变量
        root.MyLibrary = factory(root.jQuery);
    }
}(this, function($) {
    // 模块实现
    var MyLibrary = {
        version: '1.0.0',
        init: function() {
            console.log('初始化');
        }
    };
    return MyLibrary;
}));
```

#### 3.4.3 简化版本
```javascript
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.MyLibrary = factory();
    }
}(this, function() {
    return {
        name: 'MyLibrary'
    };
}));
```

## 四、标准化时代：ES6 Module（2015年至今）

### 4.1 历史背景
- 2015年ES6（ES2015）正式发布
- JavaScript语言原生支持模块化
- 统一了浏览器和服务器的模块标准

### 4.2 核心语法详解

#### 4.2.1 导出语法
```javascript
// 命名导出
export const name = '模块名';
export function func() {}
export class MyClass {}

// 整体导出
export { name, func, MyClass };

// 默认导出
export default function() {
    console.log('默认导出');
}

// 重命名导出
export { name as myName };

// 重新导出
export { default as myDefault } from './other.js';
export * from './other.js';
```

#### 4.2.2 导入语法
```javascript
// 导入命名导出
import { name, func } from './module.js';

// 导入并重命名
import { name as myName } from './module.js';

// 导入默认导出
import myDefault from './module.js';

// 同时导入默认和命名导出
import myDefault, { name, func } from './module.js';

// 导入所有导出
import * as myModule from './module.js';
console.log(myModule.name);

// 仅执行模块（不导入任何内容）
import './module.js';
```

#### 4.2.3 动态导入
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

### 4.3 核心特性深度解析

#### 4.3.1 静态分析
```javascript
// ES6 Module在编译时就能确定依赖关系
import { func } from './module.js';
// ↑ 编译时就知道需要导入func

// 对比CommonJS（运行时确定）
const module = require('./module.js');
// ↑ 运行时才知道导入了什么
```

#### 4.3.2 Tree Shaking
```javascript
// module.js
export const usedFunc = () => console.log('used');
export const unusedFunc = () => console.log('unused');

// app.js
import { usedFunc } from './module.js';
usedFunc();

// 打包后，unusedFunc会被移除（Tree Shaking）
```

#### 4.3.3 循环依赖处理
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

#### 4.3.4 值的绑定
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

### 4.4 浏览器原生支持

#### 4.4.1 HTML中使用
```html
<!-- 原生ESM支持 -->
<script type="module">
    import { func } from './module.js';
    func();
</script>

<!-- 外部模块文件 -->
<script type="module" src="./app.js"></script>

<!-- 异步加载 -->
<script type="module" async src="./app.js"></script>
```

#### 4.4.2 MIME类型
```javascript
// 服务器需要正确设置MIME类型
// Content-Type: application/javascript
// 或
// Content-Type: text/javascript
```

#### 4.4.3 CORS跨域
```javascript
// ESM默认启用CORS
// 需要服务器设置Access-Control-Allow-Origin
```

### 4.5 Node.js中的ESM

#### 4.5.1 使用方式
```javascript
// 方式1：文件扩展名为.mjs
// app.mjs
import { func } from './module.js';

// 方式2：package.json中设置type
// package.json
{
    "type": "module"
}

// 方式3：使用--input-type标志
node --input-type=module --eval "import { func } from './module.js'"
```

#### 4.5.2 CommonJS与ESM互操作
```javascript
// 在ESM中导入CommonJS
import cjsModule from './cjs-module.cjs';
console.log(cjsModule.default);

// 在CommonJS中导入ESM（需要动态导入）
async function loadESM() {
    const esmModule = await import('./esm-module.js');
    console.log(esmModule.namedExport);
}
```

## 五、构建工具演进

### 5.1 Browserify（2011）
```bash
# 将CommonJS模块打包为浏览器可用的代码
npm install -g browserify
browserify main.js -o bundle.js
```

### 5.2 Webpack（2012）
```javascript
// webpack.config.js
module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: __dirname + '/dist'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    }
};
```

### 5.3 Rollup（2015）
```javascript
// rollup.config.js
export default {
    input: 'src/main.js',
    output: {
        file: 'dist/bundle.js',
        format: 'esm' // 支持多种输出格式
    },
    plugins: [
        // 插件系统
    ]
};
```

### 5.4 Vite（2020）
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': '/src'
        }
    }
});
```

## 六、各规范对比总结

### 6.1 核心特性对比

| 特性 | CommonJS | AMD | CMD | ES6 Module |
|------|----------|-----|-----|------------|
| 加载方式 | 同步 | 异步 | 异步 | 静态/动态 |
| 适用环境 | Node.js | 浏览器 | 浏览器 | 全平台 |
| 语法简洁度 | 中等 | 复杂 | 简洁 | 简洁 |
| 静态分析 | ❌ | ⚠️ | ⚠️ | ✅ |
| Tree Shaking | ❌ | ❌ | ❌ | ✅ |
| 循环依赖 | ✅ | ✅ | ✅ | ✅ |
| 原生支持 | Node.js | ❌ | ❌ | ✅ |

### 6.2 使用场景建议

- **Node.js后端开发**：CommonJS（或ESM）
- **现代前端开发**：ES6 Module + 构建工具
- **老旧项目维护**：根据现有技术栈选择
- **第三方库开发**：UMD（兼容多种环境）

## 七、演进趋势与未来展望

### 7.1 当前状态
- ES6 Module已成为事实标准
- 浏览器原生支持不断完善
- Node.js对ESM的支持逐步完善

### 7.2 未来趋势
- Top-level await（顶层await）
- Import assertions（导入断言）
- Import maps（导入映射）
- 更好的动态导入支持
