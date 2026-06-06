https://babeljs.io/repl

自己实验一下，看看 JSX 是如何被转换成 React.createElement 调用的。

---

### ✅ 示例 1：最简单的 JSX 元素
```jsx
const element = <h1>Hello, world!</h1>;
```
**转换后（React 17+ 自动运行时）**：
```js
import { jsx as _jsx } from "react/jsx-runtime";
const element = /*#__PURE__*/ _jsx("h1", {
  children: "Hello, world!"
});

```

---

### ✅ 示例 2：带属性和子元素
```jsx
const box = (
  <div className="container" id="main">
    <p style={{ color: 'red' }}>This is red text</p>
    <button onClick={() => alert('Clicked!')}>Click me</button>
  </div>
);
```
**转换后（React 17+ 自动运行时）**：
```js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const box = /*#__PURE__*/ _jsxs("div", {
  className: "container",
  id: "main",
  children: [
    /*#__PURE__*/ _jsx("p", {
      style: {
        color: "red"
      },
      children: "This is red text"
    }),
    /*#__PURE__*/ _jsx("button", {
      onClick: () => alert("Clicked!"),
      children: "Click me"
    })
  ]
});
```
---

### ✅ 示例 3：使用 JavaScript 表达式
```jsx
const name = "Alice";
const age = 30;

const userCard = (
  <div>
    <h2>{name}</h2>
    <p>Age: {age}</p>
    <p>Next year: {age + 1}</p>
  </div>
);
```
**转换后（React 17+ 自动运行时）**：
```js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const name = "Alice";
const age = 30;
const userCard = /*#__PURE__*/ _jsxs("div", {
  children: [
    /*#__PURE__*/ _jsx("h2", {
      children: name
    }),
    /*#__PURE__*/ _jsxs("p", {
      children: ["Age: ", age]
    }),
    /*#__PURE__*/ _jsxs("p", {
      children: ["Next year: ", age + 1]
    })
  ]
});
```

---

### ✅ 示例 4：条件渲染（三元运算符）
```jsx
const isLoggedIn = true;

const greeting = (
  <div>
    {isLoggedIn ? <h1>Welcome back!</h1> : <h1>Please sign in.</h1>}
  </div>
);
```
**转换后（React 17+ 自动运行时）**：
```js
import { jsx as _jsx } from "react/jsx-runtime";
const isLoggedIn = true;
const greeting = /*#__PURE__*/ _jsx("div", {
  children: isLoggedIn
    ? /*#__PURE__*/ _jsx("h1", {
        children: "Welcome back!"
      })
    : /*#__PURE__*/ _jsx("h1", {
        children: "Please sign in."
      })
});
```

---

### ✅ 示例 5：列表渲染（map）
```jsx
const fruits = ['Apple', 'Banana', 'Cherry'];

const fruitList = (
  <ul>
    {fruits.map((fruit, index) => (
      <li key={index}>{fruit}</li>
    ))}
  </ul>
);
```
**转换后（React 17+ 自动运行时）**：
```js
import { jsx as _jsx } from "react/jsx-runtime";
const fruits = ["Apple", "Banana", "Cherry"];
const fruitList = /*#__PURE__*/ _jsx("ul", {
  children: fruits.map((fruit, index) =>
    /*#__PURE__*/ _jsx(
      "li",
      {
        children: fruit
      },
      index
    )
  )
});
```
---

### ✅ 示例 6：自定义组件
```jsx
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}

const app = <Welcome name="Bob" />;
```
**转换后（React 17+ 自动运行时）**：
```js
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
function Welcome({ name }) {
  return /*#__PURE__*/ _jsxs("h1", {
    children: ["Hello, ", name, "!"]
  });
}
const app = /*#__PURE__*/ _jsx(Welcome, {
  name: "Bob"
});
```
---

### ✅ 示例 7：Fragment（避免额外 div）
```jsx
const fragment = (
  <>
    <h1>Title</h1>
    <p>Paragraph</p>
  </>
);
```
**转换后（React 17+ 自动运行时）**：
```js
const fragment = /*#__PURE__*/ _jsxs(_Fragment, {
  children: [
    /*#__PURE__*/ _jsx("h1", {
      children: "Title"
    }),
    /*#__PURE__*/ _jsx("p", {
      children: "Paragraph"
    })
  ]
});
```
---

### ✅ 示例 8：带布尔属性和展开属性
```jsx
const props = { className: 'btn', disabled: true };

const button = <button {...props} onClick={null}>Submit</button>;
```
**转换后（React 17+ 自动运行时）**：
```js
import { jsx as _jsx } from "react/jsx-runtime";
const props = {
  className: "btn",
  disabled: true
};
const button = /*#__PURE__*/ _jsx("button", {
  ...props,
  onClick: null,
  children: "Submit"
});
```

---

### 🔧 使用提示：
1. 打开 [Babel REPL](https://babeljs.io/repl)
2. 在左侧粘贴任意上面的 JSX 代码
3. 点击右上角 **“Presets”** → 勾选 **`React`**
4. 查看右侧生成的 JavaScript 代码

> 💡 注意：Babel 默认使用 **React 17+ 的新 JSX 转换**（自动引入 `jsx`/`jsxs`），不再需要手动 `import React from 'react'`。如果你用的是旧版 React（<17），可以在 preset 设置中关闭 `runtime: 'automatic'`。

---

这些例子覆盖了 JSX 的常见用法，非常适合用来测试 Babel 的转换逻辑。如果你还想看特定场景（比如 Context、Portals、错误边界等），也可以告诉我！
 


# 总结

可以看到，JSX 最终被转换成了对 `React.createElement`（或在 React 17+ 中的 `_jsx`）的调用，生成一个描述 UI 结构的对象。这就是 JSX 的本质：一种语法糖，让我们可以用更直观的方式来描述 UI，而不必直接编写繁琐的函数调用。



# React.createElement 签名

`React.createElement` 返回的是一个 **ReactElement**（React 元素）对象，它是 React 的核心数据结构。

---

## 📦 ReactElement 对象结构

```js
{
  $$typeof: Symbol(react.element) | Number(0xeac7), // React 元素的标识符
  
  type: string | Function | React.ComponentType,   // 元素类型
  key: string | null,                                // 唯一标识（用于列表渲染）
  ref: object | null,                                // 引用（用于访问 DOM 或组件实例）
  props: object,                                     // 属性对象
  
  // 以下用于调试
  _owner: object | null,                             // 创建此元素的组件（Fiber）
  _store: { validated: boolean },                    // 内部验证状态
  
  // 可选的调试信息
  _self: any,                                        // 用于警告的 self 引用
  _source: { fileName: string, lineNumber: number }  // 创建位置（开发环境）
}
```

---

## 🔍 每个字段详细说明

### 1. `$$typeof` ⭐ **核心标识**
- **作用**：标识这是一个 React 元素（防止 XSS 攻击）
- **值**：
  - 开发环境：`Symbol.for('react.element')`
  - 旧浏览器（不支持 Symbol）：`0xeac7`（十进制 60103）
- **为什么重要**：React 通过检查此字段来验证元素合法性

### 2. `type`
- **原生元素**：`"div"`, `"span"`, `"input"` 等字符串
- **自定义组件**：组件函数或类的引用
- **特殊类型**：`React.Fragment`, `React.StrictMode` 等

### 3. `key`
- **类型**：`string | null`
- **作用**：在列表渲染时帮助 React 识别哪些元素改变了、添加了或删除了
- **注意**：不会出现在 `props` 中，是特殊属性

### 4. `ref`
- **类型**：`object | null`
- **作用**：用于访问 DOM 节点或组件实例
- **注意**：不会出现在 `props` 中，是特殊属性

### 5. `props`
- **类型**：`object`
- **内容**：所有传入的属性（不包括 `key` 和 `ref`）
- **特殊字段**：`children`（如果有子元素）

---

## 🧪 实际示例

### 示例 1：简单元素
```jsx
const element = React.createElement("h1", { id: "title" }, "Hello");

console.log(element);
// {
//   $$typeof: Symbol(react.element),
//   type: "h1",
//   key: null,
//   ref: null,
//   props: {
//     id: "title",
//     children: "Hello"
//   },
//   _owner: null,
//   _store: { validated: false },
//   _self: undefined,
//   _source: { fileName: "...", lineNumber: 1 }
// }
```

### 示例 2：带 key 和 ref
```jsx
const element = React.createElement(
  "div",
  { key: "item-1", ref: myRef, className: "box" },
  "Content"
);

console.log(element);
// {
//   $$typeof: Symbol(react.element),
//   type: "div",
//   key: "item-1",              // ← key 被提取出来
//   ref: myRef,                 // ← ref 被提取出来
//   props: {
//     className: "box",         // ← 不包含 key 和 ref
//     children: "Content"
//   },
//   ...
// }
```

### 示例 3：组件元素
```jsx
function MyComponent(props) {
  return <div>{props.children}</div>;
}

const element = React.createElement(
  MyComponent,
  { color: "blue" },
  "Text"
);

console.log(element);
// {
//   $$typeof: Symbol(react.element),
//   type: MyComponent,          // ← 是函数引用，不是字符串
//   key: null,
//   ref: null,
//   props: {
//     color: "blue",
//     children: "Text"
//   },
//   ...
// }
```

---

## 📊 与 JSX 编译的对应关系

```jsx
// JSX 写法
<div className="container">
  <h1>Hello</h1>
</div>

// 编译后
React.createElement(
  "div",
  { className: "container" },
  React.createElement("h1", null, "Hello")
)

// 返回的 ReactElement
{
  $$typeof: Symbol(react.element),
  type: "div",
  key: null,
  ref: null,
  props: {
    className: "container",
    children: {
      $$typeof: Symbol(react.element),
      type: "h1",
      props: { children: "Hello" },
      // ...
    }
  }
}
```

---

## ⚠️ 重要注意事项

1. **ReactElement 是普通 JavaScript 对象**  
   它不是 DOM 节点，也不是组件实例，只是一个描述"应该渲染什么"的数据结构。

2. **不可变性**  
   ReactElement 对象应该是不可变的（immutable），React 内部不会修改它。

3. **`$$typeof` 的安全作用**  
   通过检查 `$$typeof`，React 可以防止恶意对象被当作 React 元素渲染（XSS 防护）。

4. **开发环境与生产环境差异**  
   - 开发环境：包含 `_source`（文件位置）、`_self` 等调试信息
   - 生产环境：这些字段会被移除或简化

---

## 🔄 React 17+ 的变化

在 React 17+ 的新 JSX 转换中，返回的结构基本相同，但创建方式不同：

```js
// 旧方式（React.createElement）
React.createElement("div", { children: "Hello" })

// 新方式（_jsx）
_jsx("div", { children: "Hello" })

// 返回的 ReactElement 结构几乎相同
```

主要区别在于：
- 新方式性能更好（减少函数调用开销）
- 不需要 `import React from 'react'`

---

需要我进一步解释某个字段的用途吗？

# _jsx 和 _jsxs 的区别

这是 React 17+ 新 JSX 转换中的两个核心函数，它们的区别非常简单：

---

## 🎯 核心区别

| 函数 | 使用场景 | 子元素数量 |
|------|----------|------------|
| **`_jsx`** | 单个子元素 | **0 或 1 个** |
| **`_jsxs`** | 多个子元素 | **2 个或更多** |

---

## 📝 详细说明

### 1️⃣ `_jsx` - 单子元素优化

**适用场景：**
- 没有子元素（自闭合标签）
- 只有 1 个子元素（文本或单个元素）

**示例：**

```jsx
// 示例 1：没有子元素
<div />

// 编译为
_jsx("div", {});

// 示例 2：单个文本子元素
<h1>Hello</h1>

// 编译为
_jsx("h1", { children: "Hello" });

// 示例 3：单个元素子元素
<div>
  <span>Text</span>
</div>

// 编译为
_jsx("div", { children: _jsx("span", { children: "Text" }) });
```

---

### 2️⃣ `_jsxs` - 多子元素优化

**适用场景：**
- 有 2 个或更多子元素（文本、元素混合）

**示例：**

```jsx
// 示例 1：多个文本子元素
<div>
  Hello
  World
</div>

// 编译为
_jsxs("div", { children: ["Hello", "World"] });

// 示例 2：多个元素子元素
<div>
  <h1>Title</h1>
  <p>Paragraph</p>
</div>

// 编译为
_jsxs("div", {
  children: [
    _jsx("h1", { children: "Title" }),
    _jsx("p", { children: "Paragraph" })
  ]
});

// 示例 3：混合子元素
<div>
  Text
  <span>Element</span>
  More Text
</div>

// 编译为
_jsxs("div", {
  children: [
    "Text",
    _jsx("span", { children: "Element" }),
    "More Text"
  ]
});
```

---

## 🔍 为什么要有两个函数？

### 性能优化

React 团队在设计新 JSX 转换时做了性能分析：

1. **`_jsx` 更轻量**
   - 处理单个子元素时，不需要创建数组
   - 直接传递 `children` 值，减少内存分配

2. **`_jsxs` 专为数组优化**
   - 当有多个子元素时，必须使用数组
   - 内部可能有针对数组处理的优化路径

### 代码体积

```js
// 使用 _jsx（单子元素）
_jsx("div", { children: "Hello" });
// ↓
// 生成的代码更小

// 使用 _jsxs（多子元素）
_jsxs("div", { children: ["A", "B", "C"] });
// ↓
// 明确表示这是一个多子元素场景
```

---

## 🧪 实际对比

### 场景 1：单子元素

```jsx
// JSX
<div className="box">
  <h1>Hello</h1>
</div>

// 编译结果
_jsx("div", {
  className: "box",
  children: _jsx("h1", { children: "Hello" })
});
```

### 场景 2：多子元素

```jsx
// JSX
<div className="box">
  <h1>Hello</h1>
  <p>World</p>
</div>

// 编译结果
_jsxs("div", {
  className: "box",
  children: [
    _jsx("h1", { children: "Hello" }),
    _jsx("p", { children: "World" })
  ]
});
```

### 场景 3：文本 + 元素混合

```jsx
// JSX
<div>
  Hello
  <span>React</span>
  !
</div>

// 编译结果
_jsxs("div", {
  children: [
    "Hello",
    _jsx("span", { children: "React" }),
    "!"
  ]
});
```

---

## ⚠️ 重要注意事项

### 1. **不要手动调用这些函数**

这些函数是 Babel/TypeScript 编译器自动生成的，**不要在代码中直接使用**：

```js
// ❌ 错误做法
import { jsx, jsxs } from 'react/jsx-runtime';
const el = jsx("div", { children: "Hello" });

// ✅ 正确做法
const el = <div>Hello</div>;
```

### 2. **函数签名相同**

两个函数的签名完全一致：

```ts
function jsx(
  type: string | ReactComponent,
  props: object,
  key?: string
): ReactElement;

function jsxs(
  type: string | ReactComponent,
  props: object,
  key?: string
): ReactElement;
```

唯一的区别是内部实现的优化路径。

### 3. **React 16 vs React 17+**

| 版本 | 转换方式 | 导入需求 |
|------|----------|----------|
| React 16 | `React.createElement` | 必须 `import React` |
| React 17+ | `_jsx` / `_jsxs` | 自动导入，无需手动 |

---

## 📊 总结表格

| 特性 | `_jsx` | `_jsxs` |
|------|--------|---------|
| **子元素数量** | 0 或 1 | ≥ 2 |
| **children 类型** | 值或单个元素 | 数组 |
| **性能** | 更轻量 | 针对数组优化 |
| **使用场景** | 简单元素 | 复杂结构 |
| **手动调用** | ❌ 不推荐 | ❌ 不推荐 |

---

## 💡 实用技巧

### 如何在 Babel REPL 中验证

1. 打开 [https://babeljs.io/repl](https://babeljs.io/repl)
2. 确保 `React Runtime` 选择 **`Automatic`**
3. 输入不同子元素数量的 JSX，观察输出：

```jsx
// 单子元素 → _jsx
<div>Text</div>

// 多子元素 → _jsxs
<div>Text1 Text2</div>
```

---

这就是 `_jsx` 和 `_jsxs` 的全部区别！本质上是为了**性能优化**而设计的两个专用函数，编译器会根据子元素数量自动选择使用哪个。