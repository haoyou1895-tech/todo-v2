import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * W10 工程化：把「端口 / 代理 / 构建」三件与环境相关的事从代码里挪到这里。
 *
 * 两个必须记住的边界（对应课件环节②）：
 * 1. 代理只活在 dev —— 它由 vite dev server（Node 进程）执行；
 *    npm run build 之后 dist/ 是纯静态文件，没有 Node 进程，proxy 配置不再生效。
 * 2. 生产环境要么让后端直接配 CORS，要么用 Nginx 反代 /api，不能指望这份配置。
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // W11：React 插件做两件事 —— dev 时给 tsx 提供 HMR（改组件不刷新页面就生效），
    // build 时把 JSX 交给 Babel 转成 React.createElement。没有它，.tsx 里的 <div> 语法根本编译不过。
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // 浏览器只看到 localhost:5173/api（同源），由 dev server 转发到后端
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
    },
  };
});
