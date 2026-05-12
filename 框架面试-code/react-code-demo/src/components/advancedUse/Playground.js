import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';

export default function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // 这里捕获的是初始的 count 值（0）
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(id);
  }, []); // 依赖项为空数组

  // 问题：count 永远是 1，因为闭包捕获了初始值

  // 解决方案：使用函数式更新
  //   useEffect(() => {
  //     const id = setInterval(() => {
  //       setCount(c => c + 1); // 使用前一个状态
  //     }, 1000);

  //     return () => clearInterval(id);
  //   }, []);

  return count;
}
