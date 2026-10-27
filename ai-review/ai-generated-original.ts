/**
 * 【存证】AI 生成的原始测试代码（未修改，原样保留）
 *
 * 来源：任务 3 第一步，把结构化 Prompt 发给 AI 后得到的输出。
 * 本文件不参与 `npm run test`（文件名不匹配 vitest 的 *.test.ts 规则），
 * 只作为审查对象留档；实际运行的是 src/todo.ai-fixed.test.ts（审查修补后的版本）。
 *
 * 已知问题（见报告第三节审查报告）：
 * ① 弱断言：expect(...).toBeDefined()
 * ② 期望值写反：拒绝空字符串却断言 length 为 1
 * ③ 维度缺失：null、超长文本、重复添加一条都没有
 * ④ 数据共享：todos 声明在顶层
 */

import { expect, test } from 'vitest';
import { Todo, addTodo } from '../src/todo';

const todos: Todo[] = [];

test('添加一条任务', () => {
  addTodo(todos, '学习TS');
  expect(todos[0]).toBeDefined();
});

test('拒绝空字符串', () => {
  addTodo(todos, '');
  expect(todos.length).toBe(1);
});
