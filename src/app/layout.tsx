import type { Metadata, Viewport } from 'next';
import { Montserrat, Open_Sans } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://apostellocoffee.co.za';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Apostellō Coffee Co. — Speciality coffee at CMV Business Park',
    template: '%s · Apostellō Coffee Co.',
  },
  description:
    'Speciality coffee from a small trailer at CMV Business Park. Espresso, flat whites, cold brew and a loyalty card that actually gets stamped. not just served, Sent.',
  applicationName: 'Apostellō',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'Apostellō Coffee Co.',
    locale: 'en_ZA',
    images: ['/og-image.png'],
  },
  twitter: { card: 'summary_large_image', images: ['/og-image.png'] },
};

export const viewport: Viewport = {
  themeColor: '#011b3d',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`${montserrat.variable} ${openSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
