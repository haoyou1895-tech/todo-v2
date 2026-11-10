# todo-ts · W9→W11：TypeScript 重构 → 工程化 → React 组件化

W8/V2.1 的 Todo 列表在 W9 完成 TypeScript 化并补上单元测试；
W10 迁入 Vite 工程并配好 ESLint / Prettier / strict；
W11（当前分支 `feature/w11-react`）把原生 DOM 视图层重构为 React 组件，V4.0。

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

---

## W11：V4.0 React 组件化

### 目录

```
src/
├─ components/             ← W11 新增
│  ├─ TodoApp.tsx          状态容器：todos / filter，事件处理
│  ├─ TodoForm.tsx         受控输入 + form 提交，只负责「收输入」
│  ├─ TodoList.tsx         筛选结果 + 空状态文案，只负责「排布局」
│  └─ TodoItem.tsx         单条渲染，memo 化，按钮自己 stopPropagation
├─ main.tsx                入口：createRoot 挂到 #root
├─ todo.ts                 业务纯函数（W9 起没动过，W11 只加了 nextTodoId）
├─ todo.test.ts            21 条（原 19 条零改动 + W11 追加 id 唯一性 2 条）
└─ legacy/main-dom.ts      W9 的原生 DOM 视图层，已退役，仅作 diff 证据
```

### 数据流

`TodoApp`（唯一 State）→ props 向下 → `TodoList` → `TodoItem`；`TodoItem` 的点击 → 回调向上 → `TodoApp` 调纯函数算新数组 → `setTodos` → React 重渲染。

组件里没有任何 `querySelector` / `innerHTML`；全项目这些关键词只出现在 `src/legacy/main-dom.ts` 和 `main.tsx` 里「取挂载点」那一次。

### 和 W10 的取舍对比

| | W10（V3.0 原生 DOM） | W11（V4.0 React） |
|---|---|---|
| 状态真相 | `let todos` + DOM 各存一份 | 只有 `useState` 一份，DOM 是它的投影 |
| 视图更新 | 手写 `render()` 清空再重建 | React 比对后只改差异节点 |
| 产物体积 | 3.98 kB / gzip 1.70 kB | 226 kB / gzip 70.6 kB |
| 可维护 | 加一个功能改 3 处 | 加一个功能加 1 个组件 |

体积从 4 kB 变 226 kB 不是退步，是把「框架运行时」买了回来：换来的是状态与视图永远同步、不用记住哪几处要手动改。

### 命令

```bash
npm run dev    # 开发（HMR）
npm run test   # 35 条单测
npm run build  # tsc --noEmit && vite build
```
