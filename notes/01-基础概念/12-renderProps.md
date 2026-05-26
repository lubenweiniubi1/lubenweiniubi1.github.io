[← 返回笔记目录](/) 

---

# React Render Props 完整指南

## 一、什么是 Render Props

### 1.1 核心定义

Render Props 是一种在 React 组件之间共享代码的技术，它通过使用值为函数的 prop 来告诉组件需要渲染什么内容。

核心思想：将渲染逻辑交由外部控制，实现组件之间的逻辑复用。

### 1.2 基本形式

```javascript
// 使用 render prop
<Mouse render={mouse => (
  <p>鼠标位置: {mouse.x}, {mouse.y}</p>
)}/>

// 使用 children prop（更常见）
<Mouse>
  {mouse => (
    <p>鼠标位置: {mouse.x}, {mouse.y}</p>
  )}
</Mouse>
```

## 二、Render Props 的实现方式

### 2.1 基础实现

```javascript
class Mouse extends React.Component {
  state = { x: 0, y: 0 };
  
  handleMouseMove = (event) => {
    this.setState({
      x: event.clientX,
      y: event.clientY
    });
  };
  
  render() {
    return (
      <div style={{ height: '100vh' }} onMouseMove={this.handleMouseMove}>
        {/* 调用 render prop 函数 */}
        {this.props.render(this.state)}
      </div>
    );
  }
}

// 使用
<Mouse render={mouse => (
  <h1>鼠标在 ({mouse.x}, {mouse.y})</h1>
)}/>
```

### 2.2 使用 children prop

```javascript
class Mouse extends React.Component {
  state = { x: 0, y: 0 };
  
  handleMouseMove = (event) => {
    this.setState({
      x: event.clientX,
      y: event.clientY
    });
  };
  
  render() {
    return (
      <div style={{ height: '100vh' }} onMouseMove={this.handleMouseMove}>
        {/* children 也可以是函数 */}
        {this.props.children(this.state)}
      </div>
    );
  }
}

// 使用
<Mouse>
  {mouse => (
    <h1>鼠标在 ({mouse.x}, {mouse.y})</h1>
  )}
</Mouse>
```

### 2.3 命名不固定

Render Props 的 prop 名称不一定是 "render"，可以是任何名称：

```javascript
<Mouse position={mouse => (
  <p>位置: {mouse.x}, {mouse.y}</p>
)}/>
```

## 三、Render Props 的优势

### 3.1 逻辑复用

可以在多个组件之间共享状态逻辑，而不需要重复代码。

```javascript
// Mouse 组件可以被多个不同的 UI 组件复用
<Mouse>
  {mouse => <Cat position={mouse} />}
</Mouse>

<Mouse>
  {mouse => <Dog position={mouse} />}
</Mouse>
```

### 3.2 动态渲染

父组件可以完全控制子组件渲染的内容。

```javascript
<Mouse>
  {mouse => (
    mouse.x > 500 ? <LargeCat /> : <SmallCat />
  )}
</Mouse>
```

### 3.3 解耦组件逻辑

将状态管理和渲染逻辑分离，使组件更易于测试和维护。

```javascript
// 纯逻辑组件
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };
  
  handleMouseMove = (e) => {
    this.setState({ x: e.clientX, y: e.clientY });
  };
  
  render() {
    return (
      <div onMouseMove={this.handleMouseMove}>
        {this.props.children(this.state)}
      </div>
    );
  }
}

// 纯 UI 组件
function CatDisplay({ x, y }) {
  return <img src="/cat.jpg" style={{ position: 'absolute', left: x, top: y }} />;
}

// 组合使用
<MouseTracker>
  {({ x, y }) => <CatDisplay x={x} y={y} />}
</MouseTracker>
```

### 3.4 灵活性

可以传递任意数据给渲染函数，包括状态、方法等。

```javascript
class DataFetcher extends React.Component {
  state = { data: null, loading: true, error: null };
  
  componentDidMount() {
    fetch(this.props.url)
      .then(res => res.json())
      .then(data => this.setState({ data, loading: false }))
      .catch(error => this.setState({ error, loading: false }));
  }
  
  render() {
    return this.props.children(this.state);
  }
}

// 使用
<DataFetcher url="/api/users">
  {({ data, loading, error }) => {
    if (loading) return <div>加载中...</div>;
    if (error) return <div>错误: {error.message}</div>;
    return <UserList users={data} />;
  }}
</DataFetcher>
```

## 四、Render Props 的常见应用场景

### 4.1 鼠标跟踪

```javascript
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };
  
  handleMouseMove = (e) => {
    this.setState({ x: e.clientX, y: e.clientY });
  };
  
  render() {
    return (
      <div style={{ height: '100vh' }} onMouseMove={this.handleMouseMove}>
        {this.props.children(this.state)}
      </div>
    );
  }
}

// 使用
<MouseTracker>
  {({ x, y }) => (
    <div style={{ position: 'absolute', left: x, top: y }}>
      🐱
    </div>
  )}
</MouseTracker>
```

### 4.2 数据获取

```javascript
class FetchData extends React.Component {
  state = { data: null, loading: true, error: null };
  
  componentDidMount() {
    fetch(this.props.url)
      .then(res => res.json())
      .then(data => this.setState({ data, loading: false }))
      .catch(error => this.setState({ error, loading: false }));
  }
  
  render() {
    return this.props.children(this.state);
  }
}

// 使用
<FetchData url="/api/posts">
  {({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <Error message={error.message} />;
    return <PostList posts={data} />;
  }}
</FetchData>
```

### 4.3 表单处理

```javascript
class FormHandler extends React.Component {
  state = { values: {}, errors: {} };
  
  handleChange = (name, value) => {
    this.setState(prev => ({
      values: { ...prev.values, [name]: value }
    }));
  };
  
  handleSubmit = (e) => {
    e.preventDefault();
    // 表单验证逻辑
    const errors = this.validate(this.state.values);
    if (Object.keys(errors).length === 0) {
      this.props.onSubmit(this.state.values);
    } else {
      this.setState({ errors });
    }
  };
  
  validate = (values) => {
    // 验证逻辑
    return {};
  };
  
  render() {
    return this.props.children({
      values: this.state.values,
      errors: this.state.errors,
      handleChange: this.handleChange,
      handleSubmit: this.handleSubmit
    });
  }
}

// 使用
<FormHandler onSubmit={values => console.log(values)}>
  {({ values, errors, handleChange, handleSubmit }) => (
    <form onSubmit={handleSubmit}>
      <input
        value={values.name || ''}
        onChange={e => handleChange('name', e.target.value)}
      />
      {errors.name && <span>{errors.name}</span>}
      <button type="submit">提交</button>
    </form>
  )}
</FormHandler>
```

### 4.4 权限控制

```javascript
class WithAuth extends React.Component {
  state = { isAuthenticated: false, user: null };
  
  componentDidMount() {
    // 检查认证状态
    const user = checkAuth();
    this.setState({ isAuthenticated: !!user, user });
  }
  
  render() {
    return this.props.children({
      isAuthenticated: this.state.isAuthenticated,
      user: this.state.user
    });
  }
}

// 使用
<WithAuth>
  {({ isAuthenticated, user }) => {
    if (!isAuthenticated) return <Login />;
    return <Dashboard user={user} />;
  }}
</WithAuth>
```

### 4.5 动画效果

```javascript
class Animator extends React.Component {
  state = { progress: 0 };
  
  componentDidMount() {
    this.animate();
  }
  
  animate = () => {
    const start = Date.now();
    const duration = this.props.duration || 1000;
    
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      
      this.setState({ progress });
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  };
  
  render() {
    return this.props.children(this.state.progress);
  }
}

// 使用
<Animator duration={2000}>
  {progress => (
    <div style={{ 
      opacity: progress,
      transform: `translateX(${progress * 100}px)`
    }}>
      动画元素
    </div>
  )}
</Animator>
```

## 五、Render Props vs HOC vs Hooks

### 5.1 与 HOC 的对比

**HOC 示例：**
```javascript
function withMouse(WrappedComponent) {
  return class extends React.Component {
    state = { x: 0, y: 0 };
    
    handleMouseMove = (e) => {
      this.setState({ x: e.clientX, y: e.clientY });
    };
    
    render() {
      return (
        <div onMouseMove={this.handleMouseMove}>
          <WrappedComponent {...this.props} mouse={this.state} />
        </div>
      );
    }
  };
}

const CatWithMouse = withMouse(Cat);
```

**Render Props 示例：**
```javascript
<Mouse>
  {mouse => <Cat mouse={mouse} />}
</Mouse>
```

**对比：**
- HOC：在组件外部包装，可能产生"包装地狱"
- Render Props：在组件内部控制渲染，更灵活但可能嵌套较深

### 5.2 与 Hooks 的对比

**Hooks 示例：**
```javascript
function useMouse() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return mouse;
}

// 使用
function Cat() {
  const mouse = useMouse();
  return <div style={{ left: mouse.x, top: mouse.y }}>🐱</div>;
}
```

**对比：**
- Render Props：适用于类组件和函数组件，需要嵌套
- Hooks：只适用于函数组件，代码更简洁，无嵌套问题

### 5.3 选择建议

- **优先使用 Hooks**：代码更简洁，无嵌套问题
- **使用 Render Props**：需要支持类组件，或与现有 Render Props 库集成
- **使用 HOC**：需要包装整个组件，或与现有 HOC 库集成

## 六、Render Props 的注意事项

### 6.1 避免在 Render 中创建函数

```javascript
// 不推荐：每次渲染都会创建新函数
class MouseWatcher extends React.Component {
  render() {
    return (
      <Mouse render={mouse => <Cat position={mouse} />} />
    );
  }
}

// 推荐：在组件外部定义或使用实例方法
class MouseWatcher extends React.Component {
  renderCat = (mouse) => <Cat position={mouse} />;
  
  render() {
    return <Mouse render={this.renderCat} />;
  }
}
```

### 6.2 Props 命名冲突

```javascript
// 可能的冲突
<Mouse render={...} x={100} y={200} />
// Mouse 组件内部的 x, y 状态可能与传入的 props 冲突

// 解决方案：使用不同的 prop 名称
<Mouse renderProp={...} initialX={100} initialY={200} />
```

### 6.3 性能优化

```javascript
// 使用 shouldComponentUpdate 或 React.memo 优化
class Mouse extends React.PureComponent {
  // ...
}

// 或者使用 useMemo 优化函数组件
function MouseTracker() {
  const renderCat = useCallback((mouse) => <Cat position={mouse} />, []);
  return <Mouse render={renderCat} />;
}
```

## 七、实际项目案例

### 7.1 React Router 的 Route 组件

```javascript
// React Router 使用 Render Props 模式
<Route path="/home" render={props => <Home {...props} />} />
<Route path="/about" children={({ match }) => match ? <About /> : <NotFound />} />
```

### 7.2 Downshift（自动完成组件库）

```javascript
import Downshift from 'downshift';

<Downshift
  onChange={selection => console.log(selection)}
  itemToString={item => (item ? item.name : '')}
>
  {({
    getInputProps,
    getItemProps,
    getLabelProps,
    getMenuProps,
    isOpen,
    inputValue,
    highlightedIndex,
    selectedItem
  }) => (
    <div>
      <label {...getLabelProps()}>Enter a fruit</label>
      <input {...getInputProps()} />
      <ul {...getMenuProps()}>
        {isOpen &&
          items
            .filter(item => !inputValue || item.name.includes(inputValue))
            .map((item, index) => (
              <li
                {...getItemProps({ item, index })}
                style={{
                  backgroundColor:
                    highlightedIndex === index ? 'lightgray' : 'white',
                  fontWeight: selectedItem === item ? 'bold' : 'normal'
                }}
              >
                {item.name}
              </li>
            ))}
      </ul>
    </div>
  )}
</Downshift>
```

### 7.3 自定义 Hook 替代 Render Props

```javascript
// 将 Render Props 转换为自定义 Hook
function useMouse() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return mouse;
}

// 使用
function Cat() {
  const mouse = useMouse();
  return <div style={{ position: 'absolute', left: mouse.x, top: mouse.y }}>🐱</div>;
}
```

## 八、总结

### 8.1 Render Props 的价值

尽管 Hooks 已经成为 React 中逻辑复用的首选方案，但 Render Props 仍然在以下场景中有价值：

1. 需要支持类组件
2. 与现有使用 Render Props 的库集成（如 React Router、Downshift）
3. 需要在渲染时动态决定内容
4. 需要将多个组件的渲染逻辑组合在一起

### 8.2 使用建议

- **新项目**：优先使用 Hooks
- **维护旧项目**：理解并正确使用 Render Props
- **库开发**：考虑同时支持 Render Props 和 Hooks
- **性能敏感场景**：注意避免不必要的重新渲染

### 8.3 未来发展

随着 React Hooks 的普及，Render Props 的使用频率可能会逐渐降低，但它作为一种成熟的设计模式，仍然在 React 生态中占有一席之地。理解 Render Props 的原理和使用方法，对于深入掌握 React 开发仍然非常重要。