import { Hero } from '@/components/home/Hero';
import { CollectionsShowcase } from '@/components/home/Collections';
import { FeaturedCarousel } from '@/components/home/Featured';
import { SignatureSpace } from '@/components/home/SignatureSpace';
import { Craft } from '@/components/home/Craft';
import { GiftingBanner } from '@/components/home/Gifting';
import { Testimonials } from '@/components/home/Testimonials';
import { Newsletter } from '@/components/home/Newsletter';
import { Marquee } from '@/components/ui/Primitives';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSettings } from '@/store/settings';

export default function Home() {
  const { seo, home } = useSettings((s) => s.settings);
  usePageTitle('', seo?.description);
  const STRIP = home?.marquee?.length ? home.marquee : ['Made to make moments', 'Hand-poured in small batches'];
  return (
    <>
      <Hero />
      <Marquee items={STRIP} className="marquee--gold" speed={46} />
      <CollectionsShowcase />
      <FeaturedCarousel />
      <SignatureSpace />
      <Craft />
      <GiftingBanner />
      <Testimonials />
      <Newsletter />
    </>
  );
}
