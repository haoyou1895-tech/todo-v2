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
  nextTodoId,
  parseStoredTodos,
  parseTodoId,
  removeTodo,
  toggleTodo,
  todosFromUnknown,
  updateTodo,
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

/**
 * W11 追加：id 唯一性。
 * 这一条不是「重构顺手补的」，是任务 3 审查 AI 修复时发现的真实缺陷——
 * 它在 handleAdd 里继续用 Date.now() 当 id，同一毫秒连加两条就会撞号。
 * 期望值来自业务契约「id 必须唯一」，不来自实现。
 */
describe('nextTodoId', () => {
  test('同一毫秒内连续取两次，必须拿到不同 id', () => {
    const todos: Todo[] = [{ id: 1000, text: 'A', completed: false }];

    const first = nextTodoId(todos, 1000);
    const afterFirst: Todo[] = [...todos, { id: first, text: 'B', completed: false }];
    const second = nextTodoId(afterFirst, 1000);

    expect(first).not.toBe(second);
    expect(second).toBeGreaterThan(first);
  });

  test('空列表回退到当前时间戳，id 仍为正整数', () => {
    const id = nextTodoId([], 1_700_000_000_000);

    expect(id).toBe(1_700_000_000_000);
    expect(Number.isSafeInteger(id)).toBe(true);
  });
});

/**
 * 回归：修改功能。
 *
 * 这一组是「改了没生效」这个线上缺陷的钉子。根因是 handleEdit 用「数组长度有没有变」
 * 判断输入是否合法 —— 而「删旧 + 加新」的成功路径长度恰好不变，判断方向正好反了：
 * 合法输入被拦掉（改了不生效），非法输入反而通过（任务被删掉）。
 * 所以下面第一条专门断言「修改后长度与原长度相同」，把这件事固定成预期行为，
 * 以后谁再想拿长度当成功信号，这条测试会立刻红给他看。
 */
describe('updateTodo', () => {
  const two: Todo[] = [
    { id: 1, text: '好好喝', completed: false },
    { id: 2, text: '明早去浇花', completed: false },
  ];

  test('正常修改：文本被替换，长度不变（不能用长度判断成败）', () => {
    const next = updateTodo(two, 1, '好好喝水');

    expect(next.length).toBe(two.length);
    expect(next[0].text).toBe('好好喝水');
  });

  test('正常修改：位置和 id 都不变，不跳到列表末尾', () => {
    const next = updateTodo(two, 1, '好好喝水');

    expect(next[0].id).toBe(1);
    expect(next[0].text).toBe('好好喝水');
    expect(next[1].text).toBe('明早去浇花');
  });

  test('正常修改：已完成状态被保留，不因改文本被重置', () => {
    const done: Todo[] = [{ id: 1, text: '已办的事', completed: true }];

    const next = updateTodo(done, 1, '改个错别字');

    expect(next[0].text).toBe('改个错别字');
    expect(next[0].completed).toBe(true);
  });

  test('首尾空白：trim 后再入库', () => {
    const next = updateTodo(two, 1, '  好好喝水  ');

    expect(next[0].text).toBe('好好喝水');
  });

  test('纯空格：拒绝，文本保持原样，长度不变', () => {
    const next = updateTodo(two, 1, '   ');

    expect(next.length).toBe(2);
    expect(next[0].text).toBe('好好喝');
  });

  test(`超过 ${MAX_TEXT_LENGTH} 字：拒绝，文本保持原样`, () => {
    const next = updateTodo(two, 1, 'a'.repeat(MAX_TEXT_LENGTH + 1));

    expect(next[0].text).toBe('好好喝');
  });

  test('id 不存在：谁都没被改，长度不变', () => {
    const next = updateTodo(two, 999, '新内容');

    expect(next.length).toBe(2);
    expect(next[0].text).toBe('好好喝');
    expect(next[1].text).toBe('明早去浇花');
  });

  test('不修改传入的原数组（不可变约束）', () => {
    updateTodo(two, 1, '好好喝水');

    expect(two[0].text).toBe('好好喝');
  });
});
