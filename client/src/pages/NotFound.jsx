import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { CandleThumb } from '@/components/shop/CandleThumb';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <main className="notfound" data-theme="dark">
      <div className="container notfound__inner">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <CandleThumb vessel={{ type: 'matte', color: '#161210', wax: '#efe4d2', lid: 'none', labelBg: '#1a1513', labelText: '#e8dcc6', accent: '#b89a5a', glow: '#ffb978' }} size={180} lit={false} />
        </motion.div>
        <motion.p className="notfound__code display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>404</motion.p>
        <h1 className="display">The light went out <em>on this page.</em></h1>
        <p className="lead">The page you were looking for has been moved, snuffed or never existed. Let's find you something that smells better.</p>
        <div className="notfound__actions">
          <Button to="/" variant="gold" arrow>Back home</Button>
          <Button to="/shop" variant="ghost">Shop candles</Button>
        </div>
      </div>
    </main>
  );
}
