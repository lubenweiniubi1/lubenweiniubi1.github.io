https://redux.js.org/introduction/getting-started

- 先听课
- 再看文档


# Redux 深入教学

## 📚 目录

1. [Redux 核心概念与原理](#核心概念)
2. [三大核心原则](#三大原则)
3. [核心组成部分详解](#核心组件)
4. [数据流与工作原理](#数据流)
5. [React 与 Redux 集成](#react集成)
6. [中间件与异步处理](#中间件)
7. [实战案例](#实战案例)
8. [最佳实践与性能优化](#最佳实践)
9. [常见问题与解决方案](#常见问题)

---

## 1. Redux 核心概念与原理

### 1.1 什么是 Redux？

Redux 是一个用于 JavaScript 应用的**可预测状态容器**。它帮助你管理应用中的全局状态，使状态变化变得可预测和易于调试。

**核心思想：**
- **单一数据源**：整个应用的状态存储在一个单一的 Store 中
- **状态只读**：不能直接修改状态，只能通过触发 Action 来改变
- **纯函数修改**：使用纯函数（Reducer）来描述状态如何变化

### 1.2 为什么需要 Redux？

**问题场景：**
```javascript
// 没有 Redux 时的痛点
// 父子组件通信：props drilling
// 兄弟组件通信：需要提升状态到共同父组件
// 跨层级组件通信：需要层层传递 props
// 多个组件共享状态：状态分散，难以维护
```

**Redux 的解决方案：**
- 集中管理状态，避免 props drilling
- 统一的状态更新机制
- 可预测的状态变化
- 强大的开发者工具支持

---

## 2. Redux 三大核心原则

### 2.1 单一数据源（Single Source of Truth）

**整个应用的状态存储在一个单一的 Store 中**

```javascript
// ❌ 不推荐：状态分散在多个地方
const userState = { name: 'John' };
const cartState = { items: [] };
const settingsState = { theme: 'light' };

// ✅ 推荐：单一 Store
const store = {
  user: { name: 'John' },
  cart: { items: [] },
  settings: { theme: 'light' }
};
```

**优势：**
- 容易调试和追踪状态变化
- 服务端渲染时数据同步简单
- 序列化和反序列化方便

### 2.2 状态是只读的（State is Read-Only）

**唯一改变状态的方式是触发 Action**

```javascript
// ❌ 错误：直接修改状态
state.count = state.count + 1;

// ✅ 正确：通过 Action 触发状态变化
dispatch({ type: 'INCREMENT' });
```

**为什么？**
- 防止意外的状态修改
- 便于追踪状态变化的来源
- 支持时间旅行调试

### 2.3 使用纯函数来执行修改（Changes are Made with Pure Functions）

**Reducer 必须是纯函数**

```javascript
// ✅ 纯函数示例
function counterReducer(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1; // 返回新状态
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
}

// ❌ 非纯函数示例
function badReducer(state = 0, action) {
  if (action.type === 'INCREMENT') {
    state++; // 直接修改原状态
    return state;
  }
}
```

**纯函数的特性：**
- 相同的输入总是返回相同的输出
- 不修改函数外部的变量
- 不产生副作用（如 API 调用、路由跳转等）

---

## 3. 核心组成部分详解

### 3.1 Action（动作）

**Action 是描述发生了什么的普通对象**

```javascript
// 基本 Action
const incrementAction = {
  type: 'INCREMENT'
};

// 带 payload 的 Action
const addItemAction = {
  type: 'ADD_ITEM',
  payload: {
    id: 1,
    name: 'Product 1',
    price: 100
  }
};

// Action Creator（推荐）
function increment() {
  return { type: 'INCREMENT' };
}

function addItem(item) {
  return {
    type: 'ADD_ITEM',
    payload: item
  };
}

// 使用
dispatch(increment());
dispatch(addItem({ id: 1, name: 'Product 1' }));
```

**Action 的最佳实践：**
```javascript
// 使用常量定义 Action 类型
export const INCREMENT = 'INCREMENT';
export const DECREMENT = 'DECREMENT';
export const ADD_ITEM = 'ADD_ITEM';

// 使用 Action Creator
export const increment = () => ({ type: INCREMENT });
export const decrement = () => ({ type: DECREMENT });
export const addItem = (item) => ({
  type: ADD_ITEM,
  payload: item
});
```

### 3.2 Reducer（归约器）

**Reducer 是纯函数，接收旧状态和 Action，返回新状态**

```javascript
// 基本 Reducer
function counterReducer(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
}

// 处理对象状态
function userReducer(state = { name: '', age: 0 }, action) {
  switch (action.type) {
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_AGE':
      return { ...state, age: action.payload };
    default:
      return state;
  }
}

// 处理数组状态
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO':
      return [...state, action.payload];
    case 'REMOVE_TODO':
      return state.filter(todo => todo.id !== action.payload);
    case 'TOGGLE_TODO':
      return state.map(todo =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    default:
      return state;
  }
}
```

**Reducer 的不可变性原则：**
```javascript
// ❌ 错误：直接修改原数组
state.push(newItem);

// ✅ 正确：返回新数组
return [...state, newItem];

// ❌ 错误：直接修改原对象
state.name = newName;

// ✅ 正确：返回新对象
return { ...state, name: newName };
```

### 3.3 Store（存储）

**Store 是 Redux 应用的单一数据源**

```javascript
import { createStore } from 'redux';

// 创建 Store
const store = createStore(reducer);

// 获取当前状态
const currentState = store.getState();

// 订阅状态变化
const unsubscribe = store.subscribe(() => {
  console.log('State changed:', store.getState());
});

// 派发 Action
store.dispatch({ type: 'INCREMENT' });

// 取消订阅
unsubscribe();
```

**Store 的方法：**
- `getState()`: 获取当前状态
- `dispatch(action)`: 派发 Action
- `subscribe(listener)`: 订阅状态变化
- `replaceReducer(nextReducer)`: 替换 Reducer（用于代码分割）

---

## 4. 数据流与工作原理

### 4.1 Redux 数据流图解

```
┌─────────────┐
│   Action    │
│   (对象)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Store     │
│ dispatch()  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Reducer   │
│  (纯函数)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    State    │
│   (新状态)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Views     │
│  (UI 更新)   │
└─────────────┘
```

### 4.2 完整数据流示例

```javascript
// 1. 定义 Action 类型
const ADD_TODO = 'ADD_TODO';
const TOGGLE_TODO = 'TOGGLE_TODO';

// 2. 创建 Action Creators
const addTodo = (text) => ({
  type: ADD_TODO,
  payload: { id: Date.now(), text, completed: false }
});

const toggleTodo = (id) => ({
  type: TOGGLE_TODO,
  payload: id
});

// 3. 创建 Reducer
function todosReducer(state = [], action) {
  switch (action.type) {
    case ADD_TODO:
      return [...state, action.payload];
    case TOGGLE_TODO:
      return state.map(todo =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    default:
      return state;
  }
}

// 4. 创建 Store
const store = createStore(todosReducer);

// 5. 订阅状态变化
store.subscribe(() => {
  console.log('Current state:', store.getState());
});

// 6. 派发 Action
store.dispatch(addTodo('Learn Redux'));
store.dispatch(addTodo('Build an app'));
store.dispatch(toggleTodo(1));

// 输出：
// Current state: [{ id: 1, text: 'Learn Redux', completed: false }]
// Current state: [
//   { id: 1, text: 'Learn Redux', completed: false },
//   { id: 2, text: 'Build an app', completed: false }
// ]
// Current state: [
//   { id: 1, text: 'Learn Redux', completed: true },
//   { id: 2, text: 'Build an app', completed: false }
// ]
```

### 4.3 combineReducers（组合 Reducer）

**当应用变大时，需要拆分 Reducer**

```javascript
import { combineReducers } from 'redux';

// 拆分的 Reducers
function todosReducer(state = [], action) {
  // ... todos 相关逻辑
}

function visibilityFilterReducer(state = 'SHOW_ALL', action) {
  // ... filter 相关逻辑
}

function userReducer(state = null, action) {
  // ... user 相关逻辑
}

// 组合 Reducers
const rootReducer = combineReducers({
  todos: todosReducer,
  visibilityFilter: visibilityFilterReducer,
  user: userReducer
});

// 等价于
function rootReducer(state = {}, action) {
  return {
    todos: todosReducer(state.todos, action),
    visibilityFilter: visibilityFilterReducer(state.visibilityFilter, action),
    user: userReducer(state.user, action)
  };
}
```

**使用 combineReducers 的优势：**
- 每个 Reducer 只负责管理自己那部分状态
- 便于维护和测试
- 支持代码分割

---

## 5. React 与 Redux 集成

### 5.1 react-redux 库

**react-redux 提供了 React 绑定**

```bash
npm install react-redux
```

### 5.2 Provider 组件

**将 Store 注入到 React 组件树中**

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from './reducers';
import App from './App';

// 创建 Store
const store = createStore(rootReducer);

// 使用 Provider 包裹根组件
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
```

### 5.3 useSelector 钩子（函数组件）

**从 Store 中选择状态**

```javascript
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement } from './actions';

function Counter() {
  // 选择状态
  const count = useSelector(state => state.count);
  
  // 获取 dispatch 函数
  const dispatch = useDispatch();

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => dispatch(increment())}>
        Increment
      </button>
      <button onClick={() => dispatch(decrement())}>
        Decrement
      </button>
    </div>
  );
}
```

**useSelector 的高级用法：**

```javascript
// 选择多个状态
const { count, user } = useSelector(state => ({
  count: state.count,
  user: state.user
}));

// 使用浅比较避免不必要的重渲染
import { shallowEqual } from 'react-redux';

const { todos, filter } = useSelector(
  state => ({
    todos: state.todos,
    filter: state.filter
  }),
  shallowEqual
);

// 计算派生数据
const completedTodos = useSelector(state =>
  state.todos.filter(todo => todo.completed)
);
```

### 5.4 useDispatch 钩子

**获取 dispatch 函数**

```javascript
import { useDispatch } from 'react-redux';
import { addTodo, toggleTodo } from './actions';

function TodoList() {
  const dispatch = useDispatch();

  const handleAdd = () => {
    dispatch(addTodo('New Todo'));
  };

  const handleToggle = (id) => {
    dispatch(toggleTodo(id));
  };

  // ...
}
```

**优化 dispatch 性能：**

```javascript
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { increment } from './actions';

function Counter() {
  const dispatch = useDispatch();

  // 使用 useCallback 缓存函数
  const handleIncrement = useCallback(() => {
    dispatch(increment());
  }, [dispatch]);

  // ...
}
```

### 5.5 connect 高阶组件（类组件）

**传统的连接方式**

```javascript
import React from 'react';
import { connect } from 'react-redux';
import { increment, decrement } from './actions';

class Counter extends React.Component {
  render() {
    const { count, increment, decrement } = this.props;
    
    return (
      <div>
        <h1>Count: {count}</h1>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
      </div>
    );
  }
}

// mapStateToProps: 将 state 映射到 props
const mapStateToProps = (state) => ({
  count: state.count
});

// mapDispatchToProps: 将 dispatch 映射到 props
const mapDispatchToProps = {
  increment,
  decrement
};

// 连接组件
export default connect(mapStateToProps, mapDispatchToProps)(Counter);
```

**connect 的完整签名：**

```javascript
connect(
  mapStateToProps?: Function,
  mapDispatchToProps?: Function | Object,
  mergeProps?: Function,
  options?: Object
)
```

---

## 6. 中间件与异步处理

### 6.1 什么是中间件？

**中间件是在 dispatch 和到达 Reducer 之间执行的代码**

```javascript
// 中间件的基本结构
const loggerMiddleware = store => next => action => {
  console.log('Dispatching:', action);
  console.log('Previous state:', store.getState());
  
  const result = next(action); // 调用下一个中间件或 Reducer
  
  console.log('Next state:', store.getState());
  
  return result;
};
```

### 6.2 applyMiddleware

**应用中间件**

```javascript
import { createStore, applyMiddleware } from 'redux';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import rootReducer from './reducers';

// 应用单个中间件
const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
);

// 应用多个中间件
const store = createStore(
  rootReducer,
  applyMiddleware(logger, thunk)
);
```

### 6.3 Redux Thunk（异步 Action）

**处理异步操作**

```javascript
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

// 异步 Action Creator
function fetchUser(id) {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_USER_REQUEST' });
    
    try {
      const response = await fetch(`/api/users/${id}`);
      const data = await response.json();
      
      dispatch({ type: 'FETCH_USER_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'FETCH_USER_FAILURE', payload: error });
    }
  };
}

// 使用
store.dispatch(fetchUser(1));
```

**Thunk 的工作原理：**

```javascript
// Thunk 中间件源码简化版
const thunkMiddleware = ({ dispatch, getState }) => next => action => {
  // 如果 action 是函数，调用它并传入 dispatch 和 getState
  if (typeof action === 'function') {
    return action(dispatch, getState);
  }
  
  // 否则，正常传递给下一个中间件
  return next(action);
};
```

### 6.4 Redux Saga（更强大的异步处理）

**基于 Generator 函数的异步流程控制**

```bash
npm install redux-saga
```

```javascript
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { fetchUserSuccess, fetchUserFailure } from './actions';

// Worker Saga: 处理单个异步任务
function* fetchUser(action) {
  try {
    const user = yield call(fetchApi, action.payload.userId);
    yield put(fetchUserSuccess(user));
  } catch (error) {
    yield put(fetchUserFailure(error));
  }
}

// Watcher Saga: 监听 Action
function* watchFetchUser() {
  yield takeEvery('FETCH_USER_REQUEST', fetchUser);
}

// 根 Saga
export default function* rootSaga() {
  yield all([
    watchFetchUser(),
    // ... 其他 watcher sagas
  ]);
}

// 配置 Store
import createSagaMiddleware from 'redux-saga';

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
  rootReducer,
  applyMiddleware(sagaMiddleware)
);

sagaMiddleware.run(rootSaga);
```

**Saga 的优势：**
- 更容易测试
- 更好的错误处理
- 支持复杂的异步流程（竞态、取消等）

### 6.5 自定义中间件

**创建自己的中间件**

```javascript
// 1. 日志中间件
const loggerMiddleware = store => next => action => {
  console.group(action.type);
  console.log('dispatching', action);
  console.log('previous state', store.getState());
  
  const result = next(action);
  
  console.log('next state', store.getState());
  console.groupEnd();
  
  return result;
};

// 2. 错误处理中间件
const errorMiddleware = store => next => action => {
  try {
    return next(action);
  } catch (error) {
    console.error('Error in middleware:', error);
    console.error('Action:', action);
    console.error('State:', store.getState());
    throw error;
  }
};

// 3. 性能监控中间件
const perfMiddleware = store => next => action => {
  const start = Date.now();
  const result = next(action);
  const end = Date.now();
  
  console.log(`${action.type} took ${end - start}ms`);
  
  return result;
};
```

---

## 7. 实战案例

### 7.1 Todo 应用完整示例

**项目结构：**
```
src/
  ├── actions/
  │   ├── types.js
  │   └── index.js
  ├── reducers/
  │   ├── todos.js
  │   ├── visibilityFilter.js
  │   └── index.js
  ├── components/
  │   ├── Todo.js
  │   ├── TodoList.js
  │   └── AddTodo.js
  ├── containers/
  │   └── VisibleTodoList.js
  ├── App.js
  └── index.js
```

**实现代码：**

```javascript
// actions/types.js
export const ADD_TODO = 'ADD_TODO';
export const TOGGLE_TODO = 'TOGGLE_TODO';
export const SET_VISIBILITY_FILTER = 'SET_VISIBILITY_FILTER';

// actions/index.js
import { ADD_TODO, TOGGLE_TODO, SET_VISIBILITY_FILTER } from './types';

export const addTodo = text => ({
  type: ADD_TODO,
  payload: {
    id: Date.now(),
    text,
    completed: false
  }
});

export const toggleTodo = id => ({
  type: TOGGLE_TODO,
  payload: id
});

export const setVisibilityFilter = filter => ({
  type: SET_VISIBILITY_FILTER,
  payload: filter
});

// reducers/todos.js
import { ADD_TODO, TOGGLE_TODO } from '../actions/types';

const todosReducer = (state = [], action) => {
  switch (action.type) {
    case ADD_TODO:
      return [...state, action.payload];
    case TOGGLE_TODO:
      return state.map(todo =>
        todo.id === action.payload
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    default:
      return state;
  }
};

export default todosReducer;

// reducers/visibilityFilter.js
import { SET_VISIBILITY_FILTER } from '../actions/types';

const visibilityFilterReducer = (state = 'SHOW_ALL', action) => {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return action.payload;
    default:
      return state;
  }
};

export default visibilityFilterReducer;

// reducers/index.js
import { combineReducers } from 'redux';
import todos from './todos';
import visibilityFilter from './visibilityFilter';

export default combineReducers({
  todos,
  visibilityFilter
});

// components/Todo.js
import React from 'react';

const Todo = ({ onClick, completed, text }) => (
  <li
    onClick={onClick}
    style={{
      textDecoration: completed ? 'line-through' : 'none',
      cursor: 'pointer'
    }}
  >
    {text}
  </li>
);

export default Todo;

// components/TodoList.js
import React from 'react';
import Todo from './Todo';

const TodoList = ({ todos, onTodoClick }) => (
  <ul>
    {todos.map(todo => (
      <Todo
        key={todo.id}
        {...todo}
        onClick={() => onTodoClick(todo.id)}
      />
    ))}
  </ul>
);

export default TodoList;

// components/AddTodo.js
import React, { useState } from 'react';

const AddTodo = ({ onAdd }) => {
  const [text, setText] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What needs to be done?"
      />
      <button type="submit">Add Todo</button>
    </form>
  );
};

export default AddTodo;

// containers/VisibleTodoList.js
import { useSelector, useDispatch } from 'react-redux';
import { toggleTodo } from '../actions';
import TodoList from '../components/TodoList';

const getVisibleTodos = (todos, filter) => {
  switch (filter) {
    case 'SHOW_COMPLETED':
      return todos.filter(t => t.completed);
    case 'SHOW_ACTIVE':
      return todos.filter(t => !t.completed);
    default:
      return todos;
  }
};

const VisibleTodoList = () => {
  const todos = useSelector(state => state.todos);
  const filter = useSelector(state => state.visibilityFilter);
  const dispatch = useDispatch();

  const visibleTodos = getVisibleTodos(todos, filter);

  return (
    <TodoList
      todos={visibleTodos}
      onTodoClick={id => dispatch(toggleTodo(id))}
    />
  );
};

export default VisibleTodoList;

// App.js
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addTodo, setVisibilityFilter } from './actions';
import AddTodo from './components/AddTodo';
import VisibleTodoList from './containers/VisibleTodoList';

const App = () => {
  const dispatch = useDispatch();
  const filter = useSelector(state => state.visibilityFilter);

  return (
    <div>
      <h1>Todo App</h1>
      <AddTodo onAdd={text => dispatch(addTodo(text))} />
      <VisibleTodoList />
      <div>
        <button onClick={() => dispatch(setVisibilityFilter('SHOW_ALL'))}>
          All
        </button>
        <button onClick={() => dispatch(setVisibilityFilter('SHOW_ACTIVE'))}>
          Active
        </button>
        <button onClick={() => dispatch(setVisibilityFilter('SHOW_COMPLETED'))}>
          Completed
        </button>
      </div>
    </div>
  );
};

export default App;
```

### 7.2 购物车应用

**关键功能：**
- 添加商品到购物车
- 更新商品数量
- 删除商品
- 计算总价
- 应用优惠券

```javascript
// actions/cart.js
export const ADD_TO_CART = 'ADD_TO_CART';
export const REMOVE_FROM_CART = 'REMOVE_FROM_CART';
export const UPDATE_QUANTITY = 'UPDATE_QUANTITY';
export const APPLY_COUPON = 'APPLY_COUPON';
export const CLEAR_CART = 'CLEAR_CART';

export const addToCart = (product) => ({
  type: ADD_TO_CART,
  payload: product
});

export const removeFromCart = (productId) => ({
  type: REMOVE_FROM_CART,
  payload: productId
});

export const updateQuantity = (productId, quantity) => ({
  type: UPDATE_QUANTITY,
  payload: { productId, quantity }
});

export const applyCoupon = (code) => ({
  type: APPLY_COUPON,
  payload: code
});

// reducers/cart.js
const initialState = {
  items: [],
  coupon: null,
  discount: 0
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TO_CART:
      const existingItem = state.items.find(
        item => item.id === action.payload.id
      );
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }]
      };
      
    case REMOVE_FROM_CART:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
      
    case UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
      
    case APPLY_COUPON:
      // 简化的优惠券逻辑
      const discount = action.payload === 'DISCOUNT10' ? 0.1 : 0;
      return {
        ...state,
        coupon: action.payload,
        discount
      };
      
    case CLEAR_CART:
      return initialState;
      
    default:
      return state;
  }
};

export default cartReducer;

// selectors/cart.js
export const getCartItems = state => state.cart.items;
export const getCartTotal = state => {
  const items = state.cart.items;
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return subtotal * (1 - state.cart.discount);
};
export const getCartCount = state => 
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
```

---

## 8. 最佳实践与性能优化

### 8.1 代码组织结构

**推荐的项目结构：**
```
src/
├── store/
│   ├── index.js          # Store 配置
│   ├── rootReducer.js    # 根 Reducer
│   └── middleware/       # 中间件
├── features/             # 按功能划分
│   ├── auth/
│   │   ├── authSlice.js
│   │   ├── authActions.js
│   │   └── authSelectors.js
│   ├── cart/
│   │   ├── cartSlice.js
│   │   ├── cartActions.js
│   │   └── cartSelectors.js
│   └── products/
│       ├── productsSlice.js
│       ├── productsActions.js
│       └── productsSelectors.js
└── components/           # 展示组件
```

### 8.2 使用 Redux Toolkit（推荐）

**Redux Toolkit 简化了 Redux 的使用**

```bash
npm install @reduxjs/toolkit
```

```javascript
// 传统 Redux
// 1. 定义 Action 类型
const ADD_TODO = 'ADD_TODO';

// 2. 创建 Action Creator
const addTodo = (text) => ({
  type: ADD_TODO,
  payload: text
});

// 3. 创建 Reducer
function todosReducer(state = [], action) {
  switch (action.type) {
    case ADD_TODO:
      return [...state, action.payload];
    default:
      return state;
  }
}

// 使用 Redux Toolkit
import { createSlice } from '@reduxjs/toolkit';

const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: (state, action) => {
      // 可以直接修改 state，RTK 内部使用 Immer
      state.push(action.payload);
    },
    removeTodo: (state, action) => {
      return state.filter(todo => todo.id !== action.payload);
    }
  }
});

export const { addTodo, removeTodo } = todosSlice.actions;
export default todosSlice.reducer;
```

**RTK 的优势：**
- 自动生成 Action Creators
- 简化 Reducer 编写
- 内置 Immer 支持不可变更新
- 集成 Redux Thunk
- DevTools 支持

### 8.3 性能优化

**1. 使用 Reselect 缓存派生数据**

```bash
npm install reselect
```

```javascript
import { createSelector } from 'reselect';

// 基础 Selector
const selectTodos = state => state.todos;
const selectFilter = state => state.visibilityFilter;

// 派生 Selector（带缓存）
export const selectVisibleTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'SHOW_COMPLETED':
        return todos.filter(t => t.completed);
      case 'SHOW_ACTIVE':
        return todos.filter(t => !t.completed);
      default:
        return todos;
    }
  }
);

// 使用
const visibleTodos = useSelector(selectVisibleTodos);
```

**2. 避免不必要的重渲染**

```javascript
// ❌ 每次渲染都创建新对象
const { user } = useSelector(state => ({
  user: state.user
}));

// ✅ 使用浅比较
import { shallowEqual } from 'react-redux';

const { user } = useSelector(
  state => ({
    user: state.user
  }),
  shallowEqual
);

// ✅ 或者分别选择
const name = useSelector(state => state.user.name);
const email = useSelector(state => state.user.email);
```

**3. 使用 React.memo 优化组件**

```javascript
import React from 'react';

const TodoItem = React.memo(({ todo, onToggle }) => {
  console.log('Rendering TodoItem:', todo.id);
  
  return (
    <li onClick={() => onToggle(todo.id)}>
      {todo.text} - {todo.completed ? '✓' : '○'}
    </li>
  );
});
```

### 8.4 调试技巧

**1. 使用 Redux DevTools**

```javascript
import { createStore, applyMiddleware, compose } from 'redux';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);
```

**2. 添加日志中间件**

```javascript
const logger = store => next => action => {
  console.log('Action:', action);
  console.log('Prev State:', store.getState());
  
  const result = next(action);
  
  console.log('Next State:', store.getState());
  console.log('-------------------');
  
  return result;
};
```

---

## 9. 常见问题与解决方案

### 9.1 常见错误

**1. 直接修改状态**

```javascript
// ❌ 错误
state.todos.push(newTodo);

// ✅ 正确
return [...state.todos, newTodo];
```

**2. 在 Reducer 中产生副作用**

```javascript
// ❌ 错误
function reducer(state, action) {
  if (action.type === 'FETCH_DATA') {
    fetch('/api/data') // 副作用
      .then(data => {
        return { ...state, data };
      });
  }
}

// ✅ 正确：使用 Thunk
function fetchData() {
  return async dispatch => {
    const data = await fetch('/api/data');
    dispatch({ type: 'SET_DATA', payload: data });
  };
}
```

**3. 忘记返回默认状态**

```javascript
// ❌ 错误
function reducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    // 忘记 default 情况
  }
}

// ✅ 正确
function reducer(state = 0, action) {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    default:
      return state; // 必须返回
  }
}
```

### 9.2 性能问题

**问题：组件频繁重渲染**

**解决方案：**
```javascript
// 1. 使用 Reselect 缓存派生数据
// 2. 使用 shallowEqual 进行浅比较
// 3. 拆分组件，减少不必要的渲染
// 4. 使用 React.memo 包裹纯组件
```

### 9.3 异步处理问题

**问题：多个异步请求的竞态条件**

**解决方案：**
```javascript
// 使用 Redux Saga 处理竞态
function* fetchUser(action) {
  const { userId, requestId } = action.payload;
  
  // 取消之前的请求
  yield takeLatest('FETCH_USER_REQUEST', fetchUser);
  
  try {
    const user = yield call(api.fetchUser, userId);
    yield put({ type: 'FETCH_USER_SUCCESS', payload: { user, requestId } });
  } catch (error) {
    yield put({ type: 'FETCH_USER_FAILURE', payload: { error, requestId } });
  }
}
```

---

## 📖 学习资源

1. **官方文档**: [https://redux.js.org/](https://redux.js.org/)
2. **Redux Toolkit**: [https://redux-toolkit.js.org/](https://redux-toolkit.js.org/)
3. **Redux DevTools**: Chrome 扩展
4. **推荐书籍**: 《深入浅出 Redux》

---

## 🎯 总结

Redux 的核心思想：
- **单一数据源**：集中管理状态
- **状态只读**：通过 Action 触发变化
- **纯函数修改**：使用 Reducer 描述状态变化

最佳实践：
- 使用 Redux Toolkit 简化开发
- 合理组织代码结构
- 使用 Reselect 优化性能
- 避免直接修改状态

进阶学习：
- Redux Saga 处理复杂异步流程
- 服务端渲染（SSR）集成
- 代码分割和懒加载

希望这份深入教学能帮助你掌握 Redux！🚀