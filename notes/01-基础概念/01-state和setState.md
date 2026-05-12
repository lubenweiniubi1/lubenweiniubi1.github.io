

# 批处理
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


