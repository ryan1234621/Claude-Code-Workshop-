import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { CartProvider } from '@/components/CartProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Parmore — Athletic Luxury Golf Apparel',
    template: '%s | Parmore',
  },
  description:
    'Parmore is a premium golf apparel and headwear brand crafted for the modern golfer. Performance-engineered. Luxury-finished.',
  keywords: ['golf apparel', 'golf clothing', 'golf hats', 'luxury golf', 'premium golf wear'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Parmore',
    title: 'Parmore — Athletic Luxury Golf Apparel',
    description: 'Performance-engineered. Luxury-finished.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parmore — Athletic Luxury Golf Apparel',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-parmore-white text-parmore-black antialiased">
        <CartProvider>
          <Navbar />
          <main className="min-h-[calc(100dvh-var(--navbar-height))]">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
