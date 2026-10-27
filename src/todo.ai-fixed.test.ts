/**
 * W9 实验 · 任务 3：审查 AI 生成的测试后，逐条修补的版本
 *
 * 原始 AI 输出见 ai-review/ai-generated-original.ts（未改动）。
 * 这里每一处修补都对应审查报告里的一个结论：
 *   修补① 弱断言 toBeDefined  → 断言到具体文本内容
 *   修补② 期望值写反           → 空输入应断言 length 为 0
 *   修补③ 数据声明在顶层       → 挪进每个 test 内部
 *   修补④ 缺维度1（空值 null） → 新增，用 @ts-expect-error 而非 as any
 *   修补⑤ 缺维度2拓展（超长）  → 新增，对照 MAX_TEXT_LENGTH 双边断言
 *   修补⑥ 缺维度6（重复）      → 新增，验证允许重复且 id 不冲突
 */

import { describe, expect, test } from 'vitest';
import { MAX_TEXT_LENGTH, addTodo, type Todo } from './todo';

describe('AI 原始用例：修补后的版本', () => {
  test('正常添加：断言到具体文本，而不是「存在」', () => {
    const todos: Todo[] = [];

    const next = addTodo(todos, '学习TS', 1);

    // 原为 expect(next[0]).toBeDefined() —— 即使把文本存成空串也会通过
    expect(next[0].text).toBe('学习TS');
    expect(next[0].completed).toBe(false);
  });

  test('拒绝空字符串：期望值改正为「不新增」', () => {
    const todos: Todo[] = [];

    const next = addTodo(todos, '', 1);

    // 原为 expect(next.length).toBe(1) —— 把「没拦住」当成了预期结果
    expect(next.length).toBe(0);
  });

  test('维度1（空值）：null 应被拦截，且不抛异常', () => {
    const todos: Todo[] = [];

    // @ts-expect-error 故意传 null，验证运行时兜底；这里不使用 as any
    const next = addTodo(todos, null, 1);

    expect(next.length).toBe(0);
  });

  test(`维度2拓展（格式·超长）：${MAX_TEXT_LENGTH + 1} 字被拦截`, () => {
    const todos: Todo[] = [];

    const next = addTodo(todos, '待'.repeat(MAX_TEXT_LENGTH + 1), 1);

    expect(next.length).toBe(0);
  });

  test('维度6（重复）：相同文本可重复添加，但 id 各不相同', () => {
    const todos: Todo[] = [];

    const first = addTodo(todos, '买牛奶', 1);
    const second = addTodo(first, '买牛奶', 2);

    expect(second.length).toBe(2);
    expect(second[0].text).toBe('买牛奶');
    expect(second[1].text).toBe('买牛奶');
    expect(second[0].id).not.toBe(second[1].id);
  });
});
