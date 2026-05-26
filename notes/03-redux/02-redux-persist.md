# 多个 Reducer 的 Redux Toolkit 持久化配置

## 一、基础配置方式

### 1.1 使用 combineReducers 合并多个 reducer

```javascript
// store/reducers/index.js
import { combineReducers } from '@reduxjs/toolkit';
import userReducer from '../features/user/userSlice';
import cartReducer from '../features/cart/cartSlice';
import settingsReducer from '../features/settings/settingsSlice';
import productsReducer from '../features/products/productsSlice';

// 合并所有 reducer
const rootReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  settings: settingsReducer,
  products: productsReducer
});

export default rootReducer;
```

### 1.2 在 store 中使用

```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './reducers';

// 配置持久化
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user', 'cart', 'settings'] // 只持久化需要的 reducer
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
```

## 二、每个 Reducer 单独配置持久化

### 2.1 为每个 reducer 配置不同的持久化策略

```javascript
// store/reducers/index.js
import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import storageSession from 'redux-persist/lib/storage/session';
import userReducer from '../features/user/userSlice';
import cartReducer from '../features/cart/cartSlice';
import settingsReducer from '../features/settings/settingsSlice';
import authReducer from '../features/auth/authSlice';
import tempDataReducer from '../features/tempData/tempDataSlice';

// 用户数据 - 使用 localStorage 永久存储
const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['name', 'email', 'preferences']
};

// 购物车 - 使用 localStorage 永久存储
const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items', 'total']
};

// 设置 - 使用 localStorage 永久存储
const settingsPersistConfig = {
  key: 'settings',
  storage,
  whitelist: ['theme', 'language', 'notifications']
};

// 临时数据 - 使用 sessionStorage 会话存储
const tempDataPersistConfig = {
  key: 'tempData',
  storage: storageSession,
  whitelist: ['formData', 'searchHistory']
};

// 合并 reducer，部分持久化，部分不持久化
const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  cart: persistReducer(cartPersistConfig, cartReducer),
  settings: persistReducer(settingsPersistConfig, settingsReducer),
  auth: authReducer, // 不持久化（敏感信息）
  tempData: persistReducer(tempDataPersistConfig, tempDataReducer),
  products: productsReducer // 不持久化（可以从 API 重新获取）
});

export default rootReducer;
```

### 2.2 配置 store（不需要全局 persistReducer）

```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore } from 'redux-persist';
import rootReducer from './reducers';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略所有 persist 相关的 action
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER'
        ],
        // 忽略所有 reducer 中的 _persist 字段
        ignoredPaths: ['user._persist', 'cart._persist', 'settings._persist', 'tempData._persist']
      },
    }),
});

export const persistor = persistStore(store);
```

## 三、不同场景的配置示例

### 3.1 场景一：部分持久化，部分不持久化

```javascript
// store/reducers/index.js
import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from '../features/user/userSlice';
import cartReducer from '../features/cart/cartSlice';
import productsReducer from '../features/products/productsSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';

// 只持久化用户和购物车
const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['profile', 'preferences']
};

const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items']
};

const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  cart: persistReducer(cartPersistConfig, cartReducer),
  products: productsReducer, // 不持久化
  notifications: notificationsReducer // 不持久化
});

export default rootReducer;
```

### 3.2 场景二：不同存储策略混合使用

```javascript
// store/reducers/index.js
import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage
import storageSession from 'redux-persist/lib/storage/session'; // sessionStorage
import userReducer from '../features/user/userSlice';
import cartReducer from '../features/cart/cartSlice';
import checkoutReducer from '../features/checkout/checkoutSlice';

// 用户数据 - 永久存储
const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['name', 'email']
};

// 购物车 - 永久存储
const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items']
};

// 结账数据 - 会话存储（关闭页面后清除）
const checkoutPersistConfig = {
  key: 'checkout',
  storage: storageSession,
  whitelist: ['shippingInfo', 'paymentMethod']
};

const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  cart: persistReducer(cartPersistConfig, cartReducer),
  checkout: persistReducer(checkoutPersistConfig, checkoutReducer)
});

export default rootReducer;
```

### 3.3 场景三：使用 IndexedDB 存储大容量数据

```javascript
// store/reducers/index.js
import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import createIndexedDBStorage from 'redux-persist-indexeddb-storage';
import userReducer from '../features/user/userSlice';
import cacheReducer from '../features/cache/cacheSlice';

// 用户数据 - localStorage
const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['profile', 'settings']
};

// 缓存数据 - IndexedDB（大容量）
const cachePersistConfig = {
  key: 'cache',
  storage: createIndexedDBStorage('my-app-cache-db'),
  whitelist: ['images', 'documents', 'largeData']
};

const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  cache: persistReducer(cachePersistConfig, cacheReducer)
});

export default rootReducer;
```

## 四、RTK Query 与其他 reducer 混合使用

```javascript
// store/index.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { apiSlice } from '../features/api/apiSlice';
import userReducer from '../features/user/userSlice';
import cartReducer from '../features/cart/cartSlice';

// 用户数据持久化配置
const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['profile', 'preferences']
};

// 购物车持久化配置
const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items']
};

// RTK Query 持久化配置（可选）
const apiPersistConfig = {
  key: 'api',
  storage,
  whitelist: ['queries'] // 只持久化查询缓存
};

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: persistReducer(apiPersistConfig, apiSlice.reducer),
    user: persistReducer(userPersistConfig, userReducer),
    cart: persistReducer(cartPersistConfig, cartReducer)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER'
        ],
        ignoredPaths: [
          'api',
          'user._persist',
          'cart._persist'
        ]
      },
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);
```

## 五、动态控制持久化

### 5.1 根据环境条件配置

```javascript
// store/reducers/index.js
import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from '../features/user/userSlice';
import debugReducer from '../features/debug/debugSlice';

const isDevelopment = process.env.NODE_ENV === 'development';

// 开发环境不持久化调试数据
const debugPersistConfig = {
  key: 'debug',
  storage,
  whitelist: isDevelopment ? [] : ['logs'] // 开发环境不持久化
};

const rootReducer = combineReducers({
  user: persistReducer(
    { key: 'user', storage, whitelist: ['profile'] },
    userReducer
  ),
  debug: persistReducer(debugPersistConfig, debugReducer)
});

export default rootReducer;
```

### 5.2 根据用户权限配置

```javascript
// store/reducers/index.js
import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from '../features/user/userSlice';
import adminReducer from '../features/admin/adminSlice';

// 普通用户不持久化管理员数据
const adminPersistConfig = {
  key: 'admin',
  storage,
  whitelist: [] // 默认不持久化
};

const rootReducer = combineReducers({
  user: persistReducer(
    { key: 'user', storage, whitelist: ['profile'] },
    userReducer
  ),
  admin: persistReducer(adminPersistConfig, adminReducer)
});

export default rootReducer;
```

## 六、完整示例：电商应用

```javascript
// store/reducers/index.js
import { combineReducers } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import storageSession from 'redux-persist/lib/storage/session';
import userReducer from '../features/user/userSlice';
import cartReducer from '../features/cart/cartSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';
import searchReducer from '../features/search/searchSlice';
import uiReducer from '../features/ui/uiSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';

// 用户数据 - 永久存储
const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['profile', 'addresses', 'paymentMethods', 'preferences']
};

// 购物车 - 永久存储
const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items', 'coupon']
};

// 收藏夹 - 永久存储
const wishlistPersistConfig = {
  key: 'wishlist',
  storage,
  whitelist: ['items']
};

// 搜索历史 - 会话存储
const searchPersistConfig = {
  key: 'search',
  storage: storageSession,
  whitelist: ['history', 'recentSearches']
};

// UI 状态 - 会话存储
const uiPersistConfig = {
  key: 'ui',
  storage: storageSession,
  whitelist: ['sidebarOpen', 'theme', 'filters']
};

const rootReducer = combineReducers({
  user: persistReducer(userPersistConfig, userReducer),
  cart: persistReducer(cartPersistConfig, cartReducer),
  wishlist: persistReducer(wishlistPersistConfig, wishlistReducer),
  search: persistReducer(searchPersistConfig, searchReducer),
  ui: persistReducer(uiPersistConfig, uiReducer),
  notifications: notificationsReducer, // 不持久化
  products: productsReducer, // 不持久化
  orders: ordersReducer // 不持久化
});

export default rootReducer;
```

## 七、常见问题解决

### 7.1 多个 reducer 的 serializableCheck 配置

```javascript
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER'
        ],
        // 自动忽略所有 _persist 字段
        ignoredPaths: [
          'user._persist',
          'cart._persist', 
          'settings._persist',
          'wishlist._persist',
          'search._persist',
          'ui._persist'
        ]
      },
    }),
});
```

### 7.2 清除特定 reducer 的持久化数据

```javascript
import { persistor } from './store';

// 清除用户数据
export const clearUserData = async () => {
  await persistor.purgeSpecific('user');
};

// 清除购物车数据
export const clearCartData = async () => {
  await persistor.purgeSpecific('cart');
};

// 清除所有数据
export const clearAllData = async () => {
  await persistor.purge();
};
```

### 7.3 查看所有持久化的数据

```javascript
// 在浏览器控制台执行
console.log('所有 localStorage 数据:', localStorage);

// 查看特定的持久化数据
console.log('用户数据:', localStorage.getItem('persist:user'));
console.log('购物车数据:', localStorage.getItem('persist:cart'));
console.log('设置数据:', localStorage.getItem('persist:settings'));
```

## 总结

**多个 reducer 的持久化配置要点：**

1. **单独配置**：为每个需要持久化的 reducer 单独配置 persistConfig
2. **混合使用**：可以混合使用 localStorage、sessionStorage、IndexedDB
3. **选择性持久化**：使用 whitelist/blacklist 精确控制持久化字段
4. **serializableCheck**：正确配置忽略规则，避免警告
5. **灵活控制**：根据业务需求动态调整持久化策略

这样可以实现精细的持久化控制，既保证了数据持久化，又避免了不必要的存储开销。