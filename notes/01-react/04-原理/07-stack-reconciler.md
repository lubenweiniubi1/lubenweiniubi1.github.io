# 基本信息
在 React 16 之前，协调过程中，**当前的虚拟 DOM 树（旧树）是和新生成的虚拟 DOM 树（新树）进行对比**。

具体流程：
1. 状态/props 变化 → 重新 render 生成**新虚拟 DOM 树**
2. 将**新虚拟 DOM 树**与**当前虚拟 DOM 树**进行深度优先递归对比
3. 找出差异后，同步更新真实 DOM

所以对比双方是：**旧 vdom 树 vs 新 vdom 树**（不是和真实 DOM 对比）。

## 也就是说，15 也有两棵树
是的，你说得对！

**React 15 也有两棵树**：
- **旧虚拟 DOM 树**（当前树）
- **新虚拟 DOM 树**（重新 render 生成的树）

**关键区别**：

| 特性 | React 15（Stack） | React 16+（Fiber） |
|------|------------------|-------------------|
| 树的类型 | 普通 JS 对象 | Fiber 节点（链表结构） |
| 对比方式 | 同步递归（不可中断） | 异步迭代（可中断） |
| 树的关系 | 独立两棵树 | 双缓存（alternate 指针） |
| 内存管理 | 新树完成后旧树被丢弃 | 两棵树相互引用，复用节点 |

所以 React 15 确实有两棵树，但没有 Fiber 架构中的**双缓存机制**和**可中断渲染**能力。


# fiber 双缓存跟 stack reconciler 两颗 v dom 树这个的区别
**核心区别在于：两棵树之间是否有指针关联和节点复用机制**

---

## React 15 的两棵树（无关联）

```javascript
// 旧树
const oldTree = {
  type: 'div',
  children: [...]
};

// 新树（完全独立创建）
const newTree = {
  type: 'div',
  children: [...]  // 全新创建的数组
};

// 对比完成后
oldTree = null;      // 旧树被垃圾回收
currentTree = newTree; // 新树成为当前树
```

**特点**：
- ❌ 两棵树完全独立，没有关联
- ❌ 对比完成后旧树被丢弃，新树完全重建
- ❌ 每次更新都需要重新创建整棵树的节点

---

## React 16+ Fiber 的双缓存（指针关联）

```javascript
// Fiber 节点结构
const fiberNode = {
  type: 'div',
  alternate: null,  // 指向另一棵树的对应节点
  
  // ... 其他属性
};

// 初始状态
currentFiber.alternate = null;

// 创建 workInProgress 时
workInProgressFiber = createWorkInProgress(currentFiber);
// 建立双向关联
workInProgressFiber.alternate = currentFiber;
currentFiber.alternate = workInProgressFiber;
```

**特点**：
- ✅ 两棵树通过 `alternate` 指针双向关联
- ✅ 节点可以复用，只需交换指针
- ✅ 切换成本极低（只是改个指针）

---

## 对比示意图

### React 15（无关联）
```
更新前:
currentTree → [树A]

更新时:
currentTree → [树A]  (旧)
newTree     → [树B]  (新，独立创建)

更新后:
currentTree → [树B]  (树A被GC)
```

### React 16+ Fiber（双缓存）
```
更新前:
current → [Fiber树A]
         ↕ alternate
wip     → null

更新时:
current → [Fiber树A]
         ↕ alternate (双向指针)
wip     → [Fiber树B]  (复用节点，只改属性)

更新后:
current → [Fiber树B]  (指针交换，几乎零成本)
         ↕ alternate
wip     → [Fiber树A]  (变成下一次的wip)
```

---

## 关键区别总结

| 维度 | React 15 | React 16+ Fiber |
|------|----------|-----------------|
| **树的关系** | 独立两棵树 | 通过 `alternate` 指针关联 |
| **节点复用** | ❌ 每次重建 | ✅ 节点复用，只更新属性 |
| **切换成本** | 高（重新构建） | 极低（交换指针） |
| **内存效率** | 低（频繁创建/销毁） | 高（节点池复用） |
| **可中断性** | ❌ 同步递归 | ✅ 异步可中断 |

**本质**：Fiber 的双缓存不仅是"有两棵树"，更重要的是**两棵树之间的指针关联机制**，这使得节点复用和高效切换成为可能。
