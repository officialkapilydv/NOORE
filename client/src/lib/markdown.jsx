/**
 * A deliberately small Markdown renderer for policy pages — headings, paragraphs,
 * lists, bold/italic, links, horizontal rules. Produces React elements (never HTML
 * strings), so admin-authored content cannot inject scripts.
 */
import { Fragment } from 'react';

function inline(text, keyPrefix = 'i') {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyPrefix}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k}>{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('*') || tok.startsWith('_')) out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    else {
      const [, label, href] = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const safe = /^(https?:\/\/|mailto:|tel:|\/|#)/.test(href) ? href : '#';
      out.push(<a key={k} href={safe} target={safe.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{label}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source = '', className = 'prose' }) {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const Tag = `h${h[1].length}`;
      blocks.push(<Tag key={key++}>{inline(h[2], `h${key}`)}</Tag>);
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { blocks.push(<hr key={key++} />); i++; continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
      blocks.push(<ul key={key++}>{items.map((t, j) => <li key={j}>{inline(t, `ul${key}-${j}`)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '')); i++; }
      blocks.push(<ol key={key++}>{items.map((t, j) => <li key={j}>{inline(t, `ol${key}-${j}`)}</li>)}</ol>);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^>\s?/, '')); i++; }
      blocks.push(<blockquote key={key++}>{inline(quote.join(' '), `q${key}`)}</blockquote>);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|[-*]\s|\d+[.)]\s|>|-{3,})/.test(lines[i])) { para.push(lines[i]); i++; }
    blocks.push(<p key={key++}>{para.map((t, j) => <Fragment key={j}>{inline(t, `p${key}-${j}`)}{j < para.length - 1 ? <br /> : null}</Fragment>)}</p>);
  }
  return <div className={className}>{blocks}</div>;
}
