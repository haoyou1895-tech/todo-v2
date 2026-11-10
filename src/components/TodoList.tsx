/**
 * W11 实验 · TodoList（只负责「渲染成什么样」，不碰数据）
 *
 * 这里刻意保留两条分支：空列表提示 + 正常列表。
 * 空状态文案依赖 filter，所以要同时接 todos 和 filter 两个 props；
 * totalCount 是为了区分「一条都没有」和「筛出来一条都没有」—— 这两种空白对用户的意义完全不同。
 */

import type { Todo } from '../todo';
import type { Filter } from './TodoApp';
import TodoItem from './TodoItem';

interface TodoListProps {
  readonly todos: readonly Todo[];
  readonly filter: Filter;
  readonly totalCount: number;
  readonly onToggle: (id: number) => void;
  readonly onRemove: (id: number) => void;
  readonly onEdit: (id: number) => void;
}

function emptyText(filter: Filter, totalCount: number): string {
  if (totalCount === 0) return '暂无待办，添加一条吧';
  if (filter === 'done') return '还没有已完成的任务';
  return '当前筛选下没有任务';
}

export default function TodoList({
  todos,
  filter,
  totalCount,
  onToggle,
  onRemove,
  onEdit,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <ul className="todo-list">
        <li className="todo-list__empty">{emptyText(filter, totalCount)}</li>
      </ul>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        // key 用业务 id，不用数组下标：下标会随删除变化，React 会错认成「同一项内容变了」，
        // 表现就是删掉中间一条后，下面几条的选中态 / 输入态错位。
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onRemove={onRemove}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}
