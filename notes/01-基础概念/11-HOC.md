# React 高阶组件 (HOC) 完整指南

## 一、什么是高阶组件

### 1.1 核心定义

高阶组件（Higher-Order Component，简称 HOC）是 React 中用于复用组件逻辑的一种高级技巧。它不是 React API 的一部分，而是基于 React 的组合特性形成的设计模式。

高阶组件是一个函数，接收一个组件作为参数，并返回一个新的增强组件。

### 1.2 基本形式

```javascript
// 高阶组件的基本形式
function withSomething(WrappedComponent) {
  return class extends React.Component {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}

// 使用方式
const EnhancedComponent = withSomething(OriginalComponent);
```

### 1.3 与普通组件的区别

- **普通组件**：将 props 转换为 UI
- **高阶组件**：将组件转换为另一个组件

## 二、高阶组件的优势

### 2.1 代码复用

高阶组件允许在多个组件之间共享逻辑，避免重复代码。

### 2.2 保持组件的纯净性

业务组件可以专注于 UI 渲染，而通用逻辑被提取到 HOC 中。

### 2.3 增强组件功能

可以在不修改原组件代码的情况下，为其添加新功能。

### 2.4 灵活性

可以组合多个 HOC 来创建复杂的组件行为。

## 三、高阶组件的实现方式

### 3.1 基本实现

```javascript
function withLogging(WrappedComponent) {
  return class extends React.Component {
    componentDidMount() {
      console.log(`Component ${WrappedComponent.name} mounted`);
    }
    
    componentWillUnmount() {
      console.log(`Component ${WrappedComponent.name} unmounted`);
    }
    
    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
}
```

### 3.2 Props 代理模式

```javascript
function withDefaultProps(defaultProps) {
  return function(WrappedComponent) {
    return class extends React.Component {
      render() {
        return <WrappedComponent {...defaultProps} {...this.props} />;
      }
    };
  };
}

// 使用
const EnhancedComponent = withDefaultProps({ theme: 'dark' })(OriginalComponent);
```

### 3.3 继承反转模式

```javascript
function withLoading(WrappedComponent) {
  return class extends WrappedComponent {
    render() {
      if (this.props.isLoading) {
        return <div>Loading...</div>;
      }
      return super.render();
    }
  };
}
```

## 四、高阶组件的常见使用场景

### 4.1 权限控制

```javascript
function withAuth(WrappedComponent) {
  return function(props) {
    const isAuthenticated = checkAuth();
    
    if (!isAuthenticated) {
      return <div>请先登录</div>;
    }
    
    return <WrappedComponent {...props} />;
  };
}

// 使用
const ProtectedPage = withAuth(Dashboard);
```

### 4.2 数据加载

```javascript
function withData(fetchData) {
  return function(WrappedComponent) {
    return class extends React.Component {
      state = { data: null, loading: true, error: null };
      
      componentDidMount() {
        fetchData()
          .then(data => {
            this.setState({ data, loading: false });
          })
          .catch(error => {
            this.setState({ error, loading: false });
          });
      }
      
      render() {
        return <WrappedComponent {...this.props} {...this.state} />;
      }
    };
  };
}

// 使用
const UserListWithData = withData(() => fetch('/api/users'))(UserList);
```

### 4.3 表单处理

```javascript
function withFormHandling(WrappedComponent) {
  return class extends React.Component {
    state = { formData: {} };
    
    handleChange = (field, value) => {
      this.setState(prevState => ({
        formData: {
          ...prevState.formData,
          [field]: value
        }
      }));
    };
    
    handleSubmit = (e) => {
      e.preventDefault();
      // 表单提交逻辑
      console.log('Form submitted:', this.state.formData);
    };
    
    render() {
      return (
        <WrappedComponent
          {...this.props}
          formData={this.state.formData}
          onChange={this.handleChange}
          onSubmit={this.handleSubmit}
        />
      );
    }
  };
}
```

### 4.4 响应式设计

```javascript
function withResponsive(WrappedComponent) {
  return class extends React.Component {
    state = { isMobile: window.innerWidth < 768 };
    
    componentDidMount() {
      window.addEventListener('resize', this.handleResize);
    }
    
    componentWillUnmount() {
      window.removeEventListener('resize', this.handleResize);
    }
    
    handleResize = () => {
      this.setState({ isMobile: window.innerWidth < 768 });
    };
    
    render() {
      return <WrappedComponent {...this.props} isMobile={this.state.isMobile} />;
    }
  };
}
```

### 4.5 性能优化

```javascript
function withMemo(WrappedComponent, arePropsEqual) {
  return React.memo(WrappedComponent, arePropsEqual);
}

// 使用
const OptimizedComponent = withMemo(ExpensiveComponent, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});
```

## 五、高阶组件与 Hooks 的对比

### 5.1 HOC 的优点

- 适用于类组件和函数组件
- 在历史和现代 React 组件之间提供可重用抽象
- 增强组件的可组合性
- 在第三方库中广泛应用（如 Redux 的 connect）

### 5.2 HOC 的缺点

- 容易产生"包装地狱"（Wrapper Hell）
- Props 可能被覆盖
- 调试困难（组件层级嵌套深）
- 静态方法丢失问题
- Refs 传递需要特殊处理

### 5.3 Hooks 的优势

- 更简洁的代码结构
- 避免了包装地狱
- 更好的逻辑复用（自定义 Hooks）
- 更容易理解和调试
- 更好的 TypeScript 支持

### 5.4 使用建议

- 优先使用 Hooks 进行逻辑复用
- 在需要包装整个组件行为时使用 HOC
- 与类组件一起使用时考虑 HOC
- 在第三方库集成时可能需要使用 HOC

## 六、高阶组件的最佳实践

### 6.1 不要在 render 方法中使用 HOC

```javascript
// 错误示例
class MyComponent extends React.Component {
  render() {
    // 每次渲染都会创建新的组件，导致性能问题
    const EnhancedComponent = withSomething(MyComponent);
    return <EnhancedComponent />;
  }
}

// 正确示例
const EnhancedComponent = withSomething(MyComponent);

class MyComponent extends React.Component {
  render() {
    return <EnhancedComponent />;
  }
}
```

### 6.2 复制静态方法

```javascript
// 使用 hoist-non-react-statics 库
import hoistNonReactStatics from 'hoist-non-react-statics';

function withSomething(WrappedComponent) {
  class Enhancer extends React.Component {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  }
  
  hoistNonReactStatics(Enhancer, WrappedComponent);
  return Enhancer;
}
```

### 6.3 使用 Refs 转发

```javascript
function withRef(WrappedComponent) {
  class Enhancer extends React.Component {
    render() {
      const { forwardedRef, ...props } = this.props;
      return <WrappedComponent ref={forwardedRef} {...props} />;
    }
  }
  
  return React.forwardRef((props, ref) => (
    <Enhancer {...props} forwardedRef={ref} />
  ));
}
```

### 6.4 避免 Props 命名冲突

```javascript
function withSubscription(WrappedComponent, selectData) {
  return class extends React.Component {
    // 使用非 props 属性传递数据
    subscribedValue = null;
    
    componentDidMount() {
      // 订阅逻辑
      this.subscribedValue = selectData();
    }
    
    render() {
      // 使用不同的 prop 名称
      return <WrappedComponent subscribedValue={this.subscribedValue} {...this.props} />;
    }
  };
}
```

### 6.5 组合多个 HOC

```javascript
// 使用 compose 函数组合多个 HOC
function compose(...functions) {
  return function(base) {
    return functions.reduceRight((acc, fn) => fn(acc), base);
  };
}

// 使用
const enhance = compose(
  withAuth,
  withData(fetchUsers),
  withLogging
);

const EnhancedComponent = enhance(UserList);
```

## 七、高阶组件的陷阱和注意事项

### 7.1 Props 覆盖问题

```javascript
function withDefaultProps(WrappedComponent) {
  return function(props) {
    // 注意顺序：用户传入的 props 应该覆盖默认 props
    const defaultProps = { theme: 'light' };
    return <WrappedComponent {...defaultProps} {...props} />;
  };
}
```

### 7.2 Refs 传递问题

```javascript
// 错误示例
function withLogging(WrappedComponent) {
  return class extends React.Component {
    render() {
      // Ref 不会被传递到 WrappedComponent
      return <WrappedComponent {...this.props} />;
    }
  };
}

// 正确示例
function withLogging(WrappedComponent) {
  return React.forwardRef((props, ref) => {
    return <WrappedComponent ref={ref} {...props} />;
  });
}
```

### 7.3 静态方法丢失

```javascript
// 原组件有静态方法
class OriginalComponent extends React.Component {
  static customMethod() {
    return 'custom';
  }
  
  render() {
    return <div>Original</div>;
  }
}

// HOC 会丢失静态方法
const EnhancedComponent = withSomething(OriginalComponent);
// EnhancedComponent.customMethod 不存在
```

### 7.4 组件名称问题

```javascript
function withSomething(WrappedComponent) {
  class Enhancer extends React.Component {
    render() {
      return <WrappedComponent {...this.props} />;
    }
  }
  
  // 设置 displayName 便于调试
  const wrappedComponentName = WrappedComponent.displayName 
    || WrappedComponent.name 
    || 'Component';
  
  Enhancer.displayName = `WithSomething(${wrappedComponentName})`;
  
  return Enhancer;
}
```

## 八、TypeScript 支持

### 8.1 基础类型定义

```typescript
import React from 'react';

// 基础 HOC 类型
type HOC<P = {}, T = {}> = (
  WrappedComponent: React.ComponentType<P>
) => React.ComponentType<T>;

// 带 Props 的 HOC
function withLoading<P extends { isLoading: boolean }>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<Omit<P, 'isLoading'>> {
  return class extends React.Component<Omit<P, 'isLoading'>> {
    state = { isLoading: false };
    
    render() {
      return <WrappedComponent {...this.props as P} isLoading={this.state.isLoading} />;
    }
  };
}
```

### 8.2 复杂 Props 合并

```typescript
type AdditionalProps = {
  additionalData: string;
};

function withAdditionalData<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<Omit<P, keyof AdditionalProps>> {
  return (props: Omit<P, keyof AdditionalProps>) => {
    const additionalData = 'some data';
    return <WrappedComponent {...props as P} additionalData={additionalData} />;
  };
}
```

### 8.3 Ref 转发的 TypeScript 支持

```typescript
function withRefForwarding<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<unknown>> {
  return React.forwardRef<unknown, P>((props, ref) => {
    return <WrappedComponent ref={ref} {...props} />;
  });
}
```

## 九、实际项目案例

### 9.1 Redux 的 connect

```javascript
// Redux 的 connect 是一个经典的 HOC
import { connect } from 'react-redux';

const mapStateToProps = (state) => ({
  todos: state.todos
});

const mapDispatchToProps = (dispatch) => ({
  addTodo: (text) => dispatch({ type: 'ADD_TODO', text })
});

const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps)(TodoList);
```

### 9.2 React Router 的 withRouter

```javascript
// React Router 的 withRouter HOC
import { withRouter } from 'react-router-dom';

const ComponentWithRouter = withRouter(MyComponent);

// 在组件中可以访问 history, location, match 等 props
function MyComponent(props) {
  const { history, location, match } = props;
  // 使用路由相关功能
}
```

### 9.3 自定义错误边界

```javascript
function withErrorBoundary(WrappedComponent, fallbackComponent) {
  return class extends React.Component {
    state = { hasError: false, error: null };
    
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
      // 可以在这里记录错误信息
      console.error('Error caught:', error, errorInfo);
    }
    
    render() {
      if (this.state.hasError) {
        return React.createElement(fallbackComponent, { error: this.state.error });
      }
      
      return <WrappedComponent {...this.props} />;
    }
  };
}

// 使用
const SafeComponent = withErrorBoundary(UnsafeComponent, ErrorFallback);
```

## 十、HOC 与自定义 Hooks 的迁移

### 10.1 从 HOC 迁移到 Hooks

```javascript
// HOC 版本
function withData(fetchData) {
  return function(WrappedComponent) {
    return class extends React.Component {
      state = { data: null, loading: true };
      
      componentDidMount() {
        fetchData().then(data => {
          this.setState({ data, loading: false });
        });
      }
      
      render() {
        return <WrappedComponent {...this.props} data={this.state.data} loading={this.state.loading} />;
      }
    };
  };
}

// Hooks 版本
function useData(fetchData) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    fetchData().then(setData).finally(() => setLoading(false));
  }, [fetchData]);
  
  return { data, loading };
}

// 使用
function MyComponent() {
  const { data, loading } = useData(() => fetch('/api/data'));
  // 使用 data 和 loading
}
```

### 10.2 混合使用场景

```javascript
// 在某些情况下，HOC 和 Hooks 可以混合使用
function withContext(WrappedComponent) {
  return function(props) {
    const contextValue = useContext(MyContext);
    return <WrappedComponent {...props} contextValue={contextValue} />;
  };
}
```

## 十一、总结

### 11.1 HOC 的价值

尽管 Hooks 已经成为 React 中逻辑复用的首选方案，但 HOC 仍然在以下场景中有价值：

1. 需要包装整个组件的行为
2. 与类组件一起使用
3. 在第三方库中（如 Redux 的 connect）
4. 需要同时增强多个组件
5. 需要创建组件级别的抽象

### 11.2 选择建议

- **优先使用 Hooks**：对于大多数逻辑复用场景，Hooks 提供了更简洁、更灵活的解决方案
- **使用 HOC**：当需要包装整个组件、处理组件级别的抽象或与现有 HOC 库集成时
- **混合使用**：在某些复杂场景下，可以结合使用 HOC 和 Hooks

### 11.3 未来发展

随着 React 生态的不断发展，Hooks 已经成为主流的逻辑复用方式。然而，HOC 作为一种成熟的设计模式，仍然在 React 生态中占有一席之地，特别是在与现有库和框架集成时。理解 HOC 的原理和使用方法，对于深入掌握 React 开发仍然非常重要。