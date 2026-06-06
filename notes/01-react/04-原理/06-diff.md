# 深入讲解 React Diff 算法

React Diff 算法是 React 高性能渲染的核心机制，它通过智能对比新旧虚拟 DOM 树的差异，找出最小更新路径，从而避免不必要的 DOM 操作。下面我将从多个维度深入剖析这一算法。

## 一、Diff 算法的核心目标

### 1.1 为什么需要 Diff 算法？

- **真实 DOM 操作代价高昂**：每次状态变化如果都重新生成整个 DOM，性能会非常差
- **虚拟 DOM 的作用**：将真实 DOM 抽象为 JS 对象，便于在内存中进行高效对比
- **Diff 算法的价值**：找出"变化的部分"，只更新必要的 DOM 节点，避免整棵 DOM 重建

### 1.2 算法复杂度优化

传统树形对比算法的复杂度是 **O(n³)**，React 通过三大启发式假设将其优化为 **O(n)**：

```
传统树对比：O(n³) → React Diff：O(n)
```

## 二、React Diff 的三大核心策略

### 2.1 Tree Diff（树层级对比）

**核心假设**：Web UI 中 DOM 节点跨层级的移动操作特别少，可以忽略不计

**实现机制**：
- 对树进行**分层比较**，两棵树只会对**同一层次**的节点进行比较
- 通过 `updateDepth` 对 Virtual DOM 树进行层级控制
- 只对相同颜色方框内的 DOM 节点进行比较（即同一个父节点下的所有子节点）

**示例**：
```jsx
// 旧树
<div>
  <A />
  <B />
</div>

// 新树（A 被移动到 B 内）
<div>
  <B>
    <A />
  </B>
</div>
```

React 会直接销毁 A 并在新位置重新创建，而不是尝试移动节点。

### 2.2 Component Diff（组件层级对比）

**核心假设**：拥有相同类的两个组件将会生成相似的树形结构，拥有不同类的两个组件将会生成不同的树形结构

**对比规则**：
- **相同类型的组件**：保留组件实例，更新 props，触发 `componentDidUpdate` 生命周期
- **不同类型的组件**：直接销毁旧组件实例，创建新实例

```jsx
// 类型相同 - 复用组件实例
<div><ComponentA /></div> → <div><ComponentA /></div>

// 类型不同 - 重建组件
<div><ComponentA /></div> → <div><ComponentB /></div>
```

### 2.3 Element Diff（元素层级对比）

**核心假设**：对于同一层级的一组子节点，它们可以通过唯一 ID 进行区分（即 `key`）

**实现机制**：
- 对同层级的子节点进行对比
- 通过 `key` 属性快速定位需要更新的节点
- 最小化 DOM 操作

## 三、单节点 Diff 详细过程

### 3.1 单节点判断标准

当新节点是 `object`、`number`、`string` 等单一类型时，进入单节点 diff 流程。

### 3.2 对比流程

```javascript
// 伪代码实现
function reconcileSingleElement(current, workInProgress, element) {
  // 1. 检查 key 是否相同
  if (current !== null && current.key === element.key) {
    // 2. 检查 type 是否相同
    if (current.type === element.type) {
      // 复用节点，只更新 props
      return updateNode(current, workInProgress, element);
    } else {
      // type 不同，删除旧节点，创建新节点
      deleteRemainingChildren(current);
      return createNode(workInProgress, element);
    }
  } else {
    // key 不同，删除所有旧节点，创建新节点
    deleteRemainingChildren(current);
    return createNode(workInProgress, element);
  }
}
```

### 3.3 单节点 Diff 的三种情况

1. **key 相同 && type 相同** → 复用节点，更新 props
2. **key 相同 && type 不同** → 删除旧节点，创建新节点
3. **key 不同** → 删除所有旧节点，创建新节点

## 四、多节点 Diff 详细过程

### 4.1 多节点场景

当新节点是数组类型时（如 `children` 是多个元素），进入多节点 diff 流程。

### 4.2 核心算法流程

多节点 diff 采用**双指针扫描**策略，通过四个步骤进行高效对比：

```javascript
// 伪代码实现
function reconcileChildrenArray(currentFirstChild, newChildren) {
  let resultingFirstChild = null;
  let previousNewFiber = null;
  
  let oldFiber = currentFirstChild;
  let newIdx = 0;
  let nextOldFiber = null;
  
  // 第一步：处理 key 相同的节点（假设大部分节点位置不变）
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    
    const newFiber = updateSlot(oldFiber, newChildren[newIdx]);
    if (newFiber === null) {
      break; // 遇到不匹配的节点，跳出循环
    }
    
    // 删除旧节点
    if (oldFiber && newFiber.alternate === null) {
      deleteChild(oldFiber);
    }
    
    previousNewFiber = placeChild(newFiber, previousNewFiber, newIdx);
    resultingFirstChild = resultingFirstChild || newFiber;
    oldFiber = nextOldFiber;
  }
  
  // 第二步：处理剩余的新节点（新增节点）
  if (newIdx === newChildren.length) {
    deleteRemainingChildren(oldFiber);
    return resultingFirstChild;
  }
  
  // 第三步：处理剩余的旧节点（删除节点）
  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(newChildren[newIdx]);
      previousNewFiber = placeChild(newFiber, previousNewFiber, newIdx);
      resultingFirstChild = resultingFirstChild || newFiber;
    }
    return resultingFirstChild;
  }
  
  // 第四步：处理节点移动（使用 map 优化查找）
  const existingChildren = mapRemainingChildren(oldFiber);
  
  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = updateFromMap(existingChildren, newChildren[newIdx]);
    if (newFiber !== null) {
      if (newFiber.alternate !== null) {
        existingChildren.delete(newFiber.key || newIdx);
      }
      previousNewFiber = placeChild(newFiber, previousNewFiber, newIdx);
      resultingFirstChild = resultingFirstChild || newFiber;
    }
  }
  
  // 删除未匹配的旧节点
  existingChildren.forEach(child => deleteChild(child));
  
  return resultingFirstChild;
}
```

### 4.3 多节点 Diff 的四种操作

1. **Bailout（复用）**：key 和 type 都相同，复用节点
2. **Placement（插入）**：新节点在旧节点中不存在，插入新节点
3. **Deletion（删除）**：旧节点在新节点中不存在，删除旧节点
4. **Move（移动）**：节点位置发生变化，移动节点

## 五、Key 的作用和重要性

### 5.1 Key 的本质

`key` 是 React 用来**标识节点唯一性**的属性，是 Diff 算法识别节点身份的核心锚点。

### 5.2 Key 的正确使用

```jsx
// ✅ 正确：使用唯一且稳定的标识符
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// ❌ 错误：使用 index 作为 key
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

### 5.3 为什么不能用 index 作为 key？

使用 `index` 作为 key 会导致以下问题：

1. **节点复用错误**：当列表发生增删或排序时，React 会误判节点身份
2. **动画错乱**：过渡动画可能无法正确执行
3. **状态绑定错误**：如 input 的选中状态可能乱掉
4. **性能下降**：大量 DOM 需要替换，无法复用

**示例**：
```jsx
// 初始状态
[1, 2, 3] → <div key=0>1</div>, <div key=1>2</div>, <div key=2>3</div>

// 删除中间元素后
[1, 3] → <div key=0>1</div>, <div key=1>3</div>

// React 会认为：
// - key=0 的节点内容从 1 变为 1（不变）
// - key=1 的节点内容从 2 变为 3（更新）
// - key=2 的节点被删除
// 实际上应该复用 key=2 的节点！
```

## 六、Fiber 架构下的 Diff 实现

### 6.1 Fiber 节点结构

Fiber 是 React 16 引入的核心数据结构，每个 Fiber 节点包含：

```javascript
{
  // 节点类型和标识
  type: 'div' | Component,
  key: string | null,
  
  // 树结构指针
  child: Fiber | null,      // 第一个子节点
  sibling: Fiber | null,    // 下一个兄弟节点
  return: Fiber | null,     // 父节点
  
  // 双缓存机制
  alternate: Fiber | null,  // 指向另一棵树的对应节点
  
  // 副作用标记
  flags: number,            // 更新类型（插入、删除、更新等）
  
  // 其他信息
  stateNode: DOM | ComponentInstance,
  pendingProps: any,
  memoizedProps: any,
  // ...
}
```

### 6.2 Diff 发生的时机

Diff 算法发生在 **render 阶段**的 `beginWork` 和 `completeWork` 阶段：

```
beginWork（递）: 从根节点向下遍历，对比子节点
completeWork（归）: 从叶子节点向上归并，标记副作用
```

### 6.3 核心函数

```javascript
// reconcileChildren - 协调子节点
function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    // 首次渲染
    workInProgress.child = mountChildFibers(workInProgress, nextChildren);
  } else {
    // 更新渲染
    workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren);
  }
}

// reconcileChildFibers - 执行 diff 算法
function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
  // 判断是单节点还是多节点
  const isObject = typeof newChild === 'object' && newChild !== null;
  
  if (isObject) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        return reconcileSingleElement(returnFiber, currentFirstChild, newChild);
      case REACT_FRAGMENT_TYPE:
        return reconcileChildrenArray(returnFiber, currentFirstChild, newChild.props.children);
    }
  }
  
  if (isArray(newChild)) {
    return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
  }
  
  // 处理文本节点等
  return reconcileSingleTextNode(returnFiber, currentFirstChild, newChild);
}
```

## 七、双缓存机制（Double Buffering）

### 7.1 双缓存的概念

React 在内存中同时维护两棵 Fiber 树：

- **Current Tree**：当前屏幕上显示内容对应的 Fiber 树
- **WorkInProgress Tree**：正在内存中构建的、下一次要更新的 Fiber 树

### 7.2 工作流程

```
1. 状态变更触发更新
2. 基于 current 树构建 workInProgress 树
3. 在 workInProgress 树上执行 diff 算法
4. 标记需要更新的节点（副作用）
5. 提交阶段：交换指针，workInProgress 树成为新的 current 树
6. 将副作用应用到真实 DOM
```

### 7.3 指针交换

```javascript
// 提交阶段的指针交换
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 交换 current 指针
  root.current = finishedWork;
  
  // 应用副作用到 DOM
  commitMutationEffects(finishedWork);
}
```

## 八、性能优化和最佳实践

### 8.1 优化策略

1. **使用稳定的 key**：确保 key 唯一且稳定
2. **避免不必要的重渲染**：使用 `React.memo`、`useMemo`、`useCallback`
3. **合理拆分组件**：减小 diff 的范围
4. **使用 key 优化列表操作**：特别是在列表增删改查频繁的场景

### 8.2 常见陷阱

```jsx
// ❌ 避免在 render 中创建新对象/函数
function Component() {
  return <Child style={{ color: 'red' }} onClick={() => {}} />;
}

// ✅ 优化：使用 useMemo/useCallback
function Component() {
  const style = useMemo(() => ({ color: 'red' }), []);
  const handleClick = useCallback(() => {}, []);
  return <Child style={style} onClick={handleClick} />;
}

// ❌ 避免使用 index 作为 key
{items.map((item, index) => <Item key={index} />)}

// ✅ 使用唯一标识符
{items.map(item => <Item key={item.id} />)}
```

### 8.3 Diff 算法的局限性

1. **跨层级移动**：不优化跨层级的 DOM 移动
2. **列表反转**：大量节点位置变化时性能较差
3. **深度嵌套**：过深的组件树会影响 diff 效率

## 九、总结

React Diff 算法通过三大核心策略（Tree Diff、Component Diff、Element Diff）将传统 O(n³) 的树形对比优化为 O(n)，其核心在于：

1. **分层对比**：只对比同层级节点
2. **类型判断**：不同类型直接重建
3. **Key 标识**：通过唯一 key 快速定位节点
4. **双缓存机制**：通过两棵树的切换实现高效更新
