import './styles.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Football Club SaaS — Backoffice',
  description: 'Gestão da aplicação e configuração white-label por clube',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
