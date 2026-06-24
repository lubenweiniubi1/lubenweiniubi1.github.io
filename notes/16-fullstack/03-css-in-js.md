**CSS-in-JS（CSS in JavaScript）** 是一种将 **CSS 样式直接写在 JavaScript 代码中** 的前端开发技术。它主要用于现代组件化框架（如 React、Vue 等），通过 JavaScript 动态生成和管理样式。

---

### 🎯 核心定义

- **不是**指 "CSS 在 JS 文件里" 这么简单
- 而是一种**样式编写范式**：用 JavaScript 的能力来定义、管理和应用样式
- 样式通常以**字符串或对象**形式嵌入 JS/JSX 中，由库在**运行时动态生成 `<style>` 标签**

---

### 🔧 工作原理

1. **样式定义**：在 JS 文件中用模板字符串或对象定义样式
2. **运行时处理**：CSS-in-JS 库将样式转换为唯一的 class 名
3. **DOM 注入**：将生成的样式注入到 `<style>` 标签中
4. **组件渲染**：组件使用生成的 class 名应用样式

---

### ✨ 核心优势

| 优势 | 说明 |
|------|------|
| **作用域隔离** | 每个组件样式自动隔离，避免全局污染和命名冲突 |
| **动态样式** | 直接使用 JS 变量、props、state 来控制样式 |
| **组件内聚** | 样式与组件逻辑、结构在同一文件，提升可维护性 |
| **主题切换** | 轻松实现主题系统，样式可编程 |
| **死代码检测** | 未使用的样式不会被打包（部分库支持） |

---

### 📚 常见库（50+ 个）

| 库 | 特点 |
|----|------|
| **styled-components** | 最流行，用模板字符串定义带样式的组件 |
| **Emotion** | 高性能，支持 string 和 object 两种写法 |
| **JSS** | 以 JSON 对象形式编写样式 |
| **Stitches** | 编译时优化，性能更好 |
| **Fela** | 高度可定制的原子化 CSS-in-JS |
| **Goober** | 超轻量（~1KB） |

---

### 💡 示例代码

#### styled-components
```jsx
import styled from 'styled-components';

const Button = styled.button`
  background-color: ${props => props.primary ? 'blue' : 'gray'};
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  
  &:hover {
    opacity: 0.8;
  }
`;

// 使用
<Button primary>点击我</Button>
```

#### Emotion（对象语法）
```jsx
import { css } from '@emotion/react';

const buttonStyle = css`
  background: blue;
  color: white;
  padding: 10px;
`;

<div css={buttonStyle}>按钮</div>
```

---

### 🆚 与传统 CSS 对比

| 特性 | 传统 CSS | CSS-in-JS |
|------|----------|-----------|
| 作用域 | 全局（需手动处理） | 局部（自动隔离） |
| 动态性 | 有限（需 JS 操作 DOM） | 原生支持（直接用 JS 变量） |
| 文件组织 | 样式与逻辑分离 | 样式与组件共存 |
| 命名冲突 | 容易发生 | 几乎不存在 |
| 主题切换 | 复杂 | 简单 |

---

### ⚠️ 潜在缺点

- **性能开销**：运行时生成样式可能影响首屏加载
- **调试困难**：生成的 class 名难以阅读（如 `.sc-1a2b3c4`）
- **学习成本**：需要熟悉特定库的 API
- **SSR 支持**：部分库需要额外配置

---

### ✅ 适用场景

- 组件库开发
- 需要高度动态样式的应用
- 大型团队协作（避免样式冲突）
- 需要主题切换或暗色模式的项目

---

### 📌 总结

**CSS-in-JS 不是"把 CSS 写进 JS 字符串"那么简单**，而是一种结合了**组件化思想、动态能力和工程化优势**的现代样式管理范式。它通过 JavaScript 的编程能力，解决了传统 CSS 的许多痛点，成为现代前端开发中的重要技术选择。