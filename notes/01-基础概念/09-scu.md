[← 返回笔记目录](/) 

---

# shouldComponentUpdate

react 默认更新逻辑：

- 父组件更新，子组件无条件更新,这里的更新可能不改变dom，但是会走一遍完整的更新周期

对应的， SCU 默认返回 true

## PureComponent

- PureComponent,SCU 中实现了浅比较
- 浅比较已使用大部分情况（尽量不要做深度比较）

## Memo

- memo，函数组件中的 PureComponent


