# 09 - 自定义 Loader 和 Plugin

## 概念

### 1. 为什么要自己写 Loader/Plugin？

大部分场景用社区生态就够了。但当你遇到这些情况时，自定义就很有价值：

- 需要在编译时注入版本号/构建时间等元信息
- 需要做定制化的代码检查或自动修复
- 需要处理非标准文件格式（如 `.vue`、`.graphql` —— 这些一开始也是社区写的 loader）
- 团队内部的约定需要工具强制执行

### 2. Loader 的本质

Loader 就是一个**接收源码字符串、返回转换后源码字符串的函数**。

```js
module.exports = function(source) {
  return source.replace(/old/g, 'new');
};
```

它运行在 Node.js 环境，可以使用 `fs`、`path` 等 Node API。

### 3. Plugin 的本质

Plugin 是一个**带有 `apply` 方法的类**。webpack 在构建过程中会创建一个 `compiler` 对象，插件通过 `compiler.hooks` 在不同阶段注册回调。

```js
class MyPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('MyPlugin', (stats) => {
      console.log('Build done!');
    });
  }
}
```

### 4. Compiler vs Compilation

这是写 Plugin 时必须理解的概念：

| 对象 | 生命周期 | 代表什么 |
|------|---------|---------|
| `compiler` | 整个 webpack 进程 | webpack 引擎本身，一次进程只创建一个 |
| `compilation` | 一次构建 | 当前的构建上下文，watch mode 下每次重建都会创建新的 |

简单说：`compiler` 是"发动机"，`compilation` 是"这一次的点火过程"。

---

## 练习（由浅入深）

### Lv.1 最简单的 Loader —— 删除注释

创建 `loaders/comment-remover.js`：
```js
module.exports = function(source) {
  return source.replace(/\/\/.*$/gm, '');
};
```

在 `webpack.config.js` 中引用：
```js
{
  test: /\.js$/,
  use: [path.resolve(__dirname, 'loaders/comment-remover.js')],
}
```

验证你的 loader 是否真的把 JS 注释干掉了。

### Lv.2 带选项的 Loader

创建 `loaders/banner-loader.js`：
```js
module.exports = function(source) {
  const options = this.getOptions();   // webpack 5 内置，不需要 loader-utils
  const { version, author } = options;

  const banner = `/**\n * @version ${version}\n * @author ${author}\n */\n`;
  return banner + source;
};
```

```js
{
  test: /\.js$/,
  use: {
    loader: path.resolve(__dirname, 'loaders/banner-loader.js'),
    options: { version: '2.0.0', author: 'me' },
  },
}
```

### Lv.3 异步 Loader

```js
module.exports = function(source) {
  const callback = this.async();

  setTimeout(() => {
    const result = source.replace(/__BUILD_TIME__/g, new Date().toISOString());
    callback(null, result);   // 第一个参数是 error
  }, 100);
};
```

### Lv.4 最简单的 Plugin —— 构建日志

创建 `plugins/build-logger.js`：
```js
class BuildLogger {
  apply(compiler) {
    compiler.hooks.compile.tap('BuildLogger', () => {
      console.log('🔨 开始构建...');
    });
    compiler.hooks.done.tap('BuildLogger', (stats) => {
      const time = (stats.endTime - stats.startTime) / 1000;
      console.log(`✅ 构建完成，耗时 ${time}s`);
      if (stats.hasErrors()) {
        console.log('❌ 构建失败，请检查错误信息');
      }
    });
  }
}
module.exports = BuildLogger;
```

在 `plugins` 数组中 `new BuildLogger()`，观察构建输出的变化。

### Lv.5 操作编译产物的 Plugin

创建 `plugins/copyright-plugin.js`——在 emit 阶段给每个 JS 文件末尾追加版权信息：

```js
class CopyrightPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('CopyrightPlugin', (compilation, callback) => {
      for (const filename in compilation.assets) {
        if (filename.endsWith('.js')) {
          const source = compilation.assets[filename].source();
          compilation.assets[filename] = {
            source: () => source + '\n/** Copyright 2026 */',
            size: () => Buffer.byteLength(compilation.assets[filename].source(), 'utf8'),
          };
        }
      }
      callback();
    });
  }
}
module.exports = CopyrightPlugin;
```

运行 build，检查产物末尾是否有版权注释。

---

## 预期效果

- 能写出简单实用的自定义 loader
- 能写出钩子到关键节点的自定义 plugin
- 理解 loader（函数）、plugin（apply 类）的形式差异
- 了解 compiler 和 compilation 的区别

---

## 面试题

> 📝 待整理，先留位

- [ ] Loader 和 Plugin 的本质区别是什么？从形式、职责、执行时机三个维度回答
- [ ] 如果要写一个 loader 把代码中的中文替换成英文，怎么写？
- [ ] Compiler 和 Compilation 的区别？
- [ ] webpack 的 tapable 是什么？tap / tapAsync / tapPromise 分别什么时候用？
- [ ] 如果要写一个统计每个模块处理耗时的 plugin，应该 hook 哪些阶段？
