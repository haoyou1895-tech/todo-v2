/**
 * 迁移遗留层 · 命令式入口（W10 工程化改造后）
 *
 * 改造口径（结构化 Prompt 里给 AI 的约束）：
 *   不改业务行为 / 不用 eslint-disable / 不用 as any 绕过 / 不调低规则阈值
 *
 * 做了什么：
 *   1. payload 从 any 变成 unknown + 显式收窄 —— 外部数据本来就没有类型，收窄是唯一诚实的写法；
 *   2. 四个分支拆成四个纯函数，主函数只用 switch 分流（复杂度、嵌套同时降下来）；
 *   3. 魔法数字 100 换成 todo.ts 里已有的 MAX_TEXT_LENGTH，避免两处各写一个上限；
 *   4. 顺手改成「返回新数组、不改传入数组」，与 W8/W9 确立的不可变约束对齐。
 *
 * 业务规则逐条保留（对照改造前）：
 *   纯空白拒绝 / 超长拒绝 / 入库文本一定是 trim 过的
 *   删除只删命中一条 / 切换只翻命中一条 / 清空必须带 confirm / 未知指令原样返回
 */
import { MAX_TEXT_LENGTH, type Todo } from '../todo';

export interface TodoActionPayload {
  readonly text?: string;
  readonly id?: number;
  readonly confirm?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 外部传进来的 payload 一律先当 unknown，逐字段验完类型再使用 */
function readPayload(raw: unknown): TodoActionPayload {
  if (!isRecord(raw)) return {};

  const { text, id, confirm } = raw;
  return {
    text: typeof text === 'string' ? text : undefined,
    id: typeof id === 'number' && Number.isSafeInteger(id) ? id : undefined,
    confirm: confirm === true,
  };
}

/** 文本归一化 + 合法性校验，返回 null 表示不允许入库（保留原来的两道校验） */
function normalizeNewText(raw: string | undefined): string | null {
  if (raw === undefined) return null;

  const text = raw.trim();
  if (text === '') return null;
  if (text.length > MAX_TEXT_LENGTH) return null;

  return text;
}

function applyAdd(todos: readonly Todo[], payload: TodoActionPayload): Todo[] {
  const text = normalizeNewText(payload.text);
  if (text === null) return [...todos];

  return [...todos, { id: Date.now(), text, completed: false }];
}

function applyRemove(todos: readonly Todo[], payload: TodoActionPayload): Todo[] {
  if (payload.id === undefined) return [...todos];

  return todos.filter((t) => t.id !== payload.id);
}

function applyToggle(todos: readonly Todo[], payload: TodoActionPayload): Todo[] {
  if (payload.id === undefined) return [...todos];

  return todos.map((t) => (t.id === payload.id ? { ...t, completed: !t.completed } : t));
}

function applyClear(todos: readonly Todo[], payload: TodoActionPayload): Todo[] {
  if (payload.confirm !== true) return [...todos];

  return [];
}

export function processTodoAction(
  todos: readonly Todo[],
  action: string,
  payload: unknown,
): Todo[] {
  const p = readPayload(payload);

  switch (action) {
    case 'add':
      return applyAdd(todos, p);
    case 'remove':
      return applyRemove(todos, p);
    case 'toggle':
      return applyToggle(todos, p);
    case 'clear':
      return applyClear(todos, p);
    default:
      return [...todos];
  }
}
