import fs from 'node:fs';
import path from 'node:path';
import { LegalMarkdown, LegalPageShell } from '@/components/legal-markdown';

export const metadata = {
  title: 'Terms & Conditions · Padel Nomads',
};

export default function TermsPage() {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/content/legal/terms.md'),
    'utf8',
  );
  return (
    <LegalPageShell title="Terms & Conditions">
      <LegalMarkdown source={source} />
    </LegalPageShell>
  );
}
