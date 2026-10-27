/**
 * W9 实验 · 业务层（纯逻辑，不碰 DOM）
 *
 * 设计原则：
 * 1. 沿用 W8/V2.1 已确立的「不改原数组」工程约束 —— 入参用 readonly Todo[]，
 *    编译器直接拦住 push / splice，比靠人工 review 更可靠。
 * 2. 脏数据只有两个入口：dataset.id（永远是 string）和 localStorage（解析结果未知）。
 *    两个入口都写成显式校验函数，返回 null / 空数组，而不是让坏值流进数据层。
 * 3. 全程零 any、零非空断言 `!`、零 `as` 硬转。
 */

export interface Todo {
  readonly id: number;
  readonly text: string;
  readonly completed: boolean;
}

/** 业务规则：单条任务文本上限（含两端空白之前判断），超长视为无效输入 */
export const MAX_TEXT_LENGTH = 100;

/**
 * 脏数据入口 1：把 DOM 上的 dataset.id（string | undefined）转成真正的 id。
 * 三种坏值都必须挡住：'123abc' -> NaN、'1.5' -> 非整数、'' -> Number('') === 0。
 */
export function parseTodoId(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  const id = Number(trimmed);
  // Number.isSafeInteger 同时排除 NaN、小数、Infinity 和超出安全整数的值
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  return id;
}

/** 只接受「真的是对象」的值，作为后续读取属性的前置收窄 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 脏数据入口 2：localStorage 解析出来的 unknown，逐条校验后才算 Todo。
 * 注意：Array.isArray 会把 unknown 收窄成 any[]，所以紧接着显式标注回 unknown[]，
 * 否则循环变量会变成隐式 any —— 这是最容易漏掉的一处类型逃逸。
 */
export function todosFromUnknown(value: unknown): Todo[] {
  if (!Array.isArray(value)) return [];

  const list: unknown[] = value;
  const result: Todo[] = [];

  for (const item of list) {
    if (!isRecord(item)) continue;

    const { id, text, completed } = item;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) continue;
    if (typeof text !== 'string' || text.trim() === '') continue;
    if (typeof completed !== 'boolean') continue;

    result.push({ id, text, completed });
  }

  return result;
}

/** localStorage 的字符串入口：解析失败一律回退空数组，不让页面白屏 */
export function parseStoredTodos(raw: string | null): Todo[] {
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  return todosFromUnknown(parsed);
}

/**
 * 文本归一化 + 合法性校验，返回 null 表示该输入不允许入库。
 * 这里用 typeof 而不是依赖参数类型：TS 类型只是编译期的承诺，
 * 运行时真正的数据可能来自 HTML 属性、localStorage 甚至第三方脚本。
 */
function normalizeText(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;

  const text = raw.trim();
  if (text === '') return null;
  if (text.length > MAX_TEXT_LENGTH) return null;

  return text;
}

/** 添加：返回新数组，原数组保持不变 */
export function addTodo(todos: readonly Todo[], text: string, id: number = Date.now()): Todo[] {
  const normalized = normalizeText(text);
  if (normalized === null) return [...todos];

  if (!Number.isSafeInteger(id) || id <= 0) return [...todos];

  return [...todos, { id, text: normalized, completed: false }];
}

/** 切换完成状态：只翻转 id 命中的那一条，其余项原样返回 */
export function toggleTodo(todos: readonly Todo[], id: number): Todo[] {
  if (!Number.isSafeInteger(id)) return [...todos];

  return todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
}

/** 删除：filter 生成新数组 */
export function removeTodo(todos: readonly Todo[], id: number): Todo[] {
  if (!Number.isSafeInteger(id)) return [...todos];

  return todos.filter((t) => t.id !== id);
}
