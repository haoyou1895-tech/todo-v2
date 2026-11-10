/**
 * W11 实验 · TodoForm（受控输入 + 表单提交）
 *
 * 两个设计决定：
 * 1. 输入框是「受控组件」：value 来自 State，用户每敲一个字都走 onChange → setText。
 *    这和 V3 的 input.value 直接读 DOM 是两种世界观：V3 里 state 和 DOM 各存一份，谁真谁假说不清。
 * 2. 用 <form onSubmit> 而不是给按钮挂 onClick：回车也能提交，且键盘用户不需要先点到按钮。
 *    V3 那版只监听了按钮 click，回车是没反应的 —— 这不是「重构顺手加的」，是我自己补的可用性问题。
 *
 * 清空输入框的时机：只有 onAdd 返回 true 才清空。
 * 这是业务规则「纯空白 / 超长不入库」在 UI 层的表现：输入非法时保留用户已输入的内容，不让人重打一遍。
 */

import { useState, type FormEvent, type RefObject } from 'react';

interface TodoFormProps {
  /** 由父组件决定这条能不能入库，返回 true 表示已加入 */
  readonly onAdd: (text: string) => boolean;
  /** 父组件持有输入框引用，添加成功后把光标送回来（ref 透传，不用 DOM 查询） */
  readonly inputRef: RefObject<HTMLInputElement | null>;
}

export default function TodoForm({ onAdd, inputRef }: TodoFormProps) {
  const [text, setText] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    // 不 preventDefault 的话，浏览器会真的把表单提交走，页面直接刷新、State 全丢
    event.preventDefault();
    if (onAdd(text)) setText('');
  }

  return (
    <form className="todo-input-area" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className="todo-input-area__input"
        type="text"
        value={text}
        placeholder="请输入待办内容（最多 100 字）"
        aria-label="待办内容"
        onChange={(event) => setText(event.target.value)}
      />
      <button className="todo-input-area__btn" type="submit">
        添加
      </button>
    </form>
  );
}
