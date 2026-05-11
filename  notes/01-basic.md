# 事件

*   `event.target`: 事件最初发生的那个具体元素（事件源）
*   `event.currentTarget`: 当前正在处理事件的那个元素（绑定监听器的元素）

![案例](../../../assets/event-pic1.jpg)

> **注意**：React 17 版本开始，事件就不再绑定到 `document` 上了
![案例2](../../../assets/event-pic2.jpg)
>
> *   React 16 绑定到 `document`
> *   React 17 事件绑定到 `root` 组件
> *   有利于多个 React 版本并存，例如微前端

# setState

## React <= 17 以前

*   **不可变值**
*   **可能是异步更新**
*   **可能会被合并**

## React <= 17 中 setState 的同步/异步场景详析

在 React 17 及更早版本中，`setState` 的行为是同步还是异步，并不取决于 `setState` 本身的实现，而是取决于它所处的执行上下文（Execution Context）。这个上下文决定了 React 是否开启了其内部的 "批处理模式"（batching mode），而这个模式的存在与否，直接关联到 `setState` 的同步或异步表现。

以下是 `setState` 表现为同步或异步的所有主要场景，以及背后的机制。

--------------------------------------------------------------------------------

### 一、setState 表现为 **异步** 的场景

在这种场景下，`setState` 的调用不会立即更新组件的 `state`。React 会将这些状态更新放入一个队列中，在稍后的某个时间点（通常是事件循环的末尾）一起处理，以提高性能。因此，紧随其后的对 `this.state` 的访问，获取的依然是更新前的值。

#### 1. React 事件处理器 (React Event Handlers)

这是最常见的异步场景。React 为自己的事件系统（如 `onClick`, `onSubmit`, `onFocus` 等）包裹了一层处理逻辑。

```javascript
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  handleClick = () => {
    // 在 React 事件处理器中
    console.log('Before setState:', this.state.count); // 输出: 0

    this.setState({ count: this.state.count + 1 });
    console.log('After setState:', this.state.count);  // 输出: 0 (异步，state 尚未更新!)

    // 如果有多个 setState，它们会被合并
    this.setState({ count: this.state.count + 10 }); // this.state.count 仍为 0
    // 最终 count 只会增加 1，而不是 11。
  };

  render() {
    return <button onClick={this.handleClick}>Count: {this.state.count}</button>;
  }
}
```
为什么异步？

React 在调用 handleClick 之前，会开启内部的批处理模式。当 handleClick 执行完毕后，React 会关闭该模式，并执行所有在该模式下积累的 setState 操作。

#### 2. React 生命周期方法 (Lifecycle Methods)

在组件的生命周期方法中调用 `setState`，同样处于 React 的控制之下，因此也是异步的。

*   `componentDidMount`
*   `componentDidUpdate`
*   `componentWillReceiveProps` (已废弃)
*   `getSnapshotBeforeUpdate`
*   `render` 方法内部不能调用 `setState`，会导致无限循环。

```javascript
class MyComponent extends React.Component {
  state = { data: null };

  componentDidUpdate(prevProps, prevState) {
    // 异步场景
    if (prevProps.id !== this.props.id) {
      this.setState({ loading: true });
      console.log(this.state.loading); // false (异步，还未更新)
    }
  }
}
```


### 二、setState 表现为 **同步** 的场景

在这种场景下，`setState` 的调用会立即更新组件的 `state`。因此，紧随其后的对 `this.state` 的访问，可以获取到刚刚更新后的值。

#### 1. 原生 DOM 事件处理器 (Native DOM Event Handlers)

当直接使用浏览器的原生事件 API（如 `addEventListener`）时，React 无法控制事件处理的上下文，也就无法开启批处理模式。因此，`setState` 会同步执行。

```javascript
class MyComponent extends React.Component {
  state = { count: 0 };

  componentDidMount() {
    // 直接绑定原生事件，React 无法介入
    document.addEventListener('click', this.handleDocumentClick);
  }

  handleDocumentClick = () => {
    // 同步场景
    console.log('Before setState:', this.state.count); // 输出: 0

    this.setState({ count: this.state.count + 1 });
    console.log('After setState:', this.state.count);  // 输出: 1 (同步更新!)
  };

  render() {
    return <div>Count: {this.state.count}</div>;
  }
}
```

#### 2. setTimeout / setInterval 回调

`setTimeout` 和 `setInterval` 的回调函数是在一个全新的事件循环周期中执行的，此时 React 的批处理模式已经关闭。因此，在这些回调中调用 `setState` 是同步的。

```javascript
class MyComponent extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    setTimeout(() => {
      // 同步场景
      console.log('Before setState:', this.state.count); // 输出: 0

      this.setState({ count: this.state.count + 1 });
      console.log('After setState:', this.state.count);  // 输出: 1 (同步更新!)

      this.setState({ count: this.state.count + 1 });
      console.log('After 2nd setState:', this.state.count); // 输出: 2 (继续同步更新!)
    }, 0);
  };

  render() {
    return <button onClick={this.handleClick}>Count: {this.state.count}</button>;
  }
}
```

#### 3. Promise 回调 (`.then`, `.catch`, `async/await`)

Promise 的回调函数（包括 `async/await` 编译后的代码）也是在当前执行栈清空后，在微任务队列中执行的。这同样脱离了 React 的批处理上下文，因此 `setState` 是同步的。

```javascript
class MyComponent extends React.Component {
  state = { data: null };

  handleClick = () => {
    fetch('/api/data')
      .then(response => response.json())
      .then(data => {
        // 同步场景
        this.setState({ data });
        console.log(this.state.data); // 输出: 新的 data (同步更新!)
      });
  };

  // 或者使用 async/await
  fetchData = async () => {
    const response = await fetch('/api/data');
    const data = await response.json();
    // 同步场景
    this.setState({ data });
    console.log(this.state.data); // 输出: 新的 data (同步更新!)
  };

  render() {
    return <button onClick={this.handleClick}>Fetch Data</button>;
  }
}
```

#### 4. 自定义事件或第三方库的回调

任何脱离了 React 事件系统的外部库或自定义事件回调，都处于同步上下文中。

```javascript
class MyComponent extends React.Component {
  state = { position: null };

  componentDidMount() {
    // 假设 geolocation.getCurrentPosition 是一个第三方库的 API
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // 同步场景
        this.setState({ position });
        console.log(this.state.position); // 输出: 新的 position (同步更新!)
      },
      (error) => {
        // 同步场景
        this.setState({ error: error.message });
        console.log(this.state.error); // 输出: 新的 error (同步更新!)
      }
    );
  }
}
```
--------------------------------------------------------------------------------

## 合并场景

### React <= 17 中 setState 的合并机制

在 React 17 及更早版本中，`setState` 的合并行为与它的同步/异步行为密切相关。合并只发生在异步（批量更新）的场景中，而在同步场景中，每一次 `setState` 都会被独立执行，不会合并。

--------------------------------------------------------------------------------

### 一、会发生 **合并** 的场景（异步批量更新）

当 `setState` 处于 React 的批量更新模式时，它会对对象形式的 `setState` 进行合并。

#### 1. React 事件处理器 (`onClick`, `onSubmit` 等)

```javascript
class MyComponent extends React.Component {
  state = { count: 0, name: 'React' };

  handleClick = () => {
    // 异步 + 合并场景
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 10 }); // 这里的 this.state.count 仍是旧值
    this.setState({ name: 'Updated' });

    // 最终只会触发一次 re-render
    // 结果: { count: 1, name: 'Updated' }
    // (第一个和第二个 setState 合并了，{ count: 1 } 覆盖了 { count: 10 })
  };

  render() {
    return <button onClick={this.handleClick}>{this.state.name}: {this.state.count}</button>;
  }
}
```
#### 2. React 生命周期方法

```javascript
class MyComponent extends React.Component {
  state = { value: 0 };

  componentDidUpdate(prevProps) {
    if (prevProps.shouldUpdate) {
      // 异步 + 合并场景
      this.setState({ value: 1 });
      this.setState({ value: 2 });
      // 结果: value = 2 (两次合并，后一个覆盖前一个)
    }
  }
}
```
#### 3. 合并规则详解

*   **对象形式 (`{...}`)**：会被合并。相同的 `key` 会被后面的覆盖。
*   **函数形式 (`(prevState, props) => {...}`)**：不会被合并，而是按顺序执行。每个函数都会接收上一个函数执行后的结果。

```javascript
class MyComponent extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    // 对象形式合并
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 10 }); // this.state.count 仍是 0
    // 结果: count = 1 (第一个覆盖了第二个)

    // 函数形式不合并，顺序执行
    this.setState(prevState => ({ count: prevState.count + 1 }));
    this.setState(prevState => ({ count: prevState.count + 10 })); // prevState.count 是 1
    // 结果: count = 11 (1 + 10)
  };
}
```
## React 18 以后的变化

React 18 引入了 Automatic Batching。无论 setState 或 useState 的 setter 在何处被调用，它们都会被自动批量处理。

# 类组件的生命周期
![生命周期](../../../assets/lifecycle.jpg
)

https://www.bilibili.com/video/BV1B5411h7W8/?spm_id_from=333.337.search-card.all.click&vd_source=d66a6fb5cb08fa8db4dd3bf2bd839f71


# 受控组件

受控组件是指表单元素的值由 React 状态（state）完全控制的组件。用户在表单中输入的内容不会直接改变 DOM，而是先更新 React 的 state，再由 state 重新渲染 UI。

## 和非受控组件对比

| 特性 | 受控组件 | 非受控组件 |
| :--- | :--- | :--- |
| 数据来源 | React State | DOM |
| 实时访问 | ✅ | ❌ |
| 验证时机 | 输入时即可 | 提交时 |
| 代码复杂度 | 较高 | 较低 |
| 推荐程度 | ✅ 官方推荐 | 适用于简单场景 |

# 函数组件

*   **纯函数**
*   **没有实例，没有声明周期，没有state**

## 函数组件的生命周期

https://www.bilibili.com/video/BV1FfJDzyEgT/?spm_id_from=333.337.search-card.all.click&vd_source=d66a6fb5cb08fa8db4dd3bf2bd839f71
![mount](../../../assets/f-mount.jpg)
![update](../../../assets/f-up.jpg)
![unmount](../../../assets/f-um.jpg)



<br>
<br>
<br>

# 非受控组件

非受控组件是 React 中管理表单数据的另一种方式。它的特点是表单数据由 DOM 本身管理，而不是由 React 组件的 state 来驱动。

## 核心概念

- **受控组件 (Controlled Components)**：表单元素的值由 React state 控制。每当用户输入时，都会触发 onChange 事件，更新 state，然后 React 用这个新的 state 值重新渲染表单元素。
- **非受控组件 (Uncontrolled Components)**：表单元素的值不由 React state 控制。React 让浏览器自己管理表单数据。当需要获取用户输入时（例如，提交表单时），我们手动从 DOM 中查询。

## 如何创建非受控组件？

主要工具是 ref。

### 1. 基本用法

```jsx
import React, { useRef } from 'react';

function MyForm() {
  // 创建一个 ref 来绑定到 input 元素
  const inputRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    // 从 DOM 中获取值
    console.log(inputRef.current.value); // 这里直接从 DOM 获取值
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" ref={inputRef} defaultValue="Default Value" />
      {/* 注意：这里没有 value 和 onChange */}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 2. 与 defaultValue 配合

- `value` 属性用于受控组件。
- `defaultValue` 属性用于非受控组件，设置初始值。它只在组件挂载时设置一次，后续更改不会影响 DOM。

```jsx
<input
  ref={inputRef}
  type="text"
  defaultValue="Initial Value" // 设置初始值
/>
```

对于 `<select>` 和 `<textarea>`，也有对应的 defaultChecked 和 defaultValue。

### 3. 处理复选框和单选按钮

```jsx
function MyForm() {
  const checkboxRef = useRef(null);
  const radioRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Checkbox checked?', checkboxRef.current.checked);
    console.log('Radio selected value:', radioRef.current.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        <input
          type="checkbox"
          ref={checkboxRef}
          defaultChecked={false} // 初始是否选中
        />
        Agree to Terms
      </label>

      <label>
        <input type="radio" ref={radioRef} value="option1" name="group" defaultChecked />
        Option 1
      </label>
      <label>
        <input type="radio" ref={radioRef} value="option2" name="group" />
        Option 2
      </label>

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 非受控组件 vs 受控组件

| 特性 | 受控组件 | 非受控组件 |
| :--- | :--- | :--- |
| 数据来源 | React State | DOM |
| 数据更新 | 通过 onChange 同步到 state | 用户直接在 DOM 上修改 |
| 获取值 | 从 state 获取 | 通过 ref 从 DOM 获取 |
| 实时验证 | ✅ 容易实现 | ❌ 较难实现 |
| 动态设置值 | ✅ 容易实现 | ❌ 较难实现 |
| 代码复杂度 | 较高 (需要 state 和 onChange) | 较低 |
| 适用场景 | 需要实时验证、动态控制 | 简单表单、文件上传 |

---

## 何时使用非受控组件？

1. **简单的表单**：不需要实时验证或动态控制，只需要在提交时获取最终值。
2. **集成第三方库**：某些需要直接操作 DOM 的库。
3. **文件输入 (`<input type="file" />`)**：文件输入元素只能由用户操作，不能由程序设置，因此很难受控。

```jsx
function FileInput() {
  const fileInputRef = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    // 获取文件对象
    const file = fileInputRef.current.files[0];
    console.log(file);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" ref={fileInputRef} />
      <button type="submit">Upload</button>
    </form>
  );
}
```

## 混合使用

在一个表单中，你可以混合使用受控和非受控组件。

```jsx
function MixedForm() {
  const [username, setUsername] = useState('');
  const emailRef = useRef(null); // 非受控

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log({
      username, // 从 state 获取
      email: emailRef.current.value // 从 DOM 获取
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 受控组件 */}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username (controlled)"
      />
      
      {/* 非受控组件 */}
      <input
        type="email"
        ref={emailRef}
        defaultValue=""
        placeholder="Email (uncontrolled)"
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

## 用 form data 来统一处理

```jsx
// 使用 FormData 来获取表单数据
export default function MyForm3() {
    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        // 方式1: 转换为普通对象
        const data = Object.fromEntries(formData.entries());
        console.log('As Object:', data);

        // 方式2: 保持为 FormData 对象，方便发送
        console.log('As FormData:', formData);
        // fetch('/api/submit', { method: 'POST', body: formData });

        // 或者，你也可以直接遍历 elements
        // const formElements = e.target.elements;
        // console.log(formElements.name.value); // 'John'
        // console.log(formElements.age.value);  // '30'
        // console.log(formElements.bio.value);  // 'Hello world!'
    };

    return (
        <form onSubmit={handleSubmit}>
            <input name="name" type="text" defaultValue="John" />
            <input name="age" type="number" defaultValue="30" />
            <textarea name="bio" defaultValue="Hello world!" />
            <button type="submit">Submit</button>
        </form>
    );
}
```

# Portals

## React Portals

React Portal 提供了一种将子节点渲染到存在于父组件 DOM 层级之外的 DOM 节点的方案。它让你可以在 React 组件树中“传送”一部分 UI 到页面上任意位置的 DOM 节点中，而事件冒泡等行为依然遵循 React 的组件树结构。

---

## 为什么要使用 Portal？

最常见的使用场景是创建弹窗、模态框、下拉菜单、工具提示等组件。这些组件的视觉层级通常很高（比如 z-index 很大），并且不受父容器的 overflow: hidden 等 CSS 属性限制。

### 没有 Portal 时的问题

```jsx
function ModalParent() {
  return (
    <div className="parent-container" style={{ height: '200px', overflow: 'hidden' }}>
      <p>Some content...</p>
      {/* 这个 modal 会被渲染在 parent-container 内部 */}
      <div className="modal-overlay">
        <div className="modal-content">
          I'm trapped inside the parent container!
        </div>
      </div>
    </div>
  );
}
```

在这种情况下，modal 会被 parent-container 的 overflow: hidden 截断，因为它仍然是父元素的子元素。

### 使用 Portal 解决问题

```jsx
// 1. 在 HTML 中准备一个 DOM 容器
// index.html
/*
<body>
  <div id="root"></div>
  <div id="modal-root"></div> <!-- Portal 的目标容器 -->
</body>
*/

// 2. 在 React 组件中使用 Portal
import { createPortal } from 'react-dom';

function Modal({ children, isOpen }) {
  if (!isOpen) {
    return null;
  }

  // 将 children 渲染到 #modal-root DOM 节点中
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
      </div>
    </div>,
    document.getElementById('modal-root') // 指定目标 DOM 节点
  );
}

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="app">
      <button onClick={() => setIsModalOpen(true)}>Open Modal</button>
      {/* Modal 组件在 React 树中位于此处 */}
      <Modal isOpen={isModalOpen}>
        <p>This modal is rendered outside the App's DOM hierarchy!</p>
        <button onClick={() => setIsModalOpen(false)}>Close</button>
      </Modal>
    </div>
  );
}
```

在上面的例子中，`<Modal />` 组件在 React 的组件树中是 `<App />` 的子组件，但在真实的浏览器 DOM 中，它的 DOM 结构会被渲染到 `<body>` 下的 `<div id="modal-root"></div>` 里面，从而避免了 CSS 层叠和定位的干扰。

---

## createPortal 语法

```js
const portalElement = createPortal(
  children, // 任何可渲染的 React 子元素
  container // 一个真实的 DOM 元素
);
```

---

## Portal 的重要特性：事件冒泡

事件冒泡遵循 React 组件树，而不是 DOM 树。

这是一个非常重要的特性，它保证了组件的封装性。

```jsx
function App() {
  const handleAppClick = () => {
    alert('App clicked!'); // 这个处理器会被触发
  };

  return (
    <div onClick={handleAppClick}>
      <h1>My App</h1>
      <ModalContent /> {/* ModalContent 是 Portal 的子组件 */}
    </div>
  );
}

function ModalContent() {
  const handleModalClick = (e) => {
    // e.stopPropagation(); // 阻止事件向上冒泡到 App
    alert('Modal clicked!');
  };

  return createPortal(
    <div onClick={handleModalClick} id="modal-root">
      Click me!
    </div>,
    document.body
  );
}
```

在这个例子中，即使 ModalContent 的 DOM 被渲染到了 `<body>` 下，当点击 Click me! 时，事件会首先触发 handleModalClick，然后向上冒泡到 React 组件树中的父组件 `<App />`，并触发 handleAppClick。React 的事件系统能够感知到 Portal 的存在，并按照组件树的结构来处理事件流。

---

## 使用 Portal 的最佳实践

1. **确保目标 DOM 节点存在**：在调用 createPortal 之前，确保目标 DOM 节点已经存在于页面上。
2. **用于弹窗和覆盖层**：Modal、Drawer、Dropdown、Tooltip 等 UI 组件是 Portal 的典型应用场景。
3. **注意无障碍性**：当内容被传送出去后，要注意管理焦点（focus management）和屏幕阅读器的体验。

# React Context
在 React 中，**类组件（Class Component）使用 Context** 的方式与函数组件不同，它不使用 `useContext` Hook（因为 Hook 只能在函数组件中使用），而是通过以下两种方式：

---

## ✅ 方式一：使用 `static contextType`（适用于单个 Context）

这是最简洁的方式，但**只能订阅一个 Context**。

### 步骤示例：

```tsx
// 1. 创建 Context
import React from 'react';

const ThemeContext = React.createContext('light');

// 2. 类组件中使用 static contextType
class ThemedButton extends React.Component {
  // 声明要使用的 Context
  static contextType = ThemeContext;

  render() {
    // 通过 this.context 获取值
    const theme = this.context;

    return (
      <button style={{ background: theme === 'dark' ? '#333' : '#fff' }}>
        当前主题：{theme}
      </button>
    );
  }
}

export default ThemedButton;
```

> ✅ 优点：语法简洁  
> ❌ 缺点：只能使用一个 Context

---

## ✅ 方式二：使用 `<Context.Consumer>`（适用于多个 Context）

如果你需要消费**多个 Context**，或者不想用 `static` 属性，可以使用 **Consumer** 模式。

### 示例：消费两个 Context

```tsx
// 创建两个 Context
const ThemeContext = React.createContext('light');
const UserContext = React.createContext({ name: 'Guest' });

class ProfilePage extends React.Component {
  render() {
    return (
      <ThemeContext.Consumer>
        {theme => (
          <UserContext.Consumer>
            {user => (
              <div style={{ background: theme === 'dark' ? '#000' : '#fff' }}>
                <p>欢迎你，{user.name}！</p>
                <p>当前主题：{theme}</p>
              </div>
            )}
          </UserContext.Consumer>
        )}
      </ThemeContext.Consumer>
    );
  }
}
```

> ✅ 优点：支持多个 Context  
> ❌ 缺点：嵌套多时代码较“回调地狱”（可配合 render props 优化）

---

## 🧩 完整示例：Provider + Class 组件消费

```tsx
// App.tsx
import React from 'react';

const ThemeContext = React.createContext('light');

// Provider 在祖先组件中
class App extends React.Component {
  state = { theme: 'dark' };

  toggleTheme = () => {
    this.setState(prev => ({
      theme: prev.theme === 'light' ? 'dark' : 'light'
    }));
  };

  render() {
    return (
      <ThemeContext.Provider value={this.state.theme}>
        <div>
          <button onClick={this.toggleTheme}>切换主题</button>
          <ThemedButton />
        </div>
      </ThemeContext.Provider>
    );
  }
}

// 消费 Context 的类组件
class ThemedButton extends React.Component {
  static contextType = ThemeContext; // ← 关键！

  render() {
    const theme = this.context; // ← 从 this.context 读取
    return (
      <button style={{ background: theme === 'dark' ? '#333' : '#fff' }}>
        按钮（{theme} 模式）
      </button>
    );
  }
}

export default App;
```

---

## ⚠️ 注意事项

| 问题 | 说明 |
|------|------|
| **`contextType` 必须是静态属性** | 写成 `static contextType = MyContext`，不能写在实例上 |
| **不能在函数组件中使用** | 类组件专属 |
| **默认值只在无 Provider 时生效** | 如果有 `<MyContext.Provider>`，即使 `value={undefined}`，也不会用默认值！ |
| **TypeScript 类型支持** | 需要正确声明 Context 类型（见下文） |


---

## 🔤 TypeScript 支持（推荐）

```tsx
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

// 在类组件中
class MyComponent extends React.Component {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>; // ← 关键！类型断言

  render() {
    this.context.toggleTheme(); // ✅ 有类型提示
    return <div>{this.context.theme}</div>;
  }
}
```

> 💡 `declare context: ...` 是 TypeScript 中为类属性声明类型的方式，避免 `any`。

---

## 🆚 函数组件 vs 类组件使用 Context 对比

| 方式 | 函数组件 | 类组件 |
|------|--------|--------|
| 单个 Context | `const value = useContext(MyContext)` | `static contextType = MyContext` + `this.context` |
| 多个 Context | 多次调用 `useContext` | 使用多个 `<MyContext.Consumer>` 嵌套 |
| 可读性 | 更简洁 | 稍显冗长（尤其多 Context 时） |

---

## ✅ 总结

- 如果你**维护老项目**或必须用类组件：
  - 单个 Context → 用 `static contextType`
  - 多个 Context → 用 `<Context.Consumer>`
- **新项目强烈建议使用函数组件 + `useContext`**，更简洁、组合性更强
- 类组件的 Context 用法是 React 官方支持的，但已不是主流开发方式

> 📌 官方文档参考：[https://react.dev/reference/react/createContext#class.contextType](https://react.dev/reference/react/createContext#class.contextType)

# Context 的弊端
过度渲染，就算用了memo来屏蔽多余渲染，但是context仍然会跳过memo，执行订阅了context的组件代码。尽管这个组件并没有使用改变的field

https://github.com/lubenweiniubi1/react-demo/blob/main/app/routes/contextDemo.tsx

# 异步组件
好的！既然您说“不用管 Context 了”，那我们就完全聚焦在 **React 中的异步组件（Async Components）** 上，不涉及 Context。

---

## ✅ 什么是“异步组件”？（React 中的标准含义）

在 React 生态中，“异步组件”通常指：

> **通过动态 `import()` 按需加载的组件**，配合 `React.lazy` 和 `Suspense` 实现代码分割（Code Splitting）。

这是官方推荐的懒加载方式，用于优化应用首屏加载速度。

---

## 🧩 基础用法

### 1. 定义一个普通组件（比如 `Dashboard.tsx`）

```tsx
// Dashboard.tsx
export default function Dashboard() {
  return <div>📊 这是一个重型仪表盘组件</div>;
}
```

### 2. 在主应用中异步加载它

```tsx
// App.tsx
import React, { Suspense } from 'react';

// ✅ 异步组件：使用 React.lazy + 动态 import
const AsyncDashboard = React.lazy(() => import('./Dashboard'));

export default function App() {
  return (
    <div>
      <h1>主界面</h1>

      {/* ⏳ 用 Suspense 包裹，提供加载状态 */}
      <Suspense fallback={<div>正在加载仪表盘...</div>}>
        <AsyncDashboard />
      </Suspense>
    </div>
  );
}
```

---

## 🔍 关键特性

| 特性 | 说明 |
|------|------|
| **按需加载** | 只有当组件即将渲染时才加载 JS bundle |
| **减少首屏体积** | 主包不包含 `Dashboard` 的代码 |
| **天然支持 SSR** | 需配合框架（如 Next.js），原生 React 不支持服务端 `lazy` |
| **仅支持默认导出** | `React.lazy` 要求模块使用 `export default` |

---

## ⚠️ 常见限制与解决方案

### ❌ 不能直接在函数组件内部定义 `lazy`

```tsx
// ❌ 错误：每次渲染都会创建新 lazy 组件 → 导致无限重新加载
function App() {
  const LazyComp = React.lazy(() => import('./Comp')); // 千万别这么写！
  return <LazyComp />;
}
```

✅ **正确做法**：在模块顶层定义

```tsx
// ✅ 正确
const LazyComp = React.lazy(() => import('./Comp'));

function App() {
  return <LazyComp />;
}
```

---

### ❌ 不支持命名导出（Named Export）

```tsx
// ❌ 不能直接 lazy 加载命名导出
const { NamedComponent } = React.lazy(() => import('./module'));
```

✅ **解决方案**：用中间模块或转换

```tsx
// 方案 1：创建中间文件 wrapper.tsx
// wrapper.tsx
export { default } from './NamedComponentFile';
// 然后 lazy 加载 wrapper

// 方案 2：在 lazy 回调中解构（不推荐，破坏 tree-shaking）
const LazyNamed = React.lazy(async () => {
  const module = await import('./module');
  return { default: module.NamedComponent };
});
```

---

## 🔄 异步组件的生命周期

- **首次渲染前**：触发 `import()`，开始网络请求
- **加载中**：显示 `Suspense` 的 `fallback`
- **加载成功**：挂载组件，后续行为和普通组件**完全一致**
- **加载失败**：抛出错误（可用 `ErrorBoundary` 捕获）

> 💡 **重要**：异步组件一旦加载完成，就和普通组件没区别——**不会反复卸载/重挂载**。

---

## 🛠️ 高级用法示例

### 1. 路由级代码分割（React Router）

```tsx
// 使用 react-router-dom v6
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';

const Home = React.lazy(() => import('./pages/Home'));
const Profile = React.lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Suspense fallback="页面加载中...">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

### 2. 条件懒加载（比如点击后加载）

```tsx
import { useState, Suspense, lazy } from 'react';

const HeavyModal = lazy(() => import('./HeavyModal'));

export default function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)}>打开弹窗</button>
      
      {showModal && (
        <Suspense fallback="加载弹窗...">
          <HeavyModal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </div>
  );
}
```


---

## 📊 性能收益

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 主包大小 | 500 KB | 300 KB |
| 首屏加载时间 | 2.1s | 1.2s |
| TTI（可交互时间） | 2.5s | 1.4s |

> ✅ 尤其适合：大型表单、图表、设置页、管理后台等非首屏内容。


## 异步组件什么时候被需要？
这是一个**非常核心的问题**！  
“异步组件按需加载”中的 **“被需要”**，在 React 中有**明确的触发时机**：

> ✅ **当异步组件即将被渲染（mount）时，React 才会去加载它。**

---

## 🔍 详细解释：什么是“即将被渲染”？

### 场景 1：直接放在 JSX 中（最常见）
```tsx
const AsyncChart = React.lazy(() => import('./Chart'));

function App() {
  return (
    <div>
      <h1>主界面</h1>
      <AsyncChart /> {/* 👈 这里就是“被需要”的时刻 */}
    </div>
  );
}
```

- **触发时机**：当 `App` 组件渲染到 `<AsyncChart />` 这一行时
- **行为**：
  - React 发现这是 `lazy` 组件
  - **立即发起动态 import()**
  - 同时向上找最近的 `<Suspense>` 显示 `fallback`
  - 加载完成后，渲染 `Chart` 组件

> 💡 此时“被需要” = **组件出现在当前渲染树中**

---

### 场景 2：条件渲染（更典型）
```tsx
const SettingsPanel = React.lazy(() => import('./Settings'));

function App() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div>
      <button onClick={() => setShowSettings(true)}>
        打开设置
      </button>

      {showSettings && (
        <Suspense fallback="加载设置...">
          <SettingsPanel /> {/* 👈 点击按钮后才“被需要” */}
        </Suspense>
      )}
    </div>
  );
}
```

- **初始状态**：`showSettings = false` → `<SettingsPanel />` **不在渲染树中** → **不会加载**
- **点击按钮后**：`showSettings = true` → React 尝试渲染 `<SettingsPanel />` → **此时才“被需要”** → 开始加载

> ✅ **这就是真正的“按需”**：用户不点，就不加载！

---

### 场景 3：路由切换（React Router）
```tsx
const Profile = React.lazy(() => import('./Profile'));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route 
        path="/profile" 
        element={
          <Suspense fallback="加载个人资料...">
            <Profile /> {/* 👈 访问 /profile 时才“被需要” */}
          </Suspense>
        } 
      />
    </Routes>
  );
}
```

- **访问 `/` 时**：`Profile` **不会加载**
- **切换到 `/profile` 时**：React Router 渲染 `<Profile />` → **此时“被需要”** → 开始加载

---

## 🧠 关键原则总结

| 情况 | 是否“被需要” | 是否加载 |
|------|--------------|----------|
| 组件在 JSX 中且条件为真 | ✅ 是 | ✅ 加载 |
| 组件在 JSX 中但被 `false && <Comp />` 阻止 | ❌ 否 | ❌ 不加载 |
| 组件未出现在当前渲染树中 | ❌ 否 | ❌ 不加载 |
| 组件已加载过 | ✅（但已缓存）| ⚡ 从缓存读取（不重复请求） |

> 🔥 **核心规则**：  
> **只有当 React 的 reconciler（协调器）准备渲染这个组件时，它才“被需要”**。

---

## ⏱️ 加载过程时间线（以条件渲染为例）

1. **初始渲染**  
   → `showSettings = false`  
   → `<SettingsPanel />` **不存在于虚拟 DOM 中**  
   → **零网络请求**

2. **用户点击“打开设置”**  
   → `setShowSettings(true)` 触发重渲染  
   → 新虚拟 DOM 包含 `<SettingsPanel />`  
   → React 检测到这是 `lazy` 组件  
   → **发起 `import()` 请求**  
   → 显示 `<Suspense fallback>`  
   → 网络加载 JS bundle  
   → 加载完成 → 渲染 `SettingsPanel`

---

## 🛠️ 如何验证“何时被需要”？

在浏览器 DevTools 的 **Network 面板**中观察：

- 初始加载：**看不到** `chunk.xxx.js`
- 点击按钮后：**突然出现** `chunk.xxx.js` 的请求
- 再次点击：**无新请求**（浏览器缓存或 Webpack 缓存）

---

## ❓ 常见疑问

### Q：能不能提前加载（预加载）？
**A：可以！** 在用户可能需要之前手动触发 `import()`：
```ts
// 鼠标悬停时预加载
useEffect(() => {
  if (isHoveringButton) {
    import('./HeavyComponent'); // 触发加载，但不 await
  }
}, [isHoveringButton]);
```

### Q：如果组件在屏幕外（比如长列表底部），会加载吗？
**A：会！** 只要它在 JSX 中（即使不可见），React 就会加载。  
→ 解决方案：结合 **虚拟滚动** 或 **Intersection Observer** 实现“真正按需”。

---

## ✅ 终极一句话回答

> **异步组件在“即将被 React 渲染到页面上”的那一刻才被需要，此时才会发起网络请求加载它的代码。**

这就像你去图书馆借书：
- **不借的时候**：书安静躺在书架上（不加载）
- **你走到柜台说“我要这本书”**：管理员才去拿书（开始加载）
- **拿到书后**：你才能阅读（组件渲染）

而 `React.lazy` + `Suspense` 就是那个**智能图书管理系统** 📚
---

## ❓ 常见问题 FAQ

### Q：异步组件会重复加载吗？
A：**不会**。Webpack（或其他打包器）会对已加载的 chunk 做缓存，第二次访问直接从内存读取。

### Q：能预加载吗？
A：可以！用 `import()` 提前触发：
```ts
// 鼠标悬停时预加载
useEffect(() => {
  if (isHovered) {
    import('./HeavyComponent'); // 触发预加载
  }
}, [isHovered]);
```

### Q：和 `useDeferredValue` / `useTransition` 有什么关系？
A：它们是**不同维度的优化**：
- `React.lazy` → **减少初始 bundle 大小**
- `useTransition` → **让更新不阻塞 UI**

可以结合使用！

---

## ✅ 总结

| 关键点 | 说明 |
|--------|------|
| **异步组件 = `React.lazy` + `Suspense`** | 官方标准懒加载方案 |
| **只影响加载时机，不影响运行时行为** | 加载后就是普通组件 |
| **必须用 `Suspense` 包裹** | 否则报错 |
| **适合非首屏、低频使用的重型组件** | 如设置页、报表、编辑器等 |

---
 
# shouldComponentUpdate
react 默认更新逻辑：

+ 父组件更新，子组件无条件更新,这里的更新可能不改变dom，但是会走一遍完整的更新周期

对应的， SCU 默认返回 true

## PureComponent
+  PureComponent,SCU 中实现了浅比较
+  浅比较已使用大部分情况（尽量不要做深度比较）

## Memo
+  memo，函数组件中的 PureComponent

# 随笔 ---------------------------------------
*** 
cra被弃用了https://react.docschina.org/blog/2025/02/14/sunsetting-create-react-app

# 浅层比较

浅层比较是一种比较对象或数组的方法，它只比较对象的第一层属性，而不递归深入到嵌套的子对象或子数组中。

## React 的浅层比较 (Shallow Comparison)

### 核心定义

浅层比较是一种比较对象或数组的方法，它只比较对象的第一层属性，而不递归深入到嵌套的子对象或子数组中。

---

## 如何进行浅层比较？

### 1. 对于基本类型

```js
// 直接比较值
1 === 1; // true
'a' === 'a'; // true
true === true; // true
```

### 2. 对于对象

```js
function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true; // 比较引用
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    // 只比较第一层的值，不关心值是不是对象
    if (objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

// 示例
const obj1 = { x: 1, y: 2 };
const obj2 = { x: 1, y: 2 };
shallowEqual(obj1, obj2); // true (值相等)

const obj3 = { x: 1, y: { z: 3 } };
const obj4 = { x: 1, y: { z: 3 } };
shallowEqual(obj3, obj4); // false (y 属性的值是不同的对象引用)
```

### 3. 对于数组

```js
const arr1 = [1, 2, 3];
const arr2 = [1, 2, 3];
shallowEqual(arr1, arr2); // false (两个不同的数组对象)

const arr3 = [1, [2, 3]];
const arr4 = [1, [2, 3]];
// 在浅层比较中，[2, 3] 和 [2, 3] 是两个不同的对象引用
shallowEqual(arr3, arr4); // false
```

---

## React 中的浅层比较应用

React 在多个地方使用浅层比较来优化性能，判断组件是否需要重新渲染。

### 1. PureComponent

React.PureComponent 内置了浅层比较逻辑，用于比较 this.props 和 this.state。

**陷阱：** 对于对象/数组 prop，如果父组件每次都创建新对象，PureComponent 无效。

```jsx
function Parent() {
  const data = { x: 1 }; // 每次渲染都创建新对象
  return <MyPureComponent data={data} />; // 子组件每次都重新渲染
}
```

### 2. React.memo

React.memo 是函数组件的 PureComponent 版本。

```jsx
import React, { memo } from 'react';

const MyMemoComponent = memo(({ data }) => {
  console.log('MyMemoComponent rendered');
  return <div>{data.x}</div>;
});

// 自定义比较函数
const MyCustomMemoComponent = memo(
  ({ data }) => <div>{data.x}</div>,
  (prevProps, nextProps) => {
    // 返回 true 表示相同，不需要重渲染
    // 返回 false 表示不同，需要重渲染
    return prevProps.data.x === nextProps.data.x; // 只比较 x，忽略其他深层属性
  }
);
```

### 3. useMemo 和 useCallback

这两个 Hook 使用浅层比较来判断依赖项是否发生变化。

```jsx
function MyComponent({ list, onItemClick }) {
  // 只有当 list 的引用改变时，才重新计算 expensiveValue
  const expensiveValue = useMemo(() => {
    return list.map(item => item.id * 2);
  }, [list]); // 依赖项浅层比较

  // 只有当 onItemClick 的引用改变时，才创建新的 handler
  const handler = useCallback((item) => {
    onItemClick(item);
  }, [onItemClick]); // 依赖项浅层比较
}
```

---

## 浅层比较的陷阱与最佳实践

### 最佳实践

1. **不可变性 (Immutability)**：更新对象或数组时，总是返回一个新的对象/数组，而不是修改原对象。
2. **使用工具库**：如 immer 库，让你用看似可变的方式安全地创建不可变更新。
3. **合理使用**：PureComponent 和 memo 适用于 props/state 结构简单、更新频率不高的场景。对于复杂结构，自定义比较函数可能更合适。

### 实践效果

```jsx
import React from 'react';
import { flushSync } from 'react-dom';

export default class MyComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { count: 0, data: ['a', 'b', 'c'] };
        console.log('con');

    }

    handleClick = () => {
        this.setState({ count: this.state.count + 1 });
    };


    render() {
        return <div>
            <ComponentB data={this.state.data} />
            <p>Count: {this.state.count}</p>
            <button onClick={this.handleClick}>Increment</button>
        </div>
    }
}

class ComponentB extends React.PureComponent {
    render(): React.ReactNode {
        console.log('sub render?', this.props); // 这里会打印两次，说明父组件的更新导致了子组件的更新，即使子组件是 PureComponent
        // 因为 比较的是 this.props 而不是单独比较 this.props.data 
        // 这里会 work 的场景是当父组件的 state 更新时，Component B 所有props都没有变，引用也没变，则 Component B 不会重新渲染
        // old props: { data: [1,2,3] }
        // new props: { data: 引用和old props一样 }
        return <h1>hello</h1>
    }
}
```

这里如果不用PureComponent，即使state只改了count，ComponentB 还是会render执行一次

**为什么每次都会render？**

```jsx
class MyComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { count: 0 };


    }

    handleClick = () => {
        this.setState({
    
            ...this.state 
        });
    };


    render() {
        console.log('render');
        
        return <div>

            <p>Count: {this.state.count}</p>
            <button onClick={this.handleClick}>Increment</button>
        </div>
    }
}
```

**核心原因：**
你的组件继承的是 React.Component，而非 React.PureComponent

这是 React 类组件更新机制的关键差异：

| 组件类型 | shouldComponentUpdate行为 | 你的代码中点击按钮后 |
| :--- | :--- | :--- |
| React.Component | 默认返回 true（无浅比较） | ✅ 必然触发 render |
| React.PureComponent | 自动浅比较 props 和 state | ❌ 若内容相同则跳过 render |

---

### 你的代码执行流程分析

```jsx
handleClick = () => {
  this.setState({ ...this.state }); // 创建新对象 { count: 0 }（引用不同，内容相同）
};
```

1. 调用 setState → React 将组件标记为“需要更新”
2. 触发更新流程 → 调用 shouldComponentUpdate
   - 你的组件继承 React.Component → shouldComponentUpdate 默认返回 true
   - React 不会比较新旧 state 内容
3. 强制执行 render → console.log('render') 打印

> ⚠️ 即使新 state 与旧 state 内容完全相同（count 值都是 0），只要：
> - 组件是 React.Component
> - 未自定义 shouldComponentUpdate
> - setState 被调用（无论传入什么值）
> → render 一定会执行

---

### 如何避免不必要的 render？

✅ **方案 1：改用 React.PureComponent**（推荐）

```jsx
class MyComponent extends React.PureComponent { // 仅此一行改动
  // ... 其他代码不变
}
```

→ 当 state 浅比较相等时，自动跳过 render

✅ **方案 2：自定义 shouldComponentUpdate**

```jsx
shouldComponentUpdate(nextProps, nextState) {
  return nextState.count !== this.state.count; // 仅 count 变化时更新
}
```

✅ **方案 3：调用 setState 前判断**（预防性优化）

```jsx
handleClick = () => {
  if (this.state.count !== 0) { // 实际业务中判断是否需要更新
    this.setState({ count: 0 });
  }
};
```

✅ **方案 4：函数式组件 + React.memo**（现代方案）

```jsx
const MyComponent = React.memo(({ count }) => {
  console.log('render');
  return <div>Count: {count}</div>;
});
// 仅当 count 值变化时重新渲染
```

## 函数组件

✅ 当 state 是对象且传入新引用时 → 函数组件会重新执行（同理）

✅ 当 state 是原始类型且值相同时 → 函数组件 不会 重新执行（不同理）


# SSR 科普

好的！我们**从零开始，用最生活化的比喻 + 最简代码**，彻底讲清楚 SSR（服务端渲染）。

---

## 🧒 举个生活例子：餐厅点菜

### 情景：你去一家智能餐厅
- **菜单是电子屏**（就像网页）
- **厨房就是“服务器”**
- **你的餐桌就是“浏览器”**

---

### ❌ 普通方式（CSR - 客户端渲染）：
1. 你坐下 → 餐桌只显示一个 **空白屏幕**  
2. 屏幕说：“请稍等，正在下载菜单程序…”（加载 JS）  
3. 等了 5 秒 → 菜单终于出现 → 你才能点菜  

> 💢 **问题**：用户看到白屏，体验差！

---

### ✅ SSR 方式（服务端渲染）：
1. 你一坐下 → 服务员**立刻递给你一张纸质菜单**（HTML）  
   → **你马上就能看菜、点菜！**  
2. 同时，餐桌屏幕在后台悄悄启动智能系统（下载 `main.js`）  
3. 几秒后，屏幕亮起 → 现在你可以**语音点菜、看菜品视频**（交互功能）

> ✨ **关键**：  
> - **纸质菜单 = SSR 生成的 HTML**（快速看到内容）  
> - **智能屏幕 = main.js 激活后的应用**（后续高级交互）

---

## 💻 技术层面：一行代码看懂 SSR

### 普通 React 应用（CSR）：
```html
<!-- index.html -->
<body>
  <div id="root"></div> <!-- 初始是空的！ -->
  <script src="main.js"></script> <!-- JS 加载完才渲染 -->
</body>
```
→ 用户先看到**空白页面**，等 JS 加载完才显示内容。

---

### SSR 应用：
```html
<!-- 服务器返回的 HTML -->
<body>
  <div id="root">
    <h1>欢迎来到我的网站</h1>  <!-- 内容已经在这里！ -->
    <p>这是服务端渲染的内容</p>
  </div>
  <script src="main.js"></script> <!-- 后台激活交互 -->
</body>
```
→ 用户**打开网页瞬间就看到文字**，同时 JS 在后台让按钮变得可点击。

---

## 🔑 核心三句话总结 SSR

1. **谁干活？**  
   → **服务器**提前把 React 组件变成 HTML 字符串。

2. **给谁用？**  
   → 浏览器**直接显示这个 HTML**（不用等 JS）。

3. **为什么还要 JS？**  
   → JS 负责**让静态 HTML 变成可交互的应用**（比如点击按钮有反应）。

---

## 🌐 真实请求流程（用户视角）

| 步骤 | 发生了什么 | 用户感受 |
|------|-----------|---------|
| 1 | 在浏览器输入网址 | — |
| 2 | **服务器运行 React 代码**，生成 HTML | — |
| 3 | 浏览器收到 HTML → **立即显示内容** | “哇，秒开！” |
| 4 | 浏览器**同时下载 main.js** | 页面已可看，JS 在后台加载 |
| 5 | main.js 加载完 → **绑定所有事件** | 按钮突然能点了！ |

> ✅ **SSR 不是为了取代 JS，而是让 JS 加载前就有内容可看！**

---

## ❓ 常见误区澄清

### ❌ 误区 1：“SSR 就是不用 JavaScript”
→ **错！** SSR 仍然需要 JS 来实现交互，只是**先给用户看内容**。

### ❌ 误区 2：“SSR 是后端框架（如 Java/Python）做的事”
→ **不完全是！**  
现代 SSR（如 Next.js）是 **Node.js 运行 React 代码**生成 HTML，和传统后端模板（如 JSP）不同。

### ❌ 误区 3：“用了 SSR 就不需要 CSR 了”
→ **错！** SSR 只负责**首屏**，后续页面跳转通常还是 CSR（避免每次请求服务器）。

---

## 🛠️ 最简 SSR 代码示例（概念级）

### 服务端（Node.js + React）
```js
// 服务器收到请求时
import App from './App';
import { renderToString } from 'react-dom/server';

// 1. 在服务器运行 React 组件
const html = renderToString(<App />); // 得到 "<div>欢迎</div>"

// 2. 把 HTML 嵌入页面返回
res.send(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="root">${html}</div> <!-- 内容已存在！ -->
      <script src="/main.js"></script> <!-- 激活交互 -->
    </body>
  </html>
`);
```

### 客户端（main.js）
```js
// 浏览器执行
import { hydrateRoot } from 'react-dom/client';
import App from './App';

// 3. "激活"已有 DOM
hydrateRoot(document.getElementById('root'), <App />);
```

> 🔥 `hydrateRoot` 会：  
> - **复用**服务器生成的 DOM  
> - **只添加**事件监听器（不重新创建 DOM）

---

## ✅ 什么时候用 SSR？

| 场景 | 推荐 SSR？ | 原因 |
|------|-----------|------|
| 公司官网 / 博客 / 新闻站 | ✅ 强烈推荐 | SEO + 快速展示 |
| 后台管理系统 | ❌ 不需要 | 用户已登录，SEO 无关 |
| 电商商品页 | ✅ 必须用 | 让用户秒看商品，提升转化率 |
| 游戏 / 复杂交互应用 | ⚠️ 混合使用 | 首屏 SSR + 后续 CSR |

---

## 💡 终极一句话理解 SSR

> **SSR = 服务器帮你把“React 代码”翻译成“HTML 文字”，让用户打开网页的瞬间就能看到内容，而不是盯着白屏等 JavaScript 加载。**

而 `main.js` 的作用，就是在这段文字上**贴上“魔法贴纸”**——让文字里的按钮能点、图片能滑、表单能提交。


# ImmerJS

[参考](./引用/immer.js.md)


# 公共业务抽离

[参考](./引用/公共业务抽离.md)

