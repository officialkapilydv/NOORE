import { createApp } from './app.js';
import { config } from './config.js';
import { loadCatalog } from './services/catalog.js';
import { loadSettings } from './services/settings.js';
import { loadCoupons } from './services/coupons.js';
import { seedAdmin } from './routes/admin/index.js';

await loadSettings();
await loadCoupons();
const { products, collections } = await loadCatalog();
const seededAdmin = await seedAdmin();
const app = createApp();

app.listen(config.port, () => {
  console.log(`\n  ✦ NOORÉ API  →  http://localhost:${config.port}`);
  console.log(`    ${products.length} products · ${collections.length} collections · env=${config.env}`);
  if (seededAdmin) {
    console.log(`\n  ✦ Admin account created  →  ${seededAdmin.email}  /  ${seededAdmin.password}`);
    console.log('    Change it in the admin panel (Settings → Administrators) or set ADMIN_EMAIL / ADMIN_PASSWORD in .env');
  }
  console.log('');
});
