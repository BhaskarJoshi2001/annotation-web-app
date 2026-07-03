import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Annotation Studio — image labeling for computer vision',
    template: '%s · Annotation Studio',
  },
  description:
    'Label computer-vision datasets fast: bounding boxes, polygons, and one-click AI segmentation powered by SAM. Export to COCO, YOLO, JSON, or CSV.',
  keywords: [
    'image annotation', 'data labeling', 'computer vision', 'SAM',
    'segment anything', 'COCO export', 'YOLO export', 'bounding box', 'polygon annotation',
  ],
  openGraph: {
    title: 'Annotation Studio — image labeling for computer vision',
    description:
      'Bounding boxes, polygons, and one-click AI segmentation powered by SAM. Export to COCO, YOLO, JSON, or CSV.',
    type: 'website',
    siteName: 'Annotation Studio',
  },
};

// Runs before paint to apply the persisted theme (data-theme + .dark) with no flash.
const themeInitScript = `(function(){try{var m=localStorage.getItem('as-theme')||'system';var d=m==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;var r=document.documentElement;r.setAttribute('data-theme',d);r.setAttribute('data-theme-mode',m);r.classList.toggle('dark',d==='dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <body>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
