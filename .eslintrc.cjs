/**
 * W10 工程化 · ESLint 配置
 *
 * 定位（课件 P20）：ESLint 不跑你的代码，只把源码解析成 AST 再按规则遍历语法结构。
 * 它设的是「下限」，不是天花板 —— 它保证代码不低于某条线，保证不了业务逻辑对不对。
 *
 * 三条规则对应 AI 生成代码的三个高频病：
 *   ① @typescript-eslint/no-explicit-any → 用 any 混过类型（类型逃逸）
 *   ② complexity: 10                    → 分支堆叠（逻辑绕）
 *   ③ max-depth: 3                      → 箭头型代码（嵌套深）
 *
 * 刻意没开的：需要类型感知（parserOptions.project + parserServices）的规则。
 * 一开就要把整个 tsconfig 拉进解析流程，配置和耗时不划算，与课堂口径一致。
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // 必须放最后：关掉所有与 Prettier 打架的格式类规则，让排版归 Prettier、规则归 ESLint
    'prettier',
  ],
  rules: {
    // 规则 1：禁止 any（类型逃逸）
    '@typescript-eslint/no-explicit-any': 'error',
    // 规则 2：圈复杂度上限 10（管函数内独立分支数）
    complexity: ['error', 10],
    // 规则 3：嵌套深度上限 3（管代码块嵌套层数）
    'max-depth': ['error', 3],

    // 死代码：AI 生成后常留下赋值未用的中间变量
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // 允许保留 console.warn / console.error 作为运行时兜底，其余 console 视为遗留
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};
