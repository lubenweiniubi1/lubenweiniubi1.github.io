
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

这样，数据、事件、视图、调度器就解耦了（没有直接联系了），事件监听器里只负责更新数据，调度器负责在空闲时调用 render 函数来更新视图。 workLoop 非常频繁

### 为什么 react 团队没有使用 requestIdleCallback 和 scheduler.postTask(() => console.log(111))  ??
+ Safari 长期不支持：直到 Safari 15.4（2022年3月）才支持
+ iOS Safari 兼容性差：移动端用户体验无法保证
+ IE 完全不支持：需要广泛的浏览器支持

react 自己开发了一个包 scheduler

```js
// React Scheduler 的核心实现
function scheduleCallback(priorityLevel, callback) {
  // 1. 创建任务
  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime: getCurrentTime(),
    expirationTime: startTime + timeoutForPriorityLevel(priorityLevel),
  };
  
  // 2. 插入最小堆任务队列
  push(taskQueue, newTask);
  
  // 3. 使用 MessageChannel 触发调度
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);
  }
  
  return newTask;
}
```

+ 最小堆（Min Heap）：高效管理任务优先级
+ MessageChannel：比 setTimeout/microtask 更精确的调度
+ 时间切片：每个任务执行 ~5ms 后检查是否需要让出主线程
+ 过期时间机制：确保高优先级任务不会被饿死


回到代码，rerender不能一直跑，需要在更新的时候rerender，判断变没变的过程，这个就是 diff 

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

// + 借助辅助数据来diff
let prevCount = count


const reconcile = () => {
  if(prevCount !== count) {
    render()
    prevCount = count
  }
}


// 调度器
const workLoop = () => {
  // 1. 执行任务
+  reconcile();
  // 2. 空闲的时候继续调度，继续调度
  requestIdleCallback(workLoop);
}

```

所以 react 有三大元素：
+ 状态
+ 事件
+ 渲染


# react 最终架构
## `react-reconciler`

```js
// 数据
const queue = []
let index = 0

const useState = (initialState) => {
  queue.push(initialState)

  const update = (state) => {
    // 为什么在react中hooks 不能写在判断里
    index++
    queue.push(state)
  }

  return [queue[index], update]
}


const [count, setCount] = useState(0)


let prevCount = count
const reconcile = () => {
  // diff 
  // 尽可能减少更新
  // 增加复用
  if (prevCount !== queue[index]) {
    render()
    prevCount = queue[index]
  }
}
```

## `react-dom`
用来处理端的事情。浏览器相关 api 'react-dom'； 夸端开发用 'react-native' ; 3D 开发 ’react-three-fiber'
```js
// 需要将新数据渲染到页面中
const render = () => {
  console.log('render');
  console.log(queue);
  

  document.body.innerHTML =  queue[index];
};

// 视图初始化
render();
```

##  `scheduler`
优先级调度，因为requestidlecallback ， scheduler 都无法满足一旦有了优先级，你需要知道当下什么任务最紧急
expirationTime 无法满足 -> lanes 模型可以
```js
// 调度器，空闲的时候运行
const workLoop = () => {
  // 1. 执行任务
  reconcile()
  // 2. 空闲的时候继续调度，继续调度
  requestIdleCallback(workLoop);
}

workLoop(); 
```

## `react`

react 包具体是为了给外部开发者提供接口协议


所以 react 源码阅读过程，各个包理解顺序

1. react-dom
  - createRoot, createContainer
  - render, updateContainer
2. react
  - useState
  - useEffect 都来自于 react hooks
3. react-reconciler
  - createFiberRoot
  - initializeUpdateQueue
  - 创建更新对象 createUpdate, 加入到更新队列
4. scheduler