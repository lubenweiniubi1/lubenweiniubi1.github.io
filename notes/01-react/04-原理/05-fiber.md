课程连接：
https://www.bilibili.com/video/BV1TXnQzhEYU/?spm_id_from=333.337.search-card.all.click&vd_source=d66a6fb5cb08fa8db4dd3bf2bd839f71

https://www.bilibili.com/video/BV1YpSsBEEaQ?spm_id_from=333.788.videopod.sections&vd_source=d66a6fb5cb08fa8db4dd3bf2bd839f71


# 学习 React 源码重点提要：

1. 自顶向下粗略了解思想：整体项目架构
2. 关键包与职责：react、react-dom、react-reconciler、scheduler
3. 演进过程：expirationTime -> lanes, stack reconciler -> fiber
4. 数据结构与算法：小根堆、链表、栈、树，调和算法、位运算、dfs.


---


# 简单的本质
## 简单的监听器
```js
// 数据
let count = 0;

// 事件，通过事件去驱动数据的更新
// events、actions
window.addEventListener(
  "click",
  () => {
    count++;
    render();
  },
  false
);

// 当我们数据变化了，是不是要将 render 函数重新调用

// 需要将新数据渲染到页面中
const render = () => {
  document.body.innerHTML = count;
};

// 视图初始化
render();
```

这里有个问题，render 和事件监听器是耦合在一起的，事件监听器里直接调用 render 函数，这样就导致了**数据和视图的耦合**。

## 调度器
这里我们利用 [window.requestIdleCallback]() 来实现一个简单的调度器，来解耦数据和视图的关系。

```js
// 数据
let count = 0;

// 事件，通过事件去驱动数据的更新
// events、actions
window.addEventListener(
  "click",
  () => {
    count++;
    // render();
  },
  false
);

// 当我们数据变化了，是不是要将 render 函数重新调用

// 需要将新数据渲染到页面中
const render = () => {
  document.body.innerHTML = count;
};

// 视图初始化
render();

// 调度器
const workLoop = () => {
  // 1. 执行任务
  render();
  // 2. 空闲的时候继续调度，继续调度
  requestIdleCallback(workLoop);
}

workLoop();

```

这样，数据、事件、视图、调度器就解耦了（没有直接联系了），事件监听器里只负责更新数据，调度器负责在空闲时调用 render 函数来更新视图。