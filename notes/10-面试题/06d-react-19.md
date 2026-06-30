# 06d — React 19：Server Components 与 Actions

> React 19 的核心变化：Server Components 正式登场，Actions 简化数据提交，前后边界越来越模糊。

---

## 一、React Server Components (RSC)

### 1.1 这是什么？

RSC 是**只在服务端渲染、永不被 hydrate 到客户端**的组件。它们可以直接访问数据库、文件系统、后端 API，不需要在客户端暴露敏感信息。

```jsx
// 服务端组件（无交互能力）
async function ProductList() {
  const products = await db.query('SELECT * FROM products');  // 直接查数据库
  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name} - ${p.price}</li>
      ))}
    </ul>
  );
}
```

### 1.2 三种组件类型

| 类型 | 文件后缀 | 在哪渲染 | 可以做什么 |
|------|---------|---------|----------|
| Server Component | `page.tsx`（默认） | 服务端 | 查数据库、读文件、调用后端 API |
| Client Component | `page.tsx` + `'use client'` | 客户端 | 事件处理、useState、useEffect、浏览器 API |
| Shared Component | 无 `'use client'` 且无 async | 取决于谁引用 | 纯渲染展示 |

### 1.3 RSC 的核心约束

- 不能使用 `useState`、`useEffect`、`onClick` 等交互 API
- 可以 `import` Client Component，但不能反过来
- 可以在服务端组件中写 `async/await` 直接获取数据

### 1.4 RSC Payload

Server Component 渲染后不是 HTML，而是一种特殊的 RSC Payload（序列化的 React Element Tree），客户端用这个 payload 重建 UI。

---

## 二、Server Actions

### 2.1 解决的问题

之前处理表单提交需要手动：

```jsx
// 旧方式
<form onSubmit={async (e) => {
  e.preventDefault();
  const res = await fetch('/api/submit', { method: 'POST', body: formData });
}}>
```

React 19 的 Server Actions：

```jsx
// 服务端 action
'use server'

async function submitForm(formData) {
  'use server';
  await db.insert(formData);  // 直接在服务端执行
  revalidatePath('/');
}

// 客户端组件只需引用
<form action={submitForm}>
  <input name="title" />
  <button type="submit">Submit</button>
</form>
```

**关键**：不需要手动 API 路由、不需要 `e.preventDefault()`、不需要 fetch。React 自己处理序列化、网络请求、错误处理。

### 2.2 两种定义方式

```jsx
// 方式一：文件级别
'use server'
// 整个文件都是 Server Actions

// 方式二：函数级别
async function myAction() {
  'use server';
  // 只有这个函数是 Server Action
}
```

---

## 三、新的 Hooks

### use() —— 革命性 API

```jsx
// 在组件中直接读取 Promise
function UserProfile({ userPromise }) {
  const user = use(userPromise);  // 不用 await！组件悬浮直到 resolve
  return <div>{user.name}</div>;
}

// 配合 Suspense 使用
<Suspense fallback={<Skeleton />}>
  <UserProfile userPromise={fetchUser()} />
</Suspense>
```

**use() 强大之处**：
- 可以在**条件和循环中**调用（打破了 Hooks 的规则！）
- 可以读取 Context
- 不限于 Promise，还可以消费 Context：`const theme = use(ThemeContext)`

**注意**：use() 不是 Hook（虽然名为 use），它是 React 的**内建函数**，不受 Hooks 规则约束。

### useOptimistic —— 乐观更新

```jsx
function MessageList({ messages }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,                                                // 原始数据
    (state, newMessage) => [...state, newMessage]            // 乐观合并函数
  );

  async function send(formData) {
    const message = formData.get('message');
    addOptimistic(message);                                  // 立即显示
    await submitMessage(message);                            // 实际发送
    // 如果失败，optimisticMessages 自动回滚到 messages
  }

  return optimisticMessages.map(m => <Message key={m.id} {...m} />);
}
```

**核心理念**：先假设操作成功，立即更新 UI，等真实结果回来再修正。

### useFormStatus —— 表单状态

```jsx
function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();
  return (
    <button disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

**注意**：`useFormStatus` 必须在 `<form>` **内部**的组件中调用。

### useActionState —— Action 状态管理

```jsx
async function formAction(prevState, formData) {
  const result = await submitForm(formData);
  if (result.error) return { error: result.error };
  return { success: true };
}

function MyForm() {
  const [state, formAction, isPending] = useActionState(formAction, { error: null });

  return (
    <form action={formAction}>
      {state.error && <p className="error">{state.error}</p>}
      <input name="name" />
      <SubmitButton />
    </form>
  );
}
```

---

## 四、ref 作为 prop（告别 forwardRef）

### React 18

```jsx
const MyInput = React.forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

### React 19

```jsx
function MyInput({ ref, ...props }) {
  // ref 就是普通 prop！
  return <input ref={ref} {...props} />;
}
```

`forwardRef` 不需要了，ref 像普通 props 一样被解构和使用。

---

## 五、Document Metadata

```jsx
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>          {/* 在组件里直接写！ */}
      <meta name="author" content={post.author} />
      <link rel="stylesheet" href="/styles/blog.css" />
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

React 会自动把这些 `<title>`、`<meta>`、`<link>` 提升到 `<head>` 中。不需要 react-helmet 等三方库了。

---

## 六、Context 简化

### React 18

```jsx
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>
```

### React 19

```jsx
<ThemeContext value={theme}>
  <App />
</ThemeContext>
```

`.Provider` 不再必须，直接写 `<Context value={...}>`。

---

## 七、其他改进

| 改进 | 说明 |
|------|------|
| **ref 回调支持清理函数** | `ref={(el) => { /* ref 挂载 */; return () => { /* ref 卸载清理 */; }}}` |
| **useDeferredValue 增加 init** | `useDeferredValue(value, initialValue)` 支持初始值 |
| **原生支持 preload/preinit** | 预加载资源 API |
| **自定义元素（Web Components）增强** | 更好的自定义元素支持 |
| **hydration 错误信息增强** | diff 可视化的错误提示 |
| **onCaughtError / onUncaughtError** | root 级别的错误处理回调 |

---

## 面试要点

| 问题 | 核心回答 |
|------|---------|
| RSC 是什么？ | 只在服务端渲染的组件，可直接访问数据库 |
| Server Actions 解决了什么？ | 不需要手动 API 路由和 fetch，组件直接调服务端函数 |
| use() 和 await 的区别？ | use() 可以在组件中条件调用，配合 Suspense 工作 |
| useOptimistic 的原理？ | 先乐观更新 UI，操作失败自动回滚 |
| forwardRef 还需要吗？ | React 19 不需要，ref 是普通 prop |
| Context 简化了什么？ | Provider 不再必需，直接 `<MyContext value={...}>` |
