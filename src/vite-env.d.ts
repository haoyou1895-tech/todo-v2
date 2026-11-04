/// <reference types="vite/client" />

/**
 * W10 补充：给 import.meta.env 补类型。
 * 没有这个文件，import.meta.env.VITE_XXX 在 TS 里就是 any ——
 * 变量名打错了也不会报错，这正是课件 P2「缺 vite-env.d.ts 报属性不存在」的成因。
 */
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE: string;
  readonly VITE_API_PROXY_TARGET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
