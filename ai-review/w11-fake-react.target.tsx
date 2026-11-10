/**
 * W11 任务 3 · 靶子代码（原样贴给 AI 的那一段，未做任何修改）
 *
 * 三处「假 React」：
 * 1. listRef.push() —— 直接改 State 引用的数组，React 判定「引用没变」，不重渲染；
 * 2. setTodos(listRef) —— 传回去的还是同一个数组对象，等于没通知 React；
 * 3. listEl.innerHTML += ... —— 绕过 React 直接写 DOM，React 下次重渲染会把它抹掉。
 * 另外 handleToggle 里的 t.completed = ... 也是原地改对象，同一类病。
 */

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState('');
  let listRef = [];

  function handleAdd() {
    if (text.trim() === '') return;
    const newTodo = { id: Date.now(), text, completed: false };
    listRef = todos;
    listRef.push(newTodo);
    setTodos(listRef);
    const listEl = document.getElementById('todo-list');
    if (listEl) {
      listEl.innerHTML += `<li>${newTodo.text}</li>`;
    }
    setText('');
  }

  function handleToggle(id) {
    todos.map((t) => {
      if (t.id === id) {
        t.completed = !t.completed;
      }
    });
    setTodos(todos);
  }

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleAdd}>添加</button>
      <ul id="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} onClick={() => handleToggle(todo.id)}>
            {todo.text} {todo.completed ? '✔' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
