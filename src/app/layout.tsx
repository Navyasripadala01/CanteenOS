import type { Metadata } from 'next';
import './globals.css';
import { DemoPersonaBar } from '@/components/demo/DemoPersonaBar';

export const metadata: Metadata = {
  title: 'CanteenOS — Smart Campus Canteen Operating System',
  description: 'Order once. Pay once. Pick up once. Eliminate peak-time campus meal congestion with capacity-aware demand distribution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased selection:bg-brand-500 selection:text-white">
        <main className="flex-1 pb-16">
          {children}
        </main>
        {/* Production-guarded Demo Persona Switcher */}
        <DemoPersonaBar />
      </body>
    </html>
  );
}
