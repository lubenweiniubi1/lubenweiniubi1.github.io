# React 状态管理（Redux）

> Redux 核心概念 / Redux Toolkit / 中间件 / 数据流 / 常见面试题

---

## 一、Redux 三大原则

1. **单一数据源**：整个应用状态存储在单一 Store 中
2. **状态只读**：不能直接修改，只能通过 Action 改变
3. **纯函数修改**：Reducer 必须是纯函数（相同输入→相同输出，无副作用）

---

## 二、核心组成

### Action
```js
{ type: 'ADD_TODO', payload: { id: 1, text: 'Learn Redux' } }
```

### Reducer（纯函数）
```js
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO': return [...state, action.payload];  // 不可变！返回新数组
    default: return state;
  }
}
```

### Store
```js
const store = createStore(reducer);
store.getState();     // 获取状态
store.dispatch(...);  // 派发 Action
store.subscribe(...); // 订阅变化
```

---

## 三、React 集成（react-redux）

### 函数组件（推荐）
```jsx
const count = useSelector(state => state.count);
const dispatch = useDispatch();
```

### 类组件（旧方式）
```jsx
export default connect(mapStateToProps, mapDispatchToProps)(Counter);
```

---

## 四、中间件

### 中间件本质
在 `dispatch` 和到达 Reducer 之间执行的代码：
```js
const logger = store => next => action => {
  console.log('before:', store.getState());
  const result = next(action);
  console.log('after:', store.getState());
  return result;
};
```

### Redux Thunk
处理异步操作——如果 action 是函数则调用它：
```js
function fetchUser(id) {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_REQUEST' });
    const data = await fetch(`/api/users/${id}`).then(r => r.json());
    dispatch({ type: 'FETCH_SUCCESS', payload: data });
  };
}
```

---

## 五、Redux Toolkit（现代推荐方式）

```js
import { createSlice } from '@reduxjs/toolkit';

const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: (state, action) => { state.push(action.payload); },
    // 可以直接"修改" state — RTK 内部用 Immer 实现不可变
  }
});
```

### RTK Query
用于数据获取和缓存，减少手写 thunk：
- 自动管理缓存、loading/error 状态
- 通过 tags 自动失效缓存
- 支持乐观更新

---

## 六、数据流

```
UI → Event Handler → dispatch(action)
  → Store → Reducer(state, action) → new State
  → Store 通知订阅者 → UI 重新渲染
```

---

## 七、常见面试题

### 为什么 Reducer 必须是纯函数？
- 可预测性：相同 state + action → 相同结果
- 时间旅行调试依赖此特性
- 直接修改 state 会绕过 React 渲染通知

### useSelector 的性能陷阱
每次返回新对象会导致不必要的重渲染。解决：使用 `shallowEqual` 或拆分多个 `useSelector`。

### Redux vs Context
- Context 适合低频变化的全局状态（主题、语言）
- Redux 适合高频、复杂状态逻辑、需要中间件
