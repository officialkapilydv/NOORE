// `npm run dev` entry point — builds the storefront and starts the single Express server on $PORT.
// Hosts that only ever run `npm run dev` (GoDaddy Airo) cannot use the Vite dev server: its port
// (5173) is not allowed, and their NODE_ENV/secrets are not reliably set at that point. For the
// API + Vite live-reload pair on your own machine, use `npm run dev:local`.
import { spawn } from 'node:child_process';

const env = { ...process.env, NODE_ENV: 'production' };
console.log(`[dev] production build + server · PORT=${process.env.PORT || '(unset → 4000)'} · NODE_ENV was ${process.env.NODE_ENV || '(unset)'}`);

const run = (cmd) =>
  new Promise((resolve) => {
    const child = spawn(cmd, { stdio: 'inherit', shell: true, env });
    for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
    child.on('exit', (code) => resolve(code ?? 1));
  });

const built = await run('npm run build');
process.exit(built === 0 ? await run('npm start') : built);
