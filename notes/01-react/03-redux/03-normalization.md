[← 返回笔记目录](/) 

---

# Redux 数据规范化（Normalization）

## 📚 什么是数据规范化？

**数据规范化**（Data Normalization）是将嵌套或关联的数据结构转换为**扁平化格式**的过程，类似于关系型数据库的表结构设计。

### 核心思想

```javascript
// ❌ 非规范化（嵌套结构）- 问题多多
{
  posts: [
    {
      id: 'post1',
      title: 'Redux Tutorial',
      author: {
        id: 'user1',
        name: 'John Doe',
        avatar: '...'
      },
      comments: [
        {
          id: 'comment1',
          text: 'Great article!',
          author: {
            id: 'user2',
            name: 'Jane Smith'
          }
        }
      ]
    }
  ]
}

// ✅ 规范化（扁平结构）- 推荐做法
{
  posts: {
    byId: {
      post1: {
        id: 'post1',
        title: 'Redux Tutorial',
        author: 'user1',  // 只存储ID
        comments: ['comment1']  // 只存储ID数组
      }
    },
    allIds: ['post1']
  },
  users: {
    byId: {
      user1: {
        id: 'user1',
        name: 'John Doe',
        avatar: '...'
      },
      user2: {
        id: 'user2',
        name: 'Jane Smith'
      }
    },
    allIds: ['user1', 'user2']
  },
  comments: {
    byId: {
      comment1: {
        id: 'comment1',
        text: 'Great article!',
        author: 'user2'
      }
    },
    allIds: ['comment1']
  }
}
```

---

## 🎯 为什么要规范化？

### 1. **避免数据冗余**

```javascript
// ❌ 非规范化：用户数据重复存储
const state = {
  posts: [
    {
      id: 1,
      title: 'Post 1',
      author: { id: 1, name: 'Alice', email: 'alice@example.com' }
    },
    {
      id: 2,
      title: 'Post 2',
      author: { id: 1, name: 'Alice', email: 'alice@example.com' }  // 重复！
    }
  ]
}

// ✅ 规范化：用户数据只存储一次
const state = {
  posts: {
    byId: {
      1: { id: 1, title: 'Post 1', author: 1 },
      2: { id: 2, title: 'Post 2', author: 1 }
    }
  },
  users: {
    byId: {
      1: { id: 1, name: 'Alice', email: 'alice@example.com' }  // 只存一次
    }
  }
}
```

### 2. **简化更新操作**

```javascript
// ❌ 非规范化：更新用户信息需要遍历所有帖子
function updateUser(state, userId, newData) {
  return {
    ...state,
    posts: state.posts.map(post => 
      post.author.id === userId 
        ? { ...post, author: { ...post.author, ...newData } }
        : post
    )
  }
}

// ✅ 规范化：只需更新一处
function updateUser(state, userId, newData) {
  return {
    ...state,
    users: {
      ...state.users,
      byId: {
        ...state.users.byId,
        [userId]: { ...state.users.byId[userId], ...newData }
      }
    }
  }
}
```

### 3. **提高查询性能**

```javascript
// ❌ 非规范化：需要遍历数组查找
const post = state.posts.find(p => p.id === postId)

// ✅ 规范化：O(1) 时间复杂度
const post = state.posts.byId[postId]
```

### 4. **保持数据一致性**

```javascript
// ❌ 非规范化：同一用户在不同地方可能有不同的数据
{
  posts: [
    { author: { id: 1, name: 'Alice' } },
    { author: { id: 1, name: 'Alicia' } }  // 不一致！
  ]
}

// ✅ 规范化：所有引用都指向同一份数据
{
  posts: {
    byId: {
      1: { author: 1 },
      2: { author: 1 }
    }
  },
  users: {
    byId: {
      1: { id: 1, name: 'Alice' }  // 唯一真实来源
    }
  }
}
```

---

## 📐 规范化的原则

### 1. **每个实体类型独立存储**

```javascript
{
  // 每种数据类型都有自己的"表"
  posts: { byId: {}, allIds: [] },
  users: { byId: {}, allIds: [] },
  comments: { byId: {}, allIds: [] },
  categories: { byId: {}, allIds: [] }
}
```

### 2. **使用 ID 作为键**

```javascript
// ✅ 推荐：对象形式，通过ID快速访问
posts: {
  byId: {
    'post-1': { id: 'post-1', title: '...' },
    'post-2': { id: 'post-2', title: '...' }
  }
}

// ❌ 不推荐：数组形式，需要遍历查找
posts: [
  { id: 'post-1', title: '...' },
  { id: 'post-2', title: '...' }
]
```

### 3. **通过 ID 引用关联实体**

```javascript
// ✅ 正确：存储关联实体的ID
post: {
  id: 'post-1',
  author: 'user-123',  // 只存ID
  comments: ['comment-1', 'comment-2']  // ID数组
}

// ❌ 错误：嵌套完整对象
post: {
  id: 'post-1',
  author: { id: 'user-123', name: 'John', ... },  // 完整对象
  comments: [
    { id: 'comment-1', text: '...', author: { ... } }
  ]
}
```

### 4. **保留排序信息**

```javascript
// 使用 allIds 数组维护顺序
posts: {
  byId: {
    'post-3': { id: 'post-3', title: 'Latest' },
    'post-1': { id: 'post-1', title: 'Oldest' },
    'post-2': { id: 'post-2', title: 'Middle' }
  },
  allIds: ['post-1', 'post-2', 'post-3']  // 按时间排序
}
```

---

## 🔧 实现规范化

### 方法 1：手动规范化

```javascript
// 原始嵌套数据
const apiResponse = {
  posts: [
    {
      id: 1,
      title: 'Post 1',
      author: { id: 101, name: 'Alice' },
      comments: [
        { id: 201, text: 'Great!', author: { id: 102, name: 'Bob' } }
      ]
    }
  ]
}

// 手动规范化函数
function normalizePosts(data) {
  const postsById = {}
  const usersById = {}
  const commentsById = {}
  
  data.posts.forEach(post => {
    // 提取用户
    if (!usersById[post.author.id]) {
      usersById[post.author.id] = post.author
    }
    
    // 处理评论
    const commentIds = []
    post.comments.forEach(comment => {
      if (!usersById[comment.author.id]) {
        usersById[comment.author.id] = comment.author
      }
      
      commentsById[comment.id] = {
        id: comment.id,
        text: comment.text,
        author: comment.author.id  // 只存ID
      }
      commentIds.push(comment.id)
    })
    
    // 存储帖子
    postsById[post.id] = {
      id: post.id,
      title: post.title,
      author: post.author.id,  // 只存ID
      comments: commentIds  // ID数组
    }
  })
  
  return {
    posts: {
      byId: postsById,
      allIds: Object.keys(postsById)
    },
    users: {
      byId: usersById,
      allIds: Object.keys(usersById)
    },
    comments: {
      byId: commentsById,
      allIds: Object.keys(commentsById)
    }
  }
}
```

### 方法 2：使用 normalizr 库（推荐）

```bash
npm install normalizr
```

```javascript
import { normalize, schema } from 'normalizr'

// 定义 schema
const user = new schema.Entity('users')
const comment = new schema.Entity('comments', {
  author: user
})
const post = new schema.Entity('posts', {
  author: user,
  comments: [comment]  // 数组
})

// 规范化数据
const normalizedData = normalize(apiResponse.posts, [post])

console.log(normalizedData)
// {
//   entities: {
//     posts: { ... },
//     users: { ... },
//     comments: { ... }
//   },
//   result: [...]  // ID数组
// }
```

### 方法 3：使用 Redux Toolkit 的 createEntityAdapter（最推荐）

```javascript
import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'

// 创建 Entity Adapter
const postsAdapter = createEntityAdapter({
  // 可选：自定义排序
  sortComparer: (a, b) => a.date.localeCompare(b.date)
})

// 初始状态
const initialState = postsAdapter.getInitialState({
  loading: false,
  error: null
})

// 创建 Slice
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // 自动生成的 CRUD 操作
    addPost: postsAdapter.addOne,
    addPosts: postsAdapter.addMany,
    updatePost: postsAdapter.updateOne,
    removePost: postsAdapter.removeOne,
    setPosts: postsAdapter.setAll,
    
    // 自定义 reducer
    postsLoading(state) {
      state.loading = true
    },
    postsLoaded(state, action) {
      state.loading = false
      postsAdapter.setAll(state, action.payload)
    }
  }
})

export const {
  addPost,
  addPosts,
  updatePost,
  removePost,
  postsLoading,
  postsLoaded
} = postsSlice.actions

// 自动生成的 selectors
export const {
  selectById: selectPostById,
  selectIds: selectPostIds,
  selectEntities: selectPostEntities,
  selectAll: selectAllPosts,
  selectTotal: selectTotalPosts
} = postsAdapter.getSelectors(state => state.posts)

export default postsSlice.reducer
```

---

## 🎨 完整示例：博客应用

### 1. 定义 Schema

```javascript
// schemas/postSchema.js
import { schema } from 'normalizr'

const user = new schema.Entity('users')
const comment = new schema.Entity('comments', {
  author: user
})
export const post = new schema.Entity('posts', {
  author: user,
  comments: [comment]
})
```

### 2. API 调用和规范化

```javascript
// services/api.js
import { normalize } from 'normalizr'
import { post as postSchema } from '../schemas/postSchema'

export const fetchPost = async (postId) => {
  const response = await fetch(`/api/posts/${postId}`)
  const data = await response.json()
  
  // 规范化数据
  return normalize(data, postSchema)
}
```

### 3. Redux Slice

```javascript
// slices/postsSlice.js
import { createSlice, createEntityAdapter } from '@reduxjs/toolkit'
import { fetchPost } from '../services/api'

const postsAdapter = createEntityAdapter()
const usersAdapter = createEntityAdapter()
const commentsAdapter = createEntityAdapter()

const initialState = {
  posts: postsAdapter.getInitialState(),
  users: usersAdapter.getInitialState(),
  comments: commentsAdapter.getInitialState(),
  loading: false,
  error: null
}

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    // 可以添加同步操作
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPost.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.loading = false
        
        // 解构规范化后的数据
        const { posts, users, comments } = action.payload.entities
        
        // 批量添加到各自的 adapter
        if (posts) postsAdapter.upsertMany(state.posts, posts)
        if (users) usersAdapter.upsertMany(state.users, users)
        if (comments) commentsAdapter.upsertMany(state.comments, comments)
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  }
})

export default blogSlice.reducer
```

### 4. Selector 和组件使用

```javascript
// selectors/blogSelectors.js
import { createSelector } from '@reduxjs/toolkit'
import { postsAdapter, usersAdapter, commentsAdapter } from '../slices/blogSlice'

// 基础 selectors
const selectPostsState = state => state.blog.posts
const selectUsersState = state => state.blog.users
const selectCommentsState = state => state.blog.comments

// 使用 adapter 的 selectors
export const selectAllPosts = postsAdapter.getSelectors(selectPostsState).selectAll
export const selectPostById = (state, postId) => 
  postsAdapter.getSelectors(selectPostsState).selectById(state, postId)

// 派生 selector：获取帖子及其作者和评论
export const selectPostWithDetails = createSelector(
  [
    (state, postId) => selectPostById(state, postId),
    selectUsersState,
    selectCommentsState
  ],
  (post, usersState, commentsState) => {
    if (!post) return null
    
    const author = usersAdapter.getSelectors(() => usersState).selectById(post.author)
    const postComments = (post.comments || []).map(commentId =>
      commentsAdapter.getSelectors(() => commentsState).selectById(commentId)
    ).filter(Boolean)
    
    return {
      ...post,
      author,
      comments: postComments
    }
  }
)
```

```javascript
// components/PostDetail.js
import React from 'react'
import { useSelector } from 'react-redux'
import { selectPostWithDetails } from '../selectors/blogSelectors'

function PostDetail({ postId }) {
  const post = useSelector(state => selectPostWithDetails(state, postId))
  
  if (!post) return <div>Loading...</div>
  
  return (
    <div>
      <h1>{post.title}</h1>
      <p>Author: {post.author?.name}</p>
      <div>
        {post.comments.map(comment => (
          <div key={comment.id}>
            <p>{comment.text}</p>
            <small>By: {comment.author?.name}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## ⚡ 性能优势对比

| 操作 | 非规范化 | 规范化 |
|------|---------|--------|
| **查找实体** | O(n) 遍历数组 | O(1) 对象访问 |
| **更新实体** | 需要深拷贝嵌套结构 | 只更新一处 |
| **删除实体** | 需要过滤嵌套数组 | 简单的 delete 操作 |
| **数据一致性** | 容易出现不一致 | 单一数据源 |
| **内存占用** | 数据冗余 | 无冗余 |

---

## 📝 总结

### 规范化的关键点：

1. **像数据库一样思考**：每个实体类型独立存储
2. **使用 ID 作为键**：快速查找和更新
3. **通过引用关联**：存储 ID 而非完整对象
4. **保持扁平结构**：避免深层嵌套

### 何时使用规范化：

✅ **适合**：
- 数据有复杂关联关系
- 需要频繁更新和查询
- 数据来自 API 且有嵌套结构
- 多个组件共享相同数据

❌ **不适合**：
- 简单的表单数据
- 临时的 UI 状态
- 数据结构非常简单且不共享

### 推荐工具：

1. **normalizr**：手动规范化现有数据
2. **Redux Toolkit + createEntityAdapter**：最推荐，自动生成 CRUD 操作和 selectors
3. **reselect**：配合使用，缓存派生数据

规范化是构建可维护、高性能 Redux 应用的关键实践！🚀