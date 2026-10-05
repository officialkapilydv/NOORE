import { PageHead, Panel, MediaLibrary, useToast } from '../ui';

export default function Media() {
  const toast = useToast();
  return (
    <>
      <PageHead title="Media" sub="Product photographs, banners and any imagery used across the storefront. Click an image to copy its URL." />
      <Panel>
        <MediaLibrary onPick={(url) => { navigator.clipboard?.writeText(url); toast('URL copied to clipboard'); }} />
      </Panel>
    </>
  );
}
