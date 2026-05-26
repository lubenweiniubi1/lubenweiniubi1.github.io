[← 返回笔记目录](/) 

---

# RTK Query 深入教学

## 📚 目录

1. [什么是 RTK Query？](#什么是-rtk-query)
2. [核心概念](#核心概念)
3. [快速开始](#快速开始)
4. [API 创建详解](#api-创建)
5. [Hooks 使用](#hooks使用)
6. [缓存与失效策略](#缓存与失效)
7. [错误处理](#错误处理)
8. [高级功能](#高级功能)
9. [最佳实践](#最佳实践)
10. [完整实战案例](#实战案例)

---

## 1. 什么是 RTK Query？

### 1.1 简介

**RTK Query** 是 Redux Toolkit 的官方数据获取和缓存解决方案，它简化了从服务器获取数据、缓存数据和更新缓存的整个流程。

### 1.2 传统方式的痛点

```javascript
// ❌ 传统 Redux + Thunk 的复杂流程
// 1. 定义多个 action types
const FETCH_USERS_REQUEST = 'FETCH_USERS_REQUEST'
const FETCH_USERS_SUCCESS = 'FETCH_USERS_SUCCESS'
const FETCH_USERS_FAILURE = 'FETCH_USERS_FAILURE'

// 2. 创建多个 action creators
const fetchUsersRequest = () => ({ type: FETCH_USERS_REQUEST })
const fetchUsersSuccess = (users) => ({ type: FETCH_USERS_SUCCESS, payload: users })
const fetchUsersFailure = (error) => ({ type: FETCH_USERS_FAILURE, payload: error })

// 3. 创建异步 thunk
const fetchUsers = () => async (dispatch) => {
  dispatch(fetchUsersRequest())
  try {
    const response = await fetch('/api/users')
    const data = await response.json()
    dispatch(fetchUsersSuccess(data))
  } catch (error) {
    dispatch(fetchUsersFailure(error))
  }
}

// 4. 创建 reducer
const initialState = {
  loading: false,
  users: [],
  error: null
}

function usersReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_USERS_REQUEST:
      return { ...state, loading: true }
    case FETCH_USERS_SUCCESS:
      return { ...state, loading: false, users: action.payload }
    case FETCH_USERS_FAILURE:
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}

// 5. 在组件中使用
function UsersList() {
  const dispatch = useDispatch()
  const { users, loading, error } = useSelector(state => state.users)
  
  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])
  
  // ... 渲染逻辑
}
```

### 1.3 RTK Query 的简化

```javascript
// ✅ RTK Query 的简洁方式
// 1. 创建 API
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/users'
    })
  })
})

// 2. 在组件中使用
function UsersList() {
  const { data: users, isLoading, error } = useGetUsersQuery()
  
  // ... 渲染逻辑
}
```

**对比：**
- ❌ 传统方式：50+ 行代码，多个文件，重复样板代码
- ✅ RTK Query：10 行代码，自动处理 loading/error，内置缓存

---

## 2. 核心概念

### 2.1 API Slice（API 切片）

API Slice 是 RTK Query 的核心，它定义了与后端交互的所有 endpoints。

```javascript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// 创建 API Slice
export const apiSlice = createApi({
  // 基础查询配置
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  
  // 定义 endpoints
  endpoints: (builder) => ({
    // Query endpoint（查询）
    getUsers: builder.query({
      query: () => '/users'
    }),
    
    // Mutation endpoint（变更）
    addUser: builder.mutation({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user
      })
    })
  })
})

// 自动生成的 hooks
export const { useGetUsersQuery, useAddUserMutation } = apiSlice
```

### 2.2 Query vs Mutation

| 特性 | Query | Mutation |
|------|-------|----------|
| **用途** | 获取数据（GET） | 修改数据（POST/PUT/PATCH/DELETE） |
| **自动触发** | ✅ 组件渲染时自动执行 | ❌ 需要手动调用 |
| **缓存** | ✅ 自动缓存 | ❌ 不缓存（除非手动配置） |
| **重试** | ✅ 自动重试 | ❌ 不自动重试 |
| **标签** | ✅ 支持缓存标签 | ✅ 支持使缓存失效 |

```javascript
// Query - 自动执行, 有 cache，不会重复执行。详见cache机制
const { data, isLoading, error } = useGetUsersQuery()

// Mutation - 需要手动调用
const [addUser, { data, isLoading, error }] = useAddUserMutation()
const handleClick = () => {
  addUser({ name: 'John' })
}
```

### 2.3 缓存标签（Cache Tags）

缓存标签用于管理数据的失效和重新获取。

```javascript
createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User', 'Post'],  // 定义标签类型
  
  endpoints: (builder) => ({
    // 提供标签
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User']  // 此查询提供 User 标签
    }),
    
    // 使标签失效
    addUser: builder.mutation({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user // 这里是请求体，调用的时候传的
      }),
      invalidatesTags: ['User']  // 此变更使 User 标签失效
    })
  })
})
```

**工作原理：**
1. `getUsers` 查询执行，缓存数据并标记为 `User` 标签
2. `addUser` 变更执行，标记 `User` 标签为失效
3. 所有依赖 `User` 标签的查询自动重新获取

---

## 3. 快速开始

### 3.1 安装

```bash
npm install @reduxjs/toolkit react-redux
```

### 3.2 基本配置

```javascript
// src/app/store.js
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { apiSlice } from './apiSlice'

export const store = configureStore({
  reducer: {
    // 添加 api reducer
    [apiSlice.reducerPath]: apiSlice.reducer
  },
  // 配置 middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware)
})

// 可选：设置自动 refetching 行为
setupListeners(store.dispatch)
```

```javascript
// src/app/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiSlice = createApi({
  reducerPath: 'api',  // 可选：自定义 reducer 路径
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User']
    }),
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }]
    }),
    addUser: builder.mutation({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user
      }),
      invalidatesTags: ['User']
    }),
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }]
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'User', id }]
    })
  })
})

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation
} = apiSlice
```

```javascript
// src/main.js
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './app/store'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <App />
  </Provider>
)
```

### 3.3 在组件中使用

```javascript
// src/components/UsersList.js
import React from 'react'
import { useGetUsersQuery, useDeleteUserMutation } from '../app/apiSlice'

function UsersList() {
  // 使用 Query hook
  const { data: users, isLoading, error } = useGetUsersQuery()
  
  // 使用 Mutation hook
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users?.map(user => (
          <li key={user.id}>
            {user.name}
            <button 
              onClick={() => deleteUser(user.id)}
              disabled={isDeleting}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default UsersList
```

---

## 4. API 创建详解

### 4.1 createApi 配置项

```javascript
createApi({
  // 1. reducer 路径（可选）
  reducerPath: 'api',  // 默认为 'api'
  
  // 2. 基础查询函数
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // 添加认证 token
      const token = getState().auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    }
  }),
  
  // 3. 定义缓存标签类型
  tagTypes: ['User', 'Post', 'Comment'],
  
  // 4. endpoints 定义
  endpoints: (builder) => ({
    // ... endpoints
  }),
  
  // 5. keepUnusedDataFor（可选）
  // 控制数据在不再使用后保留多久（秒），默认 60 秒
  keepUnusedDataFor: 60,
  
  // 6. refetchOnFocus（可选）
  // 窗口获得焦点时自动重新获取，默认 false
  refetchOnFocus: false,
  
  // 7. refetchOnReconnect（可选）
  // 网络重新连接时自动重新获取，默认 false
  refetchOnReconnect: false,
  
  // 8. refetchOnMountOrArgChange（可选）
  // 组件挂载或参数变化时重新获取
  // - false: 从不（默认）
  // - true: 总是
  // - number: 仅当参数变化且超过指定秒数
  refetchOnMountOrArgChange: false
})
```

### 4.2 fetchBaseQuery 配置

```javascript
const baseQuery = fetchBaseQuery({
  // 基础 URL
  baseUrl: 'https://api.example.com',
  
  // 自定义请求头
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
  
  // 自定义响应处理
  responseHandler: async (response) => {
    // 默认返回 JSON
    return response.json()
  },
  
  // 自定义错误处理
  validateStatus: (response, result) => {
    // 默认：status >= 200 && status < 300
    return response.status === 200 && !result.error
  },
  
  // 超时时间（毫秒）
  timeout: 10000,
  
  // 自定义 fetch 函数
  fetchFn: customFetchFunction
})
```

### 4.3 自定义 baseQuery

```javascript
// 默认用的fetch，也可以自定义，比如用 axios
// 使用 axios 作为 baseQuery
import axios from 'axios'

const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axios({ url: baseUrl + url, method, data, params })
      return { data: result.data }
    } catch (axiosError) {
      const err = { status: axiosError.response?.status, data: axiosError.response?.data }
      return { error: err }
    }
  }

// 使用
createApi({
  baseQuery: axiosBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    // ...
  })
})
```

---

## 5. Hooks 使用详解

### 5.1 Query Hooks

#### useQuery - 基础查询

```javascript
const { 
  data,           // 查询结果
  currentData,    // 当前数据（不包括缓存的陈旧数据）
  isLoading,      // 是否正在加载
  isFetching,     // 是否正在获取（包括背景刷新）
  isSuccess,      // 是否成功
  isError,        // 是否出错
  error,          // 错误对象
  refetch,        // 手动重新获取函数
  isUninitialized,// 查询尚未开始
  status          // 'uninitialized' | 'pending' | 'fulfilled' | 'rejected'
} = useGetUsersQuery()
```

#### skip 选项 - 条件查询

```javascript
// 当 skip 为 true 时，不执行查询
const { data, isLoading } = useGetUserByIdQuery(userId, {
  skip: !userId  // userId 不存在时不查询
})
```

#### selectFromResult - 选择性订阅

```javascript
// 只订阅需要的数据，避免不必要的重渲染
const { user } = useGetUserByIdQuery(userId, {
  selectFromResult: ({ data }) => ({
    user: data?.name
  })
})
```

#### pollingInterval - 轮询

```javascript
// 每 5 秒自动重新获取
const { data } = useGetUsersQuery(undefined, {
  pollingInterval: 5000
})
```

#### refetchOnFocus / refetchOnReconnect

```javascript
// 窗口获得焦点时重新获取
const { data } = useGetUsersQuery(undefined, {
  refetchOnFocus: true
})

// 网络重新连接时重新获取
const { data } = useGetUsersQuery(undefined, {
  refetchOnReconnect: true
})
```

### 5.2 Mutation Hooks

```javascript
const [trigger, result] = useAddUserMutation()

// trigger: 触发函数
// result: 包含以下属性
// - data: 变更结果
// - isLoading: 是否正在执行
// - isSuccess: 是否成功
// - isError: 是否出错
// - error: 错误对象
// - reset: 重置 mutation 状态
// - originalArgs: 原始参数
// - requestId: 请求 ID
// - endpointName: endpoint 名称

// 使用示例
const [addUser, { data, isLoading, error }] = useAddUserMutation()

const handleSubmit = async (userData) => {
  try {
    await addUser(userData).unwrap()  // unwrap() 抛出错误
    console.log('User added:', data)
  } catch (err) {
    console.error('Failed to add user:', err)
  }
}
```

### 5.3 Lazy Query - 懒加载查询

```javascript
// 不会自动执行，需要手动触发
const [trigger, result] = useLazyGetUserByIdQuery()

// result 包含与普通 query 相同的属性
const { data, isLoading, error } = result

// 手动触发
const handleClick = () => {
  trigger(userId)
}

// 或者带选项触发
const handleClick = () => {
  trigger(userId, true)  // true = 忽略缓存，强制重新获取
}
```

---

## 6. 缓存与失效策略

### 6.1 providesTags 和 invalidatesTags

```javascript
createApi({
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    // 查询：提供标签
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User']  // 提供 User 标签
    }),
    
    getUserById: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [
        { type: 'User', id }  // 提供特定 ID 的 User 标签
      ]
    }),
    
    // 变更：使标签失效
    addUser: builder.mutation({
      query: (user) => ({
        url: '/users',
        method: 'POST',
        body: user
      }),
      invalidatesTags: ['User']  // 使所有 User 标签失效
    }),
    
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id }  // 使特定 ID 的 User 标签失效
      ]
    }),
    
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        'User'  // 同时使特定和所有 User 标签失效
      ]
    })
  })
})
```

### 6.2 手动使缓存失效

```javascript
const dispatch = useDispatch()

// 使特定标签失效
dispatch(apiSlice.util.invalidateTags(['User']))

// 使特定 ID 的标签失效
dispatch(apiSlice.util.invalidateTags([{ type: 'User', id: 1 }]))

// 使多个标签失效
dispatch(apiSlice.util.invalidateTags(['User', 'Post']))

// 重新获取特定查询
dispatch(apiSlice.util.invalidateTags(['User']))
// 等价于
dispatch(apiSlice.endpoints.getUsers.initiate(undefined, { forceRefetch: true }))
```

### 6.3 手动更新缓存（Optimistic Updates）

```javascript
const [updatePost] = useUpdatePostMutation()
const { data: post } = useGetPostByIdQuery(postId)

const handleUpdate = async (update) => {
  // 乐观更新：立即更新 UI
  dispatch(
    apiSlice.util.updateQueryData('getPostById', postId, (draft) => {
      Object.assign(draft, update)
    })
  )
  
  try {
    // 实际执行更新
    await updatePost({ id: postId, ...update }).unwrap()
  } catch (error) {
    // 失败时回滚
    dispatch(
      apiSlice.util.invalidateTags([{ type: 'Post', id: postId }])
    )
  }
}
```

### 6.4 缓存生命周期

```javascript
createApi({
  // 数据在不再使用后保留的时间（秒）
  keepUnusedDataFor: 60,  // 默认 60 秒
  
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => '/users',
      
      // 覆盖全局设置
      keepUnusedDataFor: 300,  // 5 分钟
    })
  })
})
```

---

## 7. 错误处理

### 7.1 基础错误处理

```javascript
const { data, error, isLoading } = useGetUsersQuery()

if (error) {
  console.error('Error:', error)
  
  // 错误对象结构
  // {
  //   status: 404,           // HTTP 状态码
  //   data: { message: '...' },  // 响应数据
  //   error: 'Not Found'     // 错误消息
  // }
}
```

### 7.2 使用 unwrap() 处理错误

```javascript
const [addUser] = useAddUserMutation()

const handleSubmit = async (userData) => {
  try {
    const result = await addUser(userData).unwrap()
    console.log('Success:', result)
  } catch (error) {
    console.error('Error:', error)
    // 显示错误消息给用户
    setError(error.data?.message || 'Failed to add user')
  }
}
```

### 7.3 自定义错误处理

```javascript
const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  validateStatus: (response, result) => {
    // 自定义成功条件
    return response.status === 200 && !result.error
  }
})

const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions)
  
  if (result.error) {
    // 全局错误处理
    if (result.error.status === 401) {
      // 未授权，跳转到登录页
      window.location.href = '/login'
    } else if (result.error.status === 403) {
      // 禁止访问
      alert('You do not have permission to access this resource')
    }
  }
  
  return result
}

createApi({
  baseQuery: baseQueryWithErrorHandling,
  endpoints: (builder) => ({
    // ...
  })
})
```

### 7.4 重试机制

```javascript
// 全局重试配置
const baseQuery = fetchBaseQuery({ baseUrl: '/api' })
const baseQueryWithRetry = retry(baseQuery, { maxRetries: 3 })

createApi({
  baseQuery: baseQueryWithRetry,
  endpoints: (builder) => ({
    // ...
  })
})

// 单个 endpoint 重试配置
getUsers: builder.query({
  query: () => '/users',
  extraOptions: { maxRetries: 5 }
})

// 禁用重试
getUsers: builder.query({
  query: () => '/users',
  extraOptions: { maxRetries: 0 }
})
```

---

## 8. 高级功能

### 8.1 乐观更新（Optimistic Updates）

```javascript
const [addPost] = useAddPostMutation()
const dispatch = useDispatch()

const handleAddPost = async (newPost) => {
  // 1. 乐观更新：立即添加到缓存
  dispatch(
    apiSlice.util.updateQueryData('getPosts', undefined, (draft) => {
      draft.unshift({ ...newPost, id: Date.now(), createdAt: new Date().toISOString() })
    })
  )
  
  try {
    // 2. 实际执行 API 调用
    await addPost(newPost).unwrap()
    // 成功：缓存会自动更新
  } catch (error) {
    // 3. 失败：回滚乐观更新
    dispatch(
      apiSlice.util.invalidateTags(['Post'])
    )
    console.error('Failed to add post:', error)
  }
}
```

### 8.2 无限滚动（Infinite Scroll）

```javascript
// 定义分页查询
getPosts: builder.query({
  query: ({ page = 1, limit = 10 }) => `/posts?page=${page}&limit=${limit}`,
  serializeQueryArgs: ({ queryArgs }) => {
    // 忽略 page 参数，使所有页面共享同一个缓存键
    return `/posts?limit=${queryArgs.limit}`
  },
  merge: (currentCache, newItems, { arg }) => {
    // 合并新数据到现有缓存
    if (arg.page === 1) {
      return newItems  // 第一页，替换缓存
    }
    return [...currentCache, ...newItems]  // 后续页，追加数据
  },
  forceRefetch({ currentArg, previousArg }) {
    // 当 page 变为 1 时强制重新获取
    return currentArg?.page === 1
  }
})

// 组件使用
function PostList() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, refetch } = useGetPostsQuery({ page, limit: 10 })
  
  const loadMore = () => {
    setPage(prev => prev + 1)
  }
  
  return (
    <div>
      {data?.map(post => <PostItem key={post.id} post={post} />)}
      <button onClick={loadMore} disabled={isFetching}>
        {isFetching ? 'Loading...' : 'Load More'}
      </button>
    </div>
  )
}
```

### 8.3 文件上传

```javascript
// Mutation for file upload
uploadFile: builder.mutation({
  query: ({ file, ...metadata }) => {
    const formData = new FormData()
    formData.append('file', file)
    Object.entries(metadata).forEach(([key, value]) => {
      formData.append(key, value)
    })
    
    return {
      url: '/upload',
      method: 'POST',
      body: formData
    }
  }
})

// Component usage
function FileUpload() {
  const [uploadFile, { isLoading, error }] = useUploadFileMutation()
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const result = await uploadFile({ 
          file,
          description: 'My file'
        }).unwrap()
        console.log('Upload successful:', result)
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }
  }
  
  return (
    <input 
      type="file" 
      onChange={handleFileChange} 
      disabled={isLoading}
    />
  )
}
```

### 8.4 WebSocket 集成

```javascript
// 自定义 baseQuery 支持 WebSocket
const websocketBaseQuery = ({ url }) => {
  let ws
  
  return async ({ type, payload }) => {
    if (type === 'init') {
      ws = new WebSocket(url)
      return { data: { status: 'connected' } }
    }
    
    if (type === 'send') {
      ws.send(JSON.stringify(payload))
      return { data: { status: 'sent' } }
    }
    
    if (type === 'close') {
      ws.close()
      return { data: { status: 'closed' } }
    }
  }
}

// 使用
const [sendMessage] = useSendMessageMutation()

const handleSend = () => {
  sendMessage({ type: 'send', payload: { message: 'Hello' } })
}
```

---

## 9. 最佳实践

### 9.1 项目结构

```
src/
├── app/
│   ├── store.js
│   └── apiSlice.js          # 主 API slice
├── features/
│   ├── users/
│   │   ├── usersApi.js      # 用户相关 endpoints
│   │   ├── UsersList.js
│   │   └── UserDetail.js
│   ├── posts/
│   │   ├── postsApi.js      # 帖子相关 endpoints
│   │   ├── PostsList.js
│   │   └── PostDetail.js
│   └── comments/
│       ├── commentsApi.js   # 评论相关 endpoints
│       └── CommentForm.js
└── components/
    └── common/
        ├── Loading.js
        └── Error.js
```

### 9.2 拆分 API Slices

```javascript
// usersApi.js
export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/users' }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query({ /* ... */ }),
    getUser: builder.query({ /* ... */ }),
    createUser: builder.mutation({ /* ... */ }),
    updateUser: builder.mutation({ /* ... */ }),
    deleteUser: builder.mutation({ /* ... */ })
  })
})

// postsApi.js
export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/posts' }),
  tagTypes: ['Post'],
  endpoints: (builder) => ({
    getPosts: builder.query({ /* ... */ }),
    getPost: builder.query({ /* ... */ }),
    createPost: builder.mutation({ /* ... */ })
  })
})

// store.js
export const store = configureStore({
  reducer: {
    [usersApi.reducerPath]: usersApi.reducer,
    [postsApi.reducerPath]: postsApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(usersApi.middleware)
      .concat(postsApi.middleware)
})
```

### 9.3 选择性订阅优化

```javascript
// ❌ 不推荐：订阅整个对象
const { data: post } = useGetPostQuery(postId)

// ✅ 推荐：只订阅需要的字段
const { title, author } = useGetPostQuery(postId, {
  selectFromResult: ({ data }) => ({
    title: data?.title,
    author: data?.author?.name
  })
})
```

### 9.4 错误边界

```javascript
// ErrorBoundary.js
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}

export default ErrorBoundary

// 使用
<ErrorBoundary>
  <UsersList />
</ErrorBoundary>
```

---

## 10. 完整实战案例

### 10.1 博客应用

```javascript
// api/blogApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const blogApi = createApi({
  reducerPath: 'blogApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://api.example.com',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    }
  }),
  tagTypes: ['Post', 'User', 'Comment'],
  endpoints: (builder) => ({
    // 获取所有帖子
    getPosts: builder.query({
      query: ({ page = 1, limit = 10 }) => `/posts?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Post', id })), 'Post']
          : ['Post']
    }),
    
    // 获取单个帖子
    getPost: builder.query({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }]
    }),
    
    // 创建帖子
    createPost: builder.mutation({
      query: (post) => ({
        url: '/posts',
        method: 'POST',
        body: post
      }),
      invalidatesTags: ['Post']
    }),
    
    // 更新帖子
    updatePost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }]
    }),
    
    // 删除帖子
    deletePost: builder.mutation({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }, 'Post']
    }),
    
    // 获取帖子评论
    getComments: builder.query({
      query: (postId) => `/posts/${postId}/comments`,
      providesTags: (result, error, postId) => [
        { type: 'Comment', id: `POST-${postId}` }
      ]
    }),
    
    // 添加评论
    addComment: builder.mutation({
      query: ({ postId, ...comment }) => ({
        url: `/posts/${postId}/comments`,
        method: 'POST',
        body: comment
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Comment', id: `POST-${postId}` },
        { type: 'Post', id: postId }
      ]
    }),
    
    // 获取用户
    getUser: builder.query({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }]
    })
  })
})

export const {
  useGetPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useGetUserQuery
} = blogApi
```

```javascript
// components/PostList.js
import React, { useState } from 'react'
import { useGetPostsQuery, useDeletePostMutation } from '../api/blogApi'

function PostList() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, error } = useGetPostsQuery({ page, limit: 10 })
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div className="post-list">
      {data?.map(post => (
        <div key={post.id} className="post-card">
          <h2>{post.title}</h2>
          <p>{post.content.substring(0, 100)}...</p>
          <div className="post-meta">
            <span>By: {post.author}</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <button 
              onClick={() => deletePost(post.id)}
              disabled={isDeleting}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      
      <div className="pagination">
        <button 
          onClick={() => setPage(p => p - 1)} 
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button 
          onClick={() => setPage(p => p + 1)} 
          disabled={isFetching || !data?.length}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default PostList
```

```javascript
// components/PostDetail.js
import React from 'react'
import { useGetPostQuery, useGetCommentsQuery, useAddCommentMutation } from '../api/blogApi'

function PostDetail({ postId }) {
  const { data: post, isLoading: postLoading } = useGetPostQuery(postId)
  const { data: comments, isLoading: commentsLoading } = useGetCommentsQuery(postId)
  const [addComment, { isLoading: isAdding }] = useAddCommentMutation()
  
  const [commentText, setCommentText] = React.useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    
    await addComment({ postId, text: commentText, author: 'CurrentUser' })
    setCommentText('')
  }
  
  if (postLoading) return <div>Loading post...</div>
  if (!post) return <div>Post not found</div>
  
  return (
    <div className="post-detail">
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      
      <h2>Comments</h2>
      {commentsLoading && <div>Loading comments...</div>}
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
        />
        <button type="submit" disabled={isAdding || !commentText.trim()}>
          {isAdding ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
      
      <div className="comments-list">
        {comments?.map(comment => (
          <div key={comment.id} className="comment">
            <strong>{comment.author}</strong>
            <p>{comment.text}</p>
            <small>{new Date(comment.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PostDetail
```

---

## 📖 学习资源

1. **官方文档**: https://redux-toolkit.js.org/rtk-query/overview
2. **GitHub**: https://github.com/reduxjs/redux-toolkit
3. **示例项目**: https://github.com/reduxjs/redux-toolkit/tree/master/examples

---

## 🎯 总结

### RTK Query 的核心优势：

✅ **零样板代码**：自动生成 hooks、reducers、actions  
✅ **内置缓存**：自动管理数据缓存和失效  
✅ **类型安全**：完美支持 TypeScript  
✅ **自动重试**：内置重试机制  
✅ **乐观更新**：轻松实现乐观更新  
✅ **标签系统**：智能的缓存失效策略  

### 适用场景：

- ✅ 数据获取和缓存
- ✅ CRUD 操作
- ✅ 实时数据更新
- ✅ 离线优先应用

### 迁移建议：

1. **从传统 Redux**：逐步替换 thunk + reducer 为 RTK Query
2. **从其他库**：RTK Query 可以替代 React Query、SWR 等
3. **新项目**：直接使用 RTK Query

RTK Query 是现代 React 应用数据获取的最佳实践！🚀