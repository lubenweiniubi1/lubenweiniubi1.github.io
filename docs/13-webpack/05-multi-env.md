# 05 - 多环境配置

## 概念

### 1. 为什么需要多环境配置？

开发和生产的诉求完全不同：

| 关注点 | Development | Production |
|--------|-------------|------------|
| 速度 | 越快越好 | 无要求 |
| 体积 | 无要求 | 越小越好 |
| 调试 | 越方便越好 | 隐藏源码 |
| CSS | 通过 JS 注入（快） | 独立文件（缓存） |
| 错误信息 | 尽可能详细 | 不暴露内部信息 |

如果把两套配置塞进一个文件，用 `if (mode === 'production')` 判断，配置会迅速变得臃肿难读。

### 2. 配置拆分策略

业界标准做法：**公共配置 + 环境差异配置**，通过 `webpack-merge` 合并：

```
webpack.common.js    ← 公共部分（entry、output、resolve 等）
webpack.dev.js       ← 开发专属（devServer、source-map 等）
webpack.prod.js      ← 生产专属（压缩、提取 CSS 等）
```

`webpack-merge` 不是简单的 `Object.assign`——它会智能合并 `module.rules` 数组、`plugins` 数组，避免直接覆盖。

### 3. 通过环境变量动态配置

webpack 支持两种方式传入外部参数：
- `--env`：命令行传入，配置导出为函数时接收
- `--mode`：webpack 内置，值为 `development` / `production` / `none`
- `process.env.NODE_ENV`：Node.js 环境变量，mode 会自动设置它

---

## 练习（由浅入深）

### Lv.1 安装 webpack-merge

```bash
npm install -D webpack-merge
```

### Lv.2 拆分基础框架

创建 `webpack.common.js`，把公共配置抽出来：
```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
};
```

创建 `webpack.dev.js`：
```js
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: { port: 3000, hot: true, open: true },
});
```

修改 `package.json` 的 scripts，分别指定配置文件：
```json
{
  "dev": "webpack serve --config webpack.dev.js",
  "build": "webpack --config webpack.prod.js --mode production",
  "build:dev": "webpack --config webpack.dev.js"
}
```

### Lv.3 生产配置差异化

创建 `webpack.prod.js`，做这些差异化：
```js
const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }],
  },
  plugins: [new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' })],
});
```

**注意**：这里 CSS 的 rule 和 common 里的冲突了——你需要把 common 里的 CSS rule 移到 dev 里，或调整 merge 策略。思考为什么不能同时保留两套 CSS rule。

### Lv.4 用函数式配置接收 --env

把 `webpack.prod.js` 改为函数形式，通过命令行接收参数：
```js
module.exports = (env) => {
  console.log('API Base:', env.apiBase);    // 命令行传入的
  return merge(common, { /* ... */ });
};
```

```bash
npx webpack --config webpack.prod.js --env apiBase=https://api.prod.com
```

### Lv.5 扩展到更多环境

如果项目有 staging / testing 环境，如何扩展？思考两种方案：
- 继续加 `webpack.staging.js`（文件变多）
- 用一个配置文件 + `--env` 控制差异（单文件逻辑变复杂）

你会怎么选？试着实现你的方案。

---

## 预期效果

- 能用 webpack-merge 维护多环境配置
- 理解 dev/prod 环境的需求差异
- 知道通过 `--env` 和函数式配置传递外部参数

---

## 面试题

> 📝 待整理，先留位

- [ ] webpack 中如何区分开发和生产环境？有哪些实现方式？
- [ ] webpack-merge 和 Object.assign 有什么区别？
- [ ] 为什么生产环境要用 MiniCssExtractPlugin 而不用 style-loader？
- [ ] `--env` 和 `--mode` 的区别？
- [ ] 如果某个公共配置项在两个环境下不同，怎么处理？
