import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';

export default function Example() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    console.log('点击前:', count);
    setCount(0);  // 值相同
    console.log('点击后:', count);
  };
  
  console.log('组件重新渲染');  // 只在首次渲染时执行
  return (
    <button onClick={handleClick}>
      Count: {count}
    </button>
  );
}
