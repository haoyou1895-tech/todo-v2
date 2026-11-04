/**
 * 迁移遗留层的业务测试 —— 相当于给「老入口」补一份需求快照。
 *
 * 这些用例写的是需求，不是实现：
 *   纯空白不能添加 / 超长不能添加 / 添加后是 trim 过的干净文本
 *   删除只删命中那一条 / 切换只翻命中那一条，其余原样 / 清空要 confirm
 *
 * 它们在改造前的对照版本里应当全绿。任何一次「为了过 ESLint」的重构，
 * 只要动了这里的断言，就是业务被改坏了 —— 这是 W10 审查的客观尺子。
 */
import { describe, expect, test } from 'vitest';
import { processTodoAction } from './processTodoAction';
import type { Todo } from '../todo';

function seed(): Todo[] {
  return [
    { id: 1, text: '任务一', completed: false },
    { id: 2, text: '任务二', completed: false },
  ];
}

describe('processTodoAction / add', () => {
  test('正常文本：追加一条，且存的是 trim 之后的干净文本', () => {
    const todos = seed();
    const next = processTodoAction(todos, 'add', { text: '  买牛奶  ' });
    expect(next.length).toBe(3);
    expect(next[2].text).toBe('买牛奶');
    expect(next[2].completed).toBe(false);
  });

  test('纯空白：必须拦住，长度不变', () => {
    const todos = seed();
    const next = processTodoAction(todos, 'add', { text: '   ' });
    expect(next.length).toBe(2);
  });

  test('超长（101 字）：必须拦住，长度不变', () => {
    const todos = seed();
    const next = processTodoAction(todos, 'add', { text: '待'.repeat(101) });
    expect(next.length).toBe(2);
  });
});

describe('processTodoAction / remove', () => {
  test('只删命中那一条，其余原样', () => {
    const todos = seed();
    const next = processTodoAction(todos, 'remove', { id: 1 });
    expect(next.length).toBe(1);
    expect(next[0].id).toBe(2);
  });

  test('id 不存在：不报错，长度不变', () => {
    const todos = seed();
    const next = processTodoAction(todos, 'remove', { id: 999 });
    expect(next.length).toBe(2);
  });
});

describe('processTodoAction / toggle', () => {
  test('只翻转命中的一条，另一条不受影响', () => {
    const todos = seed();
    const next = processTodoAction(todos, 'toggle', { id: 2 });
    expect(next[0].completed).toBe(false);
    expect(next[1].completed).toBe(true);
  });
});

describe('processTodoAction / clear', () => {
  test('带 confirm 才清空', () => {
    const todos = seed();
    expect(processTodoAction(todos, 'clear', { confirm: true }).length).toBe(0);
  });

  test('不带 confirm：不清空', () => {
    const todos = seed();
    expect(processTodoAction(todos, 'clear', {}).length).toBe(2);
  });
});

describe('processTodoAction / 未知 action', () => {
  test('未知指令：原样返回，不抛异常', () => {
    const todos = seed();
    const next = processTodoAction(todos, 'unknown', {});
    expect(next.length).toBe(2);
  });
});
