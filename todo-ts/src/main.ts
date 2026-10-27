/**
 * W9 实验 · 视图层（DOM 绑定 + 事件委托）
 *
 * 与 W8/V2.1 的差别只在于「类型」：
 * 1. 所有 querySelector 结果先 instanceof 收窄到具体元素类型，再使用 —— 不用 `!`、不用 `as`；
 * 2. e.target 是 EventTarget，没有 dataset，先 instanceof Element 收窄；
 * 3. dataset.id 用 parseTodoId 转换 + 校验，不合格直接 return，不把脏值带进数据层。
 */

import {
  addTodo,
  parseStoredTodos,
  parseTodoId,
  removeTodo,
  toggleTodo,
  type Todo,
} from './todo';

const STORAGE_KEY = 'todos';

function getListElement(): HTMLUListElement {
  const el = document.querySelector('#todo-list');
  if (!(el instanceof HTMLUListElement)) {
    throw new Error('页面缺少 #todo-list');
  }
  return el;
}

function getInputElement(): HTMLInputElement {
  const el = document.querySelector('#todo-input');
  if (!(el instanceof HTMLInputElement)) {
    throw new Error('页面缺少 #todo-input');
  }
  return el;
}

function getAddButton(): HTMLButtonElement {
  const el = document.querySelector('#add-btn');
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error('页面缺少 #add-btn');
  }
  return el;
}

const list = getListElement();
const input = getInputElement();
const addBtn = getAddButton();
const filterBtns: NodeListOf<HTMLButtonElement> = document.querySelectorAll('.todo-filter__btn');

type Filter = 'all' | 'active' | 'done';

let todos: Todo[] = parseStoredTodos(localStorage.getItem(STORAGE_KEY));
let filter: Filter = 'all';

function save(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function isFilter(value: string | undefined): value is Filter {
  return value === 'all' || value === 'active' || value === 'done';
}

function render(): void {
  list.innerHTML = '';

  const shown = todos.filter((t) => {
    if (filter === 'all') return true;
    if (filter === 'done') return t.completed;
    return !t.completed;
  });

  if (shown.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'todo-list__empty';
    empty.textContent = filter === 'done' ? '还没有已完成的任务' : '暂无待办，添加一条吧';
    list.appendChild(empty);
  }

  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'todo-list__item';
    li.dataset.id = String(t.id);
    if (t.completed) li.classList.add('done');

    const text = document.createElement('span');
    text.className = 'todo-list__text';
    text.textContent = t.text;

    const editBtn = document.createElement('button');
    editBtn.className = 'todo-list__edit';
    editBtn.type = 'button';
    editBtn.dataset.action = 'edit';
    editBtn.textContent = '改';

    const delBtn = document.createElement('button');
    delBtn.className = 'todo-list__del';
    delBtn.type = 'button';
    delBtn.dataset.action = 'delete';
    delBtn.textContent = '×';

    li.append(text, editBtn, delBtn);
    list.appendChild(li);
  }

  filterBtns.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.filter === filter);
  });
}

function commit(next: Todo[]): void {
  todos = next;
  save();
  render();
}

function editTodo(id: number): void {
  const current = todos.find((t) => t.id === id);
  if (current === undefined) return;

  const input2 = prompt('修改任务内容', current.text);
  if (input2 === null) return;

  const next = addTodo(removeTodo(todos, id), input2, id);
  if (next.length === todos.length) return;

  commit(next);
}

list.addEventListener('click', (e: MouseEvent) => {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const item = target.closest('li');
  if (!(item instanceof HTMLLIElement)) return;
  if (!list.contains(item)) return;

  const id = parseTodoId(item.dataset.id);
  if (id === null) return;

  const delBtn = target.closest('[data-action="delete"]');
  const editBtn = target.closest('[data-action="edit"]');

  if (delBtn !== null && item.contains(delBtn)) {
    commit(removeTodo(todos, id));
  } else if (editBtn !== null && item.contains(editBtn)) {
    editTodo(id);
  } else {
    commit(toggleTodo(todos, id));
  }
});

addBtn.addEventListener('click', () => {
  const next = addTodo(todos, input.value);
  if (next.length === todos.length) return;

  commit(next);
  input.value = '';
  input.focus();
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const value = btn.dataset.filter;
    if (!isFilter(value)) return;
    filter = value;
    render();
  });
});

render();
