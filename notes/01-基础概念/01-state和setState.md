# 类组件的 state

下面是关于 \*\*React 类组件（Class Components）中 `setState` 的笔记

---

## 第一部分：核心机制 —— `setState` 到底做了什么？

### 1.1 `setState` 不是同步赋值，而是一个“调度请求”

当你在类组件中调用 `this.setState(updater)` 时，你并不是在直接修改 `this.state`。相反，你是在向 React 的 **协调器（Reconciler）** 提交一个 **状态更新请求**。

```javascript
// 伪代码示意 React 内部流程
class Component {
  setState(partialState) {
    // 1. 将 partialState 和当前 Fiber 节点关联起来
    enqueueUpdate(this._reactInternalFiber, partialState);

    // 2. 触发调度（Scheduler），安排一次 Reconciliation（协调）
    scheduleWork();
  }
}
```

这个过程是**异步批处理**的（在大多数情况下），意味着多次 `setState` 调用可能会被合并成一次状态计算和一次渲染。

### 1.2 状态合并（State Merging）—— 浏览器原生 `Object.assign` 的浅拷贝

React 在处理你的 `partialState`（部分状态）时，会将其与组件当前的完整状态进行 **浅合并（Shallow Merge）**。

**内部实现逻辑大致如下**：

```javascript
// 假设当前 state 为 currentState
// 你调用了 this.setState(partialState)

const nextState = Object.assign({}, currentState, partialState);
```

**关键特性**：

- **顶层属性覆盖**：`partialState` 中的任何顶层键都会完全替换 `currentState` 中对应的值。
- **嵌套对象不复制**：对于未在 `partialState` 中提及的嵌套对象或数组，它们的**引用会被直接保留**。

#### 示例演示

```jsx
class App extends React.Component {
  state = {
    count: 0,
    user: { name: 'Alice', settings: { theme: 'light' } },
    items: ['a', 'b'],
  };

  updateState = () => {
    this.setState({
      count: 1,
      user: { name: 'Bob' }, // 注意：这里只提供了 user.name
    });
  };
}
```

**合并后的 `nextState` 结果**：

```javascript
{
  count: 1, // 被新值覆盖
  user: { name: 'Bob' }, // 整个 user 对象被新对象替换！旧的 settings 丢失了！
  items: ['a', 'b'] // 引用不变，与之前是同一个数组
}
```

> ⚠️ 这里有一个非常重要的陷阱：**`user` 对象被完全替换了**，而不是合并。React 的合并只发生在 `state` 的顶层，不会递归到嵌套对象内部。

要正确更新嵌套对象，你必须手动进行不可变更新：

```javascript
this.setState({
  user: {
    ...this.state.user, // 先展开旧的 user
    name: 'Bob', // 再覆盖需要修改的字段
  },
});
```

这样，`settings` 才能被保留下来。

---

## 第二部分：对象引用与“新对象”的创建

### 2.1 `setState` 是否创建新对象？—— 分层次回答

这个问题的答案需要分两个层面来看：

#### 层面一：`this.state` 根对象本身

**是的，每次有效的 `setState` 都会创建一个新的根 state 对象**。

如前所述，React 内部使用 `Object.assign({}, prevState, partialState)` 来生成 `nextState`。这行代码本身就创建了一个**全新的 JavaScript 对象**。因此，`this.state` 的引用地址在每次状态更新后都会改变。

你可以通过以下代码验证：

```jsx
class ReferenceChecker extends React.Component {
  state = { value: 0 };

  componentDidUpdate() {
    console.log('State reference changed:', this._lastState !== this.state);
    this._lastState = this.state;
  }

  componentDidMount() {
    this._lastState = this.state;
  }

  handleClick = () => {
    this.setState({ value: this.state.value + 1 });
  };

  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

每次点击，控制台都会打印 `true`，证明 `this.state` 是一个新对象。

#### 层面二：嵌套的对象/数组

**不一定**。这完全取决于你在 `setState` 中如何提供它们。

- **情况A：你传入了一个新引用**

  ```javascript
  this.setState({ items: [...this.state.items, 'new'] });
  ```

  → `items` 数组是一个新对象，引用已变。

- **情况B：你传入了旧引用（或未提及）**

  ```javascript
  // 未提及 items
  this.setState({ value: 1 });

  // 或者错误地传入旧引用
  const { user } = this.state;
  user.name = 'Hacked';
  this.setState({ user }); // user 引用没变！
  ```

  → `items` 或 `user` 的引用保持不变。

**结论**：`setState` 只保证根 state 对象是新的，对于其内部的任何嵌套结构，是否“新”完全由开发者控制。

---

## 第三部分：React 如何决定是否重新渲染？

这是理解整个机制的关键。React 的决策过程分为两步。

### 3.1 步骤一：默认行为（继承自 `React.Component`）

如果你的类组件直接 `extends React.Component`，那么它的默认行为是：

> **只要调用了 `this.setState()`，无论传入的值是否真的改变了状态，都会触发一次 `render()` 方法。**

这是一个非常重要的点。React **不会**去智能地比较你传入的 `partialState` 和当前 `state` 的内容差异。它信任你，并假定既然你调用了 `setState`，就意味着 UI 需要更新。

**示例**：

```jsx
class NaiveComponent extends React.Component {
  state = { count: 0 };

  render() {
    console.log('NaiveComponent rendered!');
    return <button onClick={() => this.setState({ count: 0 })}>Set to 0 (current is already 0)</button>;
  }
}
```

每次点击按钮，`render()` 都会被调用，即使 `count` 的值没有发生任何变化。

### 3.2 步骤二：优化行为（`React.PureComponent` 或 `shouldComponentUpdate`）

为了防止不必要的渲染，React 提供了两种优化手段。

#### A. `React.PureComponent`

`PureComponent` 是 `Component` 的一个子类，它自动为你实现了 `shouldComponentUpdate` 方法。

```javascript
// PureComponent 内部大致实现
class PureComponent extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return !shallowEqual(this.props, nextProps) || !shallowEqual(this.state, nextState);
  }
}
```

这里的 `shallowEqual` 就是我们熟知的**浅比较**函数（在本文开头已详细解释）。它的工作方式是：

1. 比较 `props` 和 `state` 对象的**所有顶层键**。
2. 对每个键的值，使用 `Object.is` 进行比较。
3. 如果所有键的值都相等，则返回 `true`（表示“相等”），从而 `shouldComponentUpdate` 返回 `false`，跳过 `render`。

**这对性能至关重要，但也带来了约束**：你必须保证传递给 `PureComponent` 的 `props` 和 `state` 中的任何对象/数组，在内容变化时，其**引用也必须变化**。否则，浅比较会误判为“没有变化”。

#### B. 手动实现 `shouldComponentUpdate`

你可以获得比 `PureComponent` 更精细的控制。

```jsx
class OptimizedList extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // 只有当 items 数组的长度或第一个元素变化时才更新
    return this.props.items.length !== nextProps.items.length || this.props.items[0]?.id !== nextProps.items[0]?.id;
  }

  render() {
    /* ... */
  }
}
```

这种方式可以实现深度定制的性能优化，但代码更复杂，也更容易出错。

---

## 第四部分：最佳实践与常见陷阱

### 最佳实践

1. **永远不要直接修改 `this.state`**。

   ```javascript
   // ❌ 绝对禁止
   this.state.items.push('new');
   this.setState({ items: this.state.items });
   ```

2. **更新嵌套对象时，使用展开运算符进行不可变更新**。

   ```javascript
   // ✅ 正确
   this.setState({
     user: {
       ...this.state.user,
       profile: {
         ...this.state.user.profile,
         avatar: 'new-url',
       },
     },
   });
   ```

3. **优先考虑使用 `PureComponent`**，除非你有明确的理由不使用它。它可以自动为你节省大量不必要的渲染开销。

4. **将复杂的派生状态计算移到 `render` 之外**，或者使用 `useMemo` 的思想（在类组件中可以用成员变量缓存，但需谨慎）。

### 常见陷阱

- **陷阱1：在 `setState` 回调中依赖过期的闭包**。

  ```javascript
  // ❌ 错误：如果多次快速点击，count 可能不是最新的
  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };

  // ✅ 正确：使用函数式更新
  handleClick = () => {
    this.setState((prevState) => ({ count: prevState.count + 1 }));
  };
  ```

- **陷阱2：向 `PureComponent` 传递内联对象/函数**。

  ```jsx
  // ❌ 每次父组件渲染，style 都是一个新对象，导致 Child 不必要地更新
  <PureChild style={{ color: 'red' }} />;

  // ✅ 将其提升到组件外部或用 useMemo（在函数组件中）
  const childStyle = { color: 'red' };
  <PureChild style={childStyle} />;
  ```

- **陷阱3：误以为 `setState` 是同步的**。
  在事件处理器中，`setState` 是批处理的，`this.state` 不会立即更新。务必使用回调函数或 `componentDidUpdate` 来访问更新后的状态。

---

## 总结

在 React 类组件中：

1. **`setState` 会创建一个新的根 `this.state` 对象**，但其内部的嵌套对象/数组是否新，取决于开发者。
2. **状态更新是浅合并**，仅作用于 `state` 对象的顶层，不会递归合并嵌套结构。
3. **普通 `Component` 在 `setState` 后总会重新渲染**，无论状态值是否变化。
4. **`PureComponent` 通过浅比较 `props` 和 `state` 来避免不必要的渲染**，但这要求开发者遵循不可变数据的原则。

<br>
<br>
<br>

# 函数式组件的 state

### 基本概念

useState 是 React Hooks 中最基础的一个 Hook，用于在函数组件中添加状态。

### 基本用法

```javascript
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>当前计数: {count}</p>
      <button onClick={() => setCount(count + 1)}>增加</button>
    </div>
  );
}
```

### useState 的工作机制

#### 1. 初始化阶段

当组件首次渲染时，useState 会：

- 接收初始值参数（例如 0）
- 创建一个状态变量，并将其初始化为该值
- 返回一个包含两个元素的数组：
  - 当前状态值（count）
  - 更新状态的函数（setCount）

#### 2. 状态存储

React 在内部维护一个"记忆单元"（Fiber 节点）来存储组件的状态。每次调用 useState 时，React 都会从这个记忆单元中读取对应的状态值。

关键点：React 通过调用顺序来识别不同的 useState。这就是为什么 Hooks 必须在组件的顶层调用，不能在条件语句或循环中调用。

#### 3. 状态更新

当调用 setCount 时：

- React 会将新的状态值放入队列
- 触发组件重新渲染
- 在下一次渲染时，useState 返回新的状态值

```javascript
// 点击按钮时
setCount(count + 1);
// 1. 将 count + 1 加入更新队列
// 2. 标记组件需要重新渲染
// 3. React 调度渲染（异步批处理）
// 4. 组件重新执行，useState 返回新的值
```

### 重要特性

#### 1. 状态更新是异步的

```javascript
function Example() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    console.log(count); // 仍然输出旧值
  };

  // 如果需要在状态更新后执行操作，使用 useEffect
  useEffect(() => {
    console.log('count 已更新:', count);
  }, [count]);
}
```

#### 2. 函数式更新

当新状态依赖于旧状态时，推荐使用函数式更新：

```javascript
// 不推荐：可能获取到过时的 count 值
setCount(count + 1);

// 推荐：接收前一个状态作为参数
setCount((prevCount) => prevCount + 1);
```

函数式更新确保你总是基于最新的状态值进行计算。

#### 3. 批量更新

React 会批量处理多个状态更新，以提高性能：

```javascript
const [count, setCount] = useState(0);
const [name, setName] = useState('');

const handleClick = () => {
  setCount(count + 1);
  setName('John');
  setCount(count + 2);
  // 这三个更新会被合并，只触发一次重新渲染
};
```

#### 4. 状态比较

React 使用 Object.is() 来比较新旧状态值：

```javascript
const [obj, setObj] = useState({ count: 0 });

// 这不会触发重新渲染，因为是同一个对象引用
setObj(obj);

// 这会触发重新渲染，因为创建了新对象
setObj({ ...obj, count: obj.count + 1 });
```

### 多个 useState 的管理

React 通过调用顺序来管理多个 useState：

```javascript
function Component() {
  const [count, setCount] = useState(0); // 第一个 Hook
  const [name, setName] = useState(''); // 第二个 Hook
  const [items, setItems] = useState([]); // 第三个 Hook

  // React 内部维护一个数组: [0, '', []]
  // 每次渲染时按顺序读取
}
```

这就是为什么 Hooks 规则要求：

1. 只在顶层调用 Hooks
2. 不要在循环、条件或嵌套函数中调用 Hooks

### 自定义 Hook 中的 useState

```javascript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => c - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}

// 使用
function App() {
  const { count, increment, decrement } = useCounter(10);

  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

### 性能优化

#### 1. 避免不必要的重新渲染

```javascript
// 不好的做法：每次渲染都创建新对象
function Component() {
  const [config, setConfig] = useState({ theme: 'dark' });
  // config 每次都是新对象，可能导致子组件不必要的重新渲染
}

// 好的做法：使用函数式初始化
function Component() {
  const [config] = useState(() => ({ theme: 'dark' }));
  // 只在首次渲染时创建对象
}
```

#### 2. 使用 useMemo 缓存派生状态

```javascript
function Component({ items }) {
  const [filter, setFilter] = useState('');

  // 使用 useMemo 避免每次渲染都重新计算
  const filteredItems = useMemo(() => {
    return items.filter((item) => item.name.includes(filter));
  }, [items, filter]);
}
```

### 常见陷阱

#### 1. 闭包陷阱

```javascript
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // 这里捕获的是初始的 count 值（0）
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(id);
  }, []); // 依赖项为空数组

  // 问题：count 永远是 1，因为闭包捕获了初始值

  // 解决方案：使用函数式更新
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + 1); // 使用前一个状态
    }, 1000);

    return () => clearInterval(id);
  }, []);
}
```

#### 2. 状态更新丢失

```javascript
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // 如果快速点击多次，可能丢失更新
    setCount(count + 1);
    setCount(count + 1);
    // 两次都基于同一个旧值，最终只增加 1

    // 正确做法：使用函数式更新
    setCount((c) => c + 1);
    setCount((c) => c + 1);
    // 这样会正确增加 2
  };
}
```

### 总结

useState 的核心机制：

1. 通过调用顺序维护状态
2. 状态存储在 React 内部的 Fiber 节点中
3. 更新是异步的，支持批量处理
4. 使用 Object.is() 进行状态比较
5. 函数式更新确保获取最新状态
<br>
<br>

# 函数组件和类组件 setState 的区别

## 核心差异

### 类组件的 setState

在类组件中，即使传入相同的值，React 也会触发重新渲染：

```javascript
class Counter extends React.Component {
  state = { count: 0 };
  
  handleClick = () => {
    // 即使值相同，也会触发重新渲染
    this.setState({ count: 0 });
    // 组件会重新执行 render()
  };
  
  render() {
    console.log('render 被调用');
    return <div>{this.state.count}</div>;
  }
}
```

### 函数组件的 useState

在函数组件中，React 会进行优化：

```javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    // 如果值相同，不会触发重新渲染
    setCount(0);
    // 组件不会重新执行
  };
  
  console.log('组件重新渲染');
  return <div>{count}</div>;
}
```

## 为什么会这样？

### 1. **比较机制不同**

**类组件**：
- React 不会对 setState 的参数进行深度比较
- 直接标记组件为"需要更新"
- 触发重新渲染流程

**函数组件**：
- React 使用 `Object.is()` 进行比较
- 如果新旧值相同，跳过更新

```javascript
// React 内部的比较逻辑
if (Object.is(newState, oldState)) {
  // 跳过重新渲染
  return;
}
```

### 2. **Object.is() 的行为**
详细看《js中的比较》，目前我还没总结

## 实际例子对比

### 类组件示例

```javascript
class Example extends React.Component {
  state = { count: 0 };
  
  handleClick = () => {
    console.log('点击前:', this.state.count);
    this.setState({ count: 0 });  // 即使值相同
    console.log('点击后:', this.state.count);
  };
  
  render() {
    console.log('render 被调用');  // 每次点击都会执行
    return (
      <button onClick={this.handleClick}>
        Count: {this.state.count}
      </button>
    );
  }
}
```

**输出**：
```
点击前: 0
render 被调用  // 重新渲染了
点击后: 0
```

### 函数组件示例

```javascript
function Example() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    console.log('点击前:', count);
    setCount(0);  // 值相同
    console.log('点击后:', count);
  };
  
  console.log('组件重新渲染');  // 只在首次渲染时执行
  return (
    <button onClick={handleClick}>
      Count: {count}
    </button>
  );
}
```

**输出**：
```
点击前: 0
点击后: 0
// 没有"组件重新渲染"的输出，说明没有重新渲染
```

## 对象引用的特殊情况

```javascript
function ObjectExample() {
  const [obj, setObj] = useState({ count: 0 });
  
  const handleClick1 = () => {
    // 相同引用，不会重新渲染
    setObj(obj);
    console.log('不会重新渲染');
  };
  
  const handleClick2 = () => {
    // 新对象，会重新渲染
    setObj({ count: 0 });
    console.log('会重新渲染');
  };
  
  console.log('组件渲染');
  return (
    <div>
      <button onClick={handleClick1}>相同引用</button>
      <button onClick={handleClick2}>新对象</button>
    </div>
  );
}
```

## 为什么函数组件要这样设计？

### 1. **性能优化**

函数组件每次渲染都会重新执行整个函数，如果每次都重新渲染，性能开销会很大。

```javascript
function HeavyComponent() {
  const [state, setState] = useState(0);
  
  // 每次渲染都会重新创建这些变量和函数
  const data = computeExpensiveData();
  const handleClick = () => { /* ... */ };
  
  return <div>{data}</div>;
}
```

### 2. **避免无限循环**

```javascript
function Example() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(0);  // 如果每次都重新渲染，会无限循环
  }, []);
  
  // 因为 Object.is(0, 0) 为 true，所以不会重新渲染
  // 避免了无限循环
}
```

## 如何强制重新渲染？

如果确实需要强制重新渲染（虽然很少需要），可以：

```javascript
function ForceRerender() {
  const [, forceUpdate] = useState(0);
  
  const handleClick = () => {
    // 传入不同的值
    forceUpdate(prev => prev + 1);
  };
  
  return <button onClick={handleClick}>强制更新</button>;
}
```

## 总结

| 特性 | 类组件 setState | 函数组件 useState |
|------|----------------|-------------------|
| 相同值更新 | 会重新渲染 | 不会重新渲染 |
| 比较机制 | 无深度比较 | Object.is() 比较 |
| 性能 | 较低 | 较高 |
| 设计理念 | 命令式 | 声明式 |

**关键点**：函数组件的 useState 通过 Object.is() 比较来优化性能，避免不必要的重新渲染，这是 React Hooks 的一个重要优化。
<br>

# 批处理

## React <= 17 以前

- **不可变值**
- **可能是异步更新**
- **可能会被合并**

## React <= 17 中 setState 的同步/异步场景详析

在 React 17 及更早版本中，`setState` 的行为是同步还是异步，并不取决于 `setState` 本身的实现，而是取决于它所处的执行上下文（Execution Context）。这个上下文决定了 React 是否开启了其内部的 "批处理模式"（batching mode），而这个模式的存在与否，直接关联到 `setState` 的同步或异步表现。

以下是 `setState` 表现为同步或异步的所有主要场景，以及背后的机制。

---

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
    console.log('After setState:', this.state.count); // 输出: 0 (异步，state 尚未更新!)

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

- `componentDidMount`
- `componentDidUpdate`
- `componentWillReceiveProps` (已废弃)
- `getSnapshotBeforeUpdate`
- `render` 方法内部不能调用 `setState`，会导致无限循环。

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
    console.log('After setState:', this.state.count); // 输出: 1 (同步更新!)
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
      console.log('After setState:', this.state.count); // 输出: 1 (同步更新!)

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
      .then((response) => response.json())
      .then((data) => {
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
      },
    );
  }
}
```

---

## 合并场景

### React <= 17 中 setState 的合并机制

在 React 17 及更早版本中，`setState` 的合并行为与它的同步/异步行为密切相关。合并只发生在异步（批量更新）的场景中，而在同步场景中，每一次 `setState` 都会被独立执行，不会合并。

---

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
    return (
      <button onClick={this.handleClick}>
        {this.state.name}: {this.state.count}
      </button>
    );
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

- **对象形式 (`{...}`)**：会被合并。相同的 `key` 会被后面的覆盖。
- **函数形式 (`(prevState, props) => {...}`)**：不会被合并，而是按顺序执行。每个函数都会接收上一个函数执行后的结果。

```javascript
class MyComponent extends React.Component {
  state = { count: 0 };

  handleClick = () => {
    // 对象形式合并
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 10 }); // this.state.count 仍是 0
    // 结果: count = 1 (第一个覆盖了第二个)

    // 函数形式不合并，顺序执行
    this.setState((prevState) => ({ count: prevState.count + 1 }));
    this.setState((prevState) => ({ count: prevState.count + 10 })); // prevState.count 是 1
    // 结果: count = 11 (1 + 10)
  };
}
```

## React 18 以后的变化

React 18 引入了 Automatic Batching。无论 setState 或 useState 的 setter 在何处被调用，它们都会被自动批量处理。
