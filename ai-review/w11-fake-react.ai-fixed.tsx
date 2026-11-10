/**
 * W11 任务 3 · AI 的第一版修复（原样存证，未做任何修改）
 *
 * 我的 Prompt 只说了「改成符合 React 规范、不要直接操作 DOM」，
 * 它就按字面改了：删 listRef、删 innerHTML、map 换成不可变更新、补了删除。
 * 下面 5 条是我审查后判定为「不能直接收」的地方，见记录第三节。
 */

import { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');

  function handleAdd() {
    if (text.trim() === '') return;
    const newTodo: Todo = { id: Date.now(), text, completed: false };
    // 残留 ①：直接用闭包里的 todos 拼新数组，没有走函数式更新
    setTodos([...todos, newTodo]);
    setText('');
    // 残留 ②：修完主流程，又用 DOM API 把「自动聚焦」请回来了
    document.getElementById('todo-input')?.focus();
  }

  function handleToggle(id: number) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function handleDelete(id: number) {
    setTodos(todos.filter((t) => t.id !== id));
  }

  return (
    <div>
      <input
        id="todo-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handleAdd}>添加</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span onClick={() => handleToggle(todo.id)}>
              {todo.text} {todo.completed ? '✔' : ''}
            </span>
            <button onClick={() => handleDelete(todo.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
