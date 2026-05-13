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

    return <button style={{ background: theme === 'dark' ? '#333' : '#fff' }}>当前主题：{theme}</button>;
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
        {(theme) => (
          <UserContext.Consumer>
            {(user) => (
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
    this.setState((prev) => ({
      theme: prev.theme === 'light' ? 'dark' : 'light',
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
    return <button style={{ background: theme === 'dark' ? '#333' : '#fff' }}>按钮（{theme} 模式）</button>;
  }
}

export default App;
```

---

## ⚠️ 注意事项

| 问题                             | 说明                                                                      |
| -------------------------------- | ------------------------------------------------------------------------- |
| **`contextType` 必须是静态属性** | 写成 `static contextType = MyContext`，不能写在实例上                     |
| **不能在函数组件中使用**         | 类组件专属                                                                |
| **默认值只在无 Provider 时生效** | 如果有 `<MyContext.Provider>`，即使 `value={undefined}`，也不会用默认值！ |
| **TypeScript 类型支持**          | 需要正确声明 Context 类型（见下文）                                       |

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

| 方式         | 函数组件                              | 类组件                                            |
| ------------ | ------------------------------------- | ------------------------------------------------- |
| 单个 Context | `const value = useContext(MyContext)` | `static contextType = MyContext` + `this.context` |
| 多个 Context | 多次调用 `useContext`                 | 使用多个 `<MyContext.Consumer>` 嵌套              |
| 可读性       | 更简洁                                | 稍显冗长（尤其多 Context 时）                     |

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
