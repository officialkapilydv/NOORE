import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFetch } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Markdown } from '@/lib/markdown.jsx';
import { useSettings } from '@/store/settings';
import { Button } from '@/components/ui/Button';

/** Admin-managed content pages: terms, privacy, shipping, refunds, candle care… */
export default function Page() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`page:${slug}`, () => api.page(slug), { enabled: Boolean(slug) });
  const pages = useSettings((s) => s.pages);
  usePageTitle(data?.title || 'Information');

  if (error) {
    return (
      <main className="page-hero container" data-theme="dark">
        <h1 className="display">That page has <em>gone dark.</em></h1>
        <p className="lead">It may have been unpublished. <Link to="/" className="gold">Back home</Link>.</p>
      </main>
    );
  }
  if (loading && !data) return <div className="page-loading" />;
  if (!data) return null;

  return (
    <main className="cpage" data-theme="cream">
      <header className="cpage__hero">
        <div className="container">
          <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>Information</motion.p>
          <motion.h1 className="display" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}>{data.title}</motion.h1>
          {data.summary && <motion.p className="lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>{data.summary}</motion.p>}
          {data.updatedAt && <p className="faint small">Last updated {formatDate(data.updatedAt)}</p>}
        </div>
      </header>
      <div className="container cpage__layout">
        <aside className="cpage__aside">
          <p className="caps faint">More information</p>
          <ul>
            {pages.map((p) => (
              <li key={p.slug}><Link to={`/pages/${p.slug}`} className={p.slug === slug ? 'is-active' : ''}>{p.title}</Link></li>
            ))}
            <li><Link to="/contact#faq">FAQ</Link></li>
          </ul>
          <Button to="/contact" variant="ghost" size="sm" magnetic={false}>Ask a question</Button>
        </aside>
        <motion.article className="cpage__body" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
          <Markdown source={data.body.replace(/^#\s+[^\n]+\n/, '')} />
        </motion.article>
      </div>
    </main>
  );
}
