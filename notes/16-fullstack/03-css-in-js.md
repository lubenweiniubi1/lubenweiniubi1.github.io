# CSS in JS 与 styled-components 详解

## 什么是 CSS in JS？

CSS in JS 是一种将 CSS 样式编写在 JavaScript 中的技术方案，它允许开发者直接在 JavaScript/JSX 文件中定义样式，而不是使用传统的 CSS 文件。

### 主要特点：
- **样式与组件高度耦合**：样式和组件逻辑在一起，便于维护
- **组件级样式隔离**：避免全局样式污染
- **动态样式支持**：可以基于 props 和 state 动态生成样式
- **样式复用**：通过 JavaScript 的能力实现样式的逻辑复用

## styled-components 简介

styled-components 是 React 生态中最流行的 CSS in JS 库，它利用 ES6 的**标签模板字符串**（Tagged Template Literals）来编写样式。

### 核心优势：

1. **组件级样式隔离**：每个组件的样式完全独立，不会相互污染
2. **支持所有 CSS 特性**：包括嵌套、伪类、媒体查询等
3. **动态样式**：通过 props 轻松实现动态样式
4. **遵循 React 理念**：贯彻 "everything in JS" 的思想
5. **自动添加 vendor prefixes**：无需手动处理浏览器兼容性

## styled-components 使用示例

### 1. 基础用法

```javascript
import styled from 'styled-components';

// 创建一个样式化的 div 组件
const Button = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #45a049;
  }

  &:active {
    transform: scale(0.98);
  }
`;

// 使用
function App() {
  return <Button>点击我</Button>;
}
```

### 2. 使用 Props 动态样式

```javascript
const Button = styled.button`
  background-color: ${props => props.primary ? '#007bff' : '#6c757d'};
  color: ${props => props.primary ? 'white' : '#333'};
  padding: ${props => props.size === 'large' ? '15px 30px' : '10px 20px'};
  font-size: ${props => props.size === 'large' ? '18px' : '16px'};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// 使用
<Button primary size="large">主要按钮</Button>
<Button disabled>禁用按钮</Button>
```

### 3. 扩展和覆盖样式

```javascript
// 扩展现有组件
const PrimaryButton = styled(Button)`
  background-color: #007bff;
  border-color: #007bff;

  &:hover {
    background-color: #0069d9;
    border-color: #0062cc;
  }
`;

// 覆盖样式
const CustomButton = styled(Button)`
  background-color: #ff6b6b;
  color: white;
`;
```

### 4. 嵌套样式

```javascript
const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 20px;
  margin: 20px 0;

  .card-title {
    font-size: 24px;
    color: #333;
    margin-bottom: 10px;
  }

  .card-content {
    color: #666;
    line-height: 1.6;
  }

  button {
    margin-top: 15px;
  }
`;

// 使用
<Card>
  <div className="card-title">卡片标题</div>
  <div className="card-content">卡片内容</div>
  <button>操作按钮</button>
</Card>
```

### 5. 响应式设计

```javascript
const Container = styled.div`
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
  }

  @media (min-width: 1024px) {
    max-width: 1200px;
    margin: 0 auto;
  }
`;
```

### 6. 全局样式

```javascript
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Arial', sans-serif;
    background-color: #f5f5f5;
    color: #333;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
`;

// 在 App 组件中使用
function App() {
  return (
    <>
      <GlobalStyle />
      {/* 其他组件 */}
    </>
  );
}
```

### 7. 主题支持

```javascript
import { ThemeProvider } from 'styled-components';

// 定义主题
const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545'
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px'
  }
};

// 使用主题
const ThemedButton = styled.button`
  background-color: ${props => props.theme.colors.primary};
  padding: ${props => props.theme.spacing.medium};
  color: white;
  border: none;
  border-radius: 4px;
`;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ThemedButton>主题按钮</ThemedButton>
    </ThemeProvider>
  );
}
```

## 与其他方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **styled-components** | 组件隔离好，支持动态样式，语法直观 | 运行时开销，学习成本 |
| **CSS Modules** | 静态分析友好，性能好 | 语法繁琐，动态样式支持弱 |
| **传统 CSS** | 熟悉，工具链完善 | 全局污染，命名冲突 |
| **CSS-in-JS (Emotion)** | 类似 styled-components，更灵活 | 同样有运行时开销 |

## 适用场景

✅ **适合使用 styled-components 的场景：**
- React/React Native 项目
- 需要大量动态样式的应用
- 组件库开发
- 需要主题切换的应用

❌ **不太适合的场景：**
- 对性能要求极高的应用
- 需要服务端渲染且对首屏性能敏感
- 团队不熟悉 CSS in JS 概念

## 总结

styled-components 作为 CSS in JS 的代表库，为 React 开发者提供了一种全新的样式管理方式。它将样式与组件紧密结合，解决了传统 CSS 的许多痛点，如全局污染、命名冲突等。虽然有一定的学习成本和运行时开销，但在现代 React 应用开发中，它仍然是一个非常值得考虑的选择。