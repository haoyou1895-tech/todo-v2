/**
 * W9 实验 · 任务 2：手写单元测试（不使用 AI 生成）
 *
 * 三条自律规则：
 * 1. 测试数据一律建在 test() 内部 —— 用例之间不共享任何数组，避免互相污染；
 * 2. 断言到具体业务结果（text / completed / id），不用 toBeDefined 这类弱断言；
 * 3. 边界用例的期望值来自业务契约，不来自当前实现。
 */

import { describe, expect, test } from 'vitest';
import {
  MAX_TEXT_LENGTH,
  addTodo,
  parseStoredTodos,
  parseTodoId,
  removeTodo,
  toggleTodo,
  todosFromUnknown,
  type Todo,
} from './todo';

describe('addTodo', () => {
  test('正常添加：长度 +1，且文本与输入完全一致', () => {
    const todos: Todo[] = [];

    const next = addTodo(todos, '学习TS', 1);

    expect(next.length).toBe(1);
    expect(next[0].text).toBe('学习TS');
    expect(next[0].id).toBe(1);
    expect(next[0].completed).toBe(false);
  });

  test('正常添加：不修改传入的原数组（不可变约束）', () => {
    const todos: Todo[] = [{ id: 1, text: '已有任务', completed: false }];

    const next = addTodo(todos, '新任务', 2);

    expect(next.length).toBe(2);
    expect(todos.length).toBe(1);
    expect(todos[0].text).toBe('已有任务');
  });

  test('首尾空白：入库前被 trim，存的是干净文本', () => {
    const todos: Todo[] = [];

    const next = addTodo(todos, '  学习TS  ', 1);

    expect(next.length).toBe(1);
    expect(next[0].text).toBe('学习TS');
  });

  test('纯空格：拦截，长度不变', () => {
    const todos: Todo[] = [];

    const next = addTodo(todos, '   ', 1);

    expect(next.length).toBe(0);
  });

  test('空字符串：拦截，长度不变', () => {
    const todos: Todo[] = [];

    const next = addTodo(todos, '', 1);

    expect(next.length).toBe(0);
  });

  test(`边界：恰好 ${MAX_TEXT_LENGTH} 字允许入库，${MAX_TEXT_LENGTH + 1} 字被拦截`, () => {
    const todos: Todo[] = [];

    const allowed = addTodo(todos, 'a'.repeat(MAX_TEXT_LENGTH), 1);
    const rejected = addTodo(todos, 'a'.repeat(MAX_TEXT_LENGTH + 1), 2);

    expect(allowed.length).toBe(1);
    expect(allowed[0].text.length).toBe(MAX_TEXT_LENGTH);
    expect(rejected.length).toBe(0);
  });

  test('维度1（空值）：传入 null，运行时兜底拦截', () => {
    const todos: Todo[] = [];

    // @ts-expect-error 故意传入 null：编译期本就该报错，这里验证运行时也不会崩
    const next = addTodo(todos, null, 1);

    expect(next.length).toBe(0);
  });
});

describe('toggleTodo', () => {
  test('正常切换：目标翻转，其他任务不受影响', () => {
    const todos: Todo[] = [
      { id: 1, text: '任务一', completed: false },
      { id: 2, text: '任务二', completed: false },
    ];

    const next = toggleTodo(todos, 1);

    expect(next[0].completed).toBe(true);
    expect(next[1].completed).toBe(false);
    expect(next.length).toBe(2);
  });

  test('正常切换：再切一次回到未完成（状态可逆）', () => {
    const todos: Todo[] = [{ id: 1, text: '任务一', completed: true }];

    const next = toggleTodo(todos, 1);

    expect(next[0].completed).toBe(false);
  });

  test('不存在的 ID：不崩溃，数据原样返回', () => {
    const todos: Todo[] = [{ id: 1, text: '任务一', completed: false }];

    const next = toggleTodo(todos, 999);

    expect(next.length).toBe(1);
    expect(next[0].completed).toBe(false);
    expect(next[0].text).toBe('任务一');
  });
});

describe('parseTodoId：dataset.id 的运行时校验', () => {
  test('合法数字字符串转成 number', () => {
    expect(parseTodoId('42')).toBe(42);
    expect(parseTodoId(' 7 ')).toBe(7);
  });

  test("'123abc' 转成 NaN，被判为非法", () => {
    expect(parseTodoId('123abc')).toBeNull();
  });

  test("'1.5' 不是整数，被判为非法", () => {
    expect(parseTodoId('1.5')).toBeNull();
  });

  test("'' 会被 Number 转成 0，必须显式拦住", () => {
    expect(parseTodoId('')).toBeNull();
    expect(parseTodoId(undefined)).toBeNull();
  });

  test('0 与负数不是合法 id', () => {
    expect(parseTodoId('0')).toBeNull();
    expect(parseTodoId('-3')).toBeNull();
  });
});

describe('todosFromUnknown：localStorage 脏数据校验', () => {
  test('非数组一律回退空数组', () => {
    expect(todosFromUnknown(null)).toEqual([]);
    expect(todosFromUnknown({ id: 1 })).toEqual([]);
    expect(todosFromUnknown('[]')).toEqual([]);
  });

  test('混入坏项时只保留合法项', () => {
    const stored: unknown = [
      { id: 1, text: '合法任务', completed: false },
      { id: '2', text: 'id 是字符串', completed: false },
      { id: 3, text: '   ', completed: false },
      { id: 4, text: '缺 completed' },
      null,
    ];

    const todos = todosFromUnknown(stored);

    expect(todos.length).toBe(1);
    expect(todos[0].id).toBe(1);
    expect(todos[0].text).toBe('合法任务');
  });

  test('JSON 损坏时不抛异常，回退空数组', () => {
    expect(parseStoredTodos('{坏数据')).toEqual([]);
    expect(parseStoredTodos(null)).toEqual([]);
  });
});

describe('removeTodo', () => {
  test('删除命中项，其余保持原顺序', () => {
    const todos: Todo[] = [
      { id: 1, text: '任务一', completed: false },
      { id: 2, text: '任务二', completed: true },
    ];

    const next = removeTodo(todos, 1);

    expect(next.length).toBe(1);
    expect(next[0].id).toBe(2);
    expect(todos.length).toBe(2);
  });
});
