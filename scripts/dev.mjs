// `npm run dev` entry point.
// Hosts that only ever run `npm run dev` (GoDaddy Airo) set NODE_ENV=production; there we build the
// storefront once and start the single Express server on $PORT, because the Vite dev server's port
// (5173) is not allowed. Everywhere else this is the usual API + Vite live-reload pair.
import { spawn } from 'node:child_process';

const run = (cmd) =>
  new Promise((resolve) => {
    const child = spawn(cmd, { stdio: 'inherit', shell: true });
    for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
    child.on('exit', (code) => resolve(code ?? 1));
  });

if (process.env.NODE_ENV === 'production') {
  const built = await run('npm run build');
  process.exit(built === 0 ? await run('npm start') : built);
} else {
  process.exit(await run('npm run dev:local'));
}
