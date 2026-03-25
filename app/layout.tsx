import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'LeadGenius AI - Advanced Sales Strategy Expert',
  description: 'AI Lead Intelligence & Sales Strategy Expert. Generates business strategies, finds qualified leads, and creates personalized outreach templates.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
