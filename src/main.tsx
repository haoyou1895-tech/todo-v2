import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TodoApp from './components/TodoApp';

/**
 * W11：入口文件从 main.ts 变成 main.tsx。
 * 差别只有一句 —— 不再querySelector 找一堆元素然后往上面挂监听，
 * 而是把整个应用交给 React：给它一个容器，剩下的 DOM 由 React 自己建、自己改。
 */

document.title = import.meta.env.VITE_APP_TITLE;

const rootElement = document.getElementById('root');
// 不用非空断言 `!`：容器找不到就明确报错，不让 undefined 流进 createRoot
if (rootElement === null) {
  throw new Error('页面缺少 #root 容器');
}

createRoot(rootElement).render(
  // StrictMode 在开发环境会把 render 和 updater 各跑两遍，专门用来暴露「副作用写在 render 里」的代码
  <StrictMode>
    <TodoApp />
  </StrictMode>,
);
