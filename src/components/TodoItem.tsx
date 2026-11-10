/**
 * W11 实验 · TodoItem（最末端的展示组件）
 *
 * V3 里这一段是靠 closest('[data-action="delete"]') 判断「点到的是哪个按钮」的，
 * 本质是「让 DOM 结构替我记住事件语义」。React 里换成正统做法：
 * 事件挂在真正该响应的元素上，按钮自己 stopPropagation，行点击才切换完成态。
 * 这样「点行 = 切换」「点按钮 = 只做按钮的事」两条规则写在 JSX 里，一眼能读出来。
 *
 * React.memo：只有 props 全等才跳过重渲染。
 * 注意它生效的前提是父组件传下来的回调引用真的稳定（TodoApp 里 toggle / remove 是空依赖 useCallback）；
 * 如果父组件写 onClick={() => onRemove(todo.id)} 这种内联箭头，memo 会每次判不等，等于白写。
 */

import { memo } from 'react';
import type { Todo } from '../todo';

interface TodoItemProps {
  readonly todo: Todo;
  readonly onToggle: (id: number) => void;
  readonly onRemove: (id: number) => void;
  readonly onEdit: (id: number) => void;
}

function TodoItem({ todo, onToggle, onRemove, onEdit }: TodoItemProps) {
  return (
    <li
      className={todo.completed ? 'todo-list__item done' : 'todo-list__item'}
      onClick={() => onToggle(todo.id)}
    >
      <span className="todo-list__text">{todo.text}</span>

      <button
        className="todo-list__edit"
        type="button"
        aria-label={`修改：${todo.text}`}
        onClick={(event) => {
          // 不加这一句，点「改」会先冒泡到 li，顺手把状态切了 —— 这是事件冒泡最典型的坑
          event.stopPropagation();
          onEdit(todo.id);
        }}
      >
        改
      </button>

      <button
        className="todo-list__del"
        type="button"
        aria-label={`删除：${todo.text}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove(todo.id);
        }}
      >
        ×
      </button>
    </li>
  );
}

export default memo(TodoItem);
