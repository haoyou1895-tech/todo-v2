/**
 * W11 实验 · 应用根组件
 *
 * 一段话讲清 V4.0 的架构：状态只有两份（todos / filter），都住在 TodoApp 里；
 * 数据一路向下传（props），事件一路向上抛（callback），中间没有任何组件自己去摸 DOM。
 *
 * 三条从 W9/W10 继承下来的约束没有被 React 冲掉：
 * 1. 业务规则仍然只在 todo.ts 那组纯函数里 —— 组件只负责「什么时候调」，不负责「怎么判」。
 *    所以 W9 手写的 33 条测试一行都不用改，这就是轨道 A 能复用的根本原因。
 * 2. 不可变更新仍然由纯函数保证（返回值是新数组），组件里没有一处 push / splice。
 * 3. 脏数据入口仍然是 localStorage，仍然走 parseStoredTodos 逐条校验，坏数据进不了 State。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addTodo,
  nextTodoId,
  parseStoredTodos,
  removeTodo,
  toggleTodo,
  updateTodo,
  type Todo,
} from '../todo';
import TodoForm from './TodoForm';
import TodoList from './TodoList';

export type Filter = 'all' | 'active' | 'done';

const STORAGE_KEY = 'todos';

function isFilter(value: string): value is Filter {
  return value === 'all' || value === 'active' || value === 'done';
}

/**
 * 按筛选条件派生可见列表。
 * 刻意不把「可见列表」也放进 State —— 它是 todos + filter 的派生值，
 * 存一份就等于给自己留一条「两份数据不同步」的后路（V3 里 render() 每次重算，同理）。
 */
function filterTodos(todos: readonly Todo[], filter: Filter): Todo[] {
  if (filter === 'all') return [...todos];
  if (filter === 'done') return todos.filter((t) => t.completed);
  return todos.filter((t) => !t.completed);
}

export default function TodoApp() {
  // 惰性初始化：只在首次挂载时读一次 localStorage。
  // 写成 useState(parseStoredTodos(localStorage.getItem(...))) 会在每次渲染都解析一遍 JSON，
  // 结果被丢掉，纯属白跑（这是 AI 写 React 时最常见的性能写法错误之一）。
  const [todos, setTodos] = useState<Todo[]>(() => parseStoredTodos(localStorage.getItem(STORAGE_KEY)));
  const [filter, setFilter] = useState<Filter>('all');
  // 添加成功后把光标送回输入框。
  // 这件事用 ref 做，不用 document.getElementById —— 功能留着，写法换掉。
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 副作用只放在这里：State 变了才写盘。绝不在 render 里写 localStorage。
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  /**
   * 添加：这里有意用「先算 next 再 set」，而不是 setTodos(prev => ...)。
   * 因为表单需要知道「这条到底有没有加进去」才能决定要不要清空输入框，
   * 而 updater 是纯函数、不允许产生副作用，也拿不到返回值。
   * 代价是这个函数依赖 todos，不能塞进空依赖的 useCallback —— 取舍写在记录里了。
   */
  const handleAdd = useCallback(
    (text: string): boolean => {
      const next = addTodo(todos, text, nextTodoId(todos));
      if (next.length === todos.length) return false;

      setTodos(next);
      inputRef.current?.focus();
      return true;
    },
    [todos],
  );

  // 切换 / 删除只依赖 prev，所以可以放心用函数式更新 + 空依赖。
  // 这样传给 TodoItem 的引用永远稳定，React.memo 才真的有意义（否则 memo 等于没写）。
  const handleToggle = useCallback((id: number) => {
    setTodos((prev) => toggleTodo(prev, id));
  }, []);

  const handleRemove = useCallback((id: number) => {
    setTodos((prev) => removeTodo(prev, id));
  }, []);

  const handleEdit = useCallback(
    (id: number) => {
      const current = todos.find((t) => t.id === id);
      if (current === undefined) return;

      // 改内容的写法：调 updateTodo 原地替换。
      // 【教训】原先是「删旧 + 按原 id 加新」，配一句 `if (next.length === todos.length) return;`
      // 想表达「长度没变 = 输入非法」。可删一条 -1、加一条 +1，合法输入时长度恰好又回到原值 ——
      // 于是合法输入被判成非法直接 return（改了不生效），
      // 而非法输入时长度是 n-1，反而通过守卫写盘，等于把这条任务删掉。
      // 修改操作本来就没有长度变化，不该用长度当成功信号。
      const input = window.prompt('修改任务内容', current.text);
      if (input === null) return; // 点了取消

      const next = updateTodo(todos, id, input);
      const updated = next.find((t) => t.id === id);
      // 文本没变 = 输入非法（空 / 超长 / 没改动），不写盘，保持原状。
      if (updated === undefined || updated.text === current.text) return;

      setTodos(next);
    },
    [todos],
  );

  const visible = filterTodos(todos, filter);

  return (
    <div className="todo-app">
      <h1 className="todo-app__title">Todo 列表 · V4.0 React</h1>

      <TodoForm onAdd={handleAdd} inputRef={inputRef} />

      <div className="todo-filter">
        {(['all', 'active', 'done'] as const).map((value) => (
          <button
            key={value}
            className={value === filter ? 'todo-filter__btn is-active' : 'todo-filter__btn'}
            type="button"
            onClick={() => {
              if (isFilter(value)) setFilter(value);
            }}
          >
            {value === 'all' ? '全部' : value === 'active' ? '未完成' : '已完成'}
          </button>
        ))}
      </div>

      <TodoList
        todos={visible}
        filter={filter}
        totalCount={todos.length}
        onToggle={handleToggle}
        onRemove={handleRemove}
        onEdit={handleEdit}
      />
    </div>
  );
}
