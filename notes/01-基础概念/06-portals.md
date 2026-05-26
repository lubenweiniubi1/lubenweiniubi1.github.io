[← 返回笔记目录](/) 

---


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
