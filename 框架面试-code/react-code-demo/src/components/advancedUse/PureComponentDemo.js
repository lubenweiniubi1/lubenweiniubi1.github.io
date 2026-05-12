import React from 'react';
import { flushSync } from 'react-dom';

export default class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0, data: ['a', 'b', 'c'] };
    console.log('con');
  }

  handleClick = () => {
    this.setState({
      count: this.state.count + 1,
    });
  };

  render() {
    return (
      <div>
        <ComponentB data={this.state.data} />
        <p>Count: {this.state.count}</p>
        <button onClick={this.handleClick}>Increment</button>
      </div>
    );
  }
}

class ComponentB extends React.PureComponent {
  render() {
    console.log('sub render?', this.props);
    // 如果 data 引用变了，即使内容一样。这里会打印两次
    // 因为 Pure 比较的是 this.props 的第一层，这里 props = {data: xxx}, 而不是单独比较 this.props.data

    // 这里会 work 的场景是当父组件的 state 更新时，Component B 所有props都没有变，引用也没变，则 Component B 不会重新渲染
    // old props: { data: [1,2,3] }
    // new props: { data: 引用和old props一样 }
    return <h1>hello</h1>;
  }
}
