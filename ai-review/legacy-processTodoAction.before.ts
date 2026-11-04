/**
 * 迁移遗留层 · W7/W8 单文件版的命令式入口
 *
 * 来源：W7「Todo列表v2.1.html」里直接写在 window 上的那套操作（addTodo / deleteTodo /
 * toggleTodo / clearCompleted），W8 的事件委托回调也是按 if-else 分流的形态。
 * W9 重构时只搬了「纯逻辑层 todo.ts」，这一层命令式入口没搬 —— W10 做工程化时
 * 它是绕不过去的兼容层：将来接后端同步、批量导入，都会走这个 dispatcher。
 *
 * 已知问题（下面 ESLint 会一条条报出来）：
 * 1. payload 来自外部（HTML dataset / fetch 响应 / 老调用方），类型未知，这里用 any 兜住了；
 * 2. 校验层层嵌套，四个分支写成了箭头形；
 * 3. 直接 push / splice 传入的数组，违反 W8/W9 确立的「不改原数组」约束。
 *
 * 保留原样不做手工美化：这是改造前的对照组（对应课件「材料 A」）。
 */
import type { Todo } from '../todo';

export function processTodoAction(todos: any[], action: string, payload: any): any[] {
  const snapshot = todos.slice();

  if (action === 'add') {
    if (payload && payload.text) {
      if (payload.text.trim() !== '') {
        if (payload.text.trim().length <= 100) {
          todos.push({ id: Date.now(), text: payload.text.trim(), completed: false });
          return todos;
        } else {
          return todos;
        }
      } else {
        return todos;
      }
    } else {
      return todos;
    }
  } else if (action === 'remove') {
    if (payload && payload.id) {
      for (let i = 0; i < todos.length; i++) {
        if (todos[i].id === payload.id) {
          todos.splice(i, 1);
          return todos;
        }
      }
      return todos;
    } else {
      return todos;
    }
  } else if (action === 'toggle') {
    if (payload && payload.id) {
      for (let i = 0; i < todos.length; i++) {
        if (todos[i].id === payload.id) {
          todos[i].completed = !todos[i].completed;
          return todos;
        }
      }
      return todos;
    } else {
      return todos;
    }
  } else if (action === 'clear') {
    if (payload && payload.confirm) {
      todos.length = 0;
      return todos;
    } else {
      return todos;
    }
  } else {
    return snapshot;
  }
}
