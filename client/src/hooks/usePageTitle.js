import { useEffect } from 'react';

export function usePageTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} · NOORÉ` : 'NOORÉ · Made to make moments.';
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) { tag = document.createElement('meta'); tag.name = 'description'; document.head.appendChild(tag); }
      tag.content = description;
    }
  }, [title, description]);
}
