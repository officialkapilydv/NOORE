import { AnimatePresence, motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/Primitives';

export function ProductGrid({ products, loading, error, onRetry, columns = 3, emptyText = 'No candles match those filters — try loosening one.' }) {
  if (loading && !products?.length) {
    return (
      <div className={`pgrid pgrid--${columns}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="pcard" key={i}>
            <Skeleton className="pcard__media" style={{ aspectRatio: '4 / 5' }} />
            <div className="pcard__body"><Skeleton style={{ width: '60%', height: 22 }} /><Skeleton style={{ width: '90%', height: 14, marginTop: 10 }} /></div>
          </div>
        ))}
      </div>
    );
  }
  if (error && !products?.length) {
    return (
      <p className="pgrid__empty lead" role="alert">
        We couldn't load the candles just now.{onRetry && <> <button type="button" className="link" onClick={onRetry}>Try again</button></>}
      </p>
    );
  }
  if (!products?.length) {
    return <motion.p className="pgrid__empty lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{emptyText}</motion.p>;
  }
  return (
    <motion.div className={`pgrid pgrid--${columns}`} layout>
      <AnimatePresence mode="popLayout">
        {products.map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}
      </AnimatePresence>
    </motion.div>
  );
}
