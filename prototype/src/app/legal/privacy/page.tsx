import fs from 'node:fs';
import path from 'node:path';
import { LegalMarkdown, LegalPageShell } from '@/components/legal-markdown';

export const metadata = {
  title: 'Privacy Policy · Padel Nomads',
};

export default function PrivacyPage() {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/content/legal/privacy.md'),
    'utf8',
  );
  return (
    <LegalPageShell title="Privacy Policy">
      <LegalMarkdown source={source} />
    </LegalPageShell>
  );
}
