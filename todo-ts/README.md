# todo-ts · W9 实验：TypeScript 重构与单元测试

W8/V2.1 的 Todo 列表在 W9 完成 TypeScript 化，并补上单元测试。

## 目录

```
todo-ts/
├─ src/
│  ├─ todo.ts              业务层（纯函数，不改原数组，零 any）
│  ├─ main.ts              视图层（DOM 绑定 + 事件委托 + 脏数据校验）
│  ├─ todo.test.ts         任务 2：手写单测（禁用 AI，19 条）
│  └─ todo.ai-fixed.test.ts 任务 3：审查 AI 输出后逐条修补（5 条）
├─ ai-review/
│  └─ ai-generated-original.ts  AI 原始输出存证（不参与运行）
├─ docs/
│  └─ npm-run-test.png     全绿运行截图
├─ index.html
├─ tsconfig.json           strict + noEmit
└─ tsconfig.build.json     演练用：生成 dist/
```

## 命令

```bash
npm install       # 装 vitest + typescript
npm run test      # 跑全部单测
npm run typecheck # tsc --noEmit，只看类型
npm run build     # 生成 dist/，用浏览器打开 index.html 可演示
```

## 三条红线

| 红线 | 本工程的做法 |
|---|---|
| 不用 `any` | 脏数据入口统一用 `unknown` + 类型谓词收窄；`Array.isArray` 之后立刻标注回 `unknown[]` |
| 不用非空断言 `!` | `querySelector` 结果先 `instanceof` 收窄，取不到就抛错 |
| 不用 `as` 硬转 | `e.target` 用 `instanceof Element` / `instanceof HTMLLIElement` 收窄；localStorage 用 `isRecord` 类型守卫 |

## 脏数据只有两个入口

1. `dataset.id` —— 永远是 `string | undefined`，由 `parseTodoId()` 转换 + `Number.isSafeInteger()` 校验。
2. `localStorage` —— `JSON.parse` 结果用 `unknown` 接住，由 `todosFromUnknown()` 逐条校验。

## 不可变约束

W8 定下的「不改原数组」在 W9 交给编译器守：函数入参声明为 `readonly Todo[]`，
`push` / `splice` / 直接赋属性都会编译报错，不再依赖人工 review。
