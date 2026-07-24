import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/logo';

/** Lightweight markdown → React for legal drafts (no MD dependency). */
export function LegalMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const flushParagraph = (buf: string[]) => {
    const text = buf.join(' ').trim();
    if (!text) return;
    nodes.push(
      <p key={key++} className="text-sm leading-relaxed text-muted-foreground">
        {inline(text)}
      </p>,
    );
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '---') {
      nodes.push(<hr key={key++} className="my-6 border-border" />);
      i += 1;
      continue;
    }

    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={key++} className="font-heading text-2xl font-bold tracking-tight">
          {line.slice(2)}
        </h1>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={key++} className="mt-8 font-heading text-lg font-semibold">
          {line.slice(3)}
        </h2>,
      );
      i += 1;
      continue;
    }

    if (line.trim().startsWith('> ')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      nodes.push(
        <aside key={key++} className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {quote.map((q, qi) => (
            <p key={qi} className={qi > 0 ? 'mt-2' : undefined}>{inline(q)}</p>
          ))}
        </aside>,
      );
      continue;
    }

    if (line.trim().startsWith('|') && lines[i + 1]?.includes('---')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        if (!cells.every((c) => /^[-:\s]+$/.test(c))) rows.push(cells);
        i += 1;
      }
      if (rows.length > 0) {
        const [head, ...body] = rows;
        nodes.push(
          <div key={key++} className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  {head.map((h) => (
                    <th key={h} className="px-2 py-2 font-medium text-foreground">{inline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="border-b border-border/60">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-2 align-top text-muted-foreground">{inline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
      }
      continue;
    }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      const ordered = /^\s*\d+\./.test(line);
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
        if (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, ''));
        } else {
          items[items.length - 1] += ` ${lines[i].trim()}`;
        }
        i += 1;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      nodes.push(
        <ListTag
          key={key++}
          className={`space-y-1.5 pl-5 text-sm text-muted-foreground ${ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {items.map((item, ii) => (
            <li key={ii}>{inline(item)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const buf: string[] = [line];
    i += 1;
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('>') && !lines[i].startsWith('|') && !/^\s*[-*]\s+/.test(lines[i]) && lines[i].trim() !== '---') {
      buf.push(lines[i]);
      i += 1;
    }
    flushParagraph(buf);
  }

  return <div className="space-y-3">{nodes}</div>;
}

function inline(text: string): React.ReactNode {
  // **bold**, [label](./privacy.md) → /legal/privacy, *italic*
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={k++} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('[')) {
      const label = token.match(/^\[([^\]]+)\]/)?.[1] ?? '';
      const hrefRaw = token.match(/\(([^)]+)\)/)?.[1] ?? '#';
      const href = hrefRaw.includes('privacy')
        ? '/legal/privacy'
        : hrefRaw.includes('terms')
          ? '/legal/terms'
          : hrefRaw;
      parts.push(
        <Link key={k++} href={href} className="text-primary underline underline-offset-2">
          {label}
        </Link>,
      );
    } else if (token.startsWith('*')) {
      parts.push(<em key={k++}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : parts;
}

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/"><Logo markClassName="h-6" /></Link>
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/apply" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to application
        </Link>
        {children}
      </main>
    </div>
  );
}
