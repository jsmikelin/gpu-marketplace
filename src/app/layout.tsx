import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://yangtzecompute.com'),
  title: {
    default: 'YangtzeCompute | Enterprise GPU Cloud Marketplace',
    template: '%s | YangtzeCompute',
  },
  description:
    'Access NVIDIA H100, A100, and RTX 4090 GPU clusters from verified global suppliers. Pay by the hour. Deploy in minutes. Trusted by 1,200+ AI teams worldwide.',
  keywords: [
    'GPU cloud',
    'NVIDIA H100',
    'A100 cloud',
    'GPU rental',
    'AI compute',
    'GPU marketplace',
    'cloud GPU',
    'machine learning GPU',
    'deep learning GPU',
    'GPU on demand',
    'enterprise GPU',
    'H100 for rent',
    'AI infrastructure',
    'GPU cluster',
  ],
  authors: [{ name: 'Yangtze International Ltd.' }],
  creator: 'YangtzeCompute',
  publisher: 'Hong Kong Yangtze International Limited',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yangtzecompute.com',
    siteName: 'YangtzeCompute',
    title: 'YangtzeCompute | Enterprise GPU Cloud Marketplace',
    description:
      'Access NVIDIA H100, A100, and RTX 4090 GPU clusters from verified global suppliers. Pay by the hour. Deploy in minutes.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YangtzeCompute - Enterprise GPU Cloud Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YangtzeCompute | Enterprise GPU Cloud Marketplace',
    description:
      'Access NVIDIA H100, A100, and RTX 4090 GPU clusters from verified global suppliers. Pay by the hour.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://yangtzecompute.com',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://yangtzecompute.com/#organization',
      name: 'YangtzeCompute',
      url: 'https://yangtzecompute.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://yangtzecompute.com/logo.png',
      },
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@yangtzecompute.com',
        contactType: 'customer support',
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Unit 1, 1/F, Yeung Yiu Chung No.8 Ind. Bldg.',
        addressLocality: 'Hong Kong',
        addressCountry: 'HK',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://yangtzecompute.com/#website',
      url: 'https://yangtzecompute.com',
      name: 'YangtzeCompute',
      publisher: { '@id': 'https://yangtzecompute.com/#organization' },
      inLanguage: 'en-US',
    },
    {
      '@type': 'WebPage',
      '@id': 'https://yangtzecompute.com/#webpage',
      url: 'https://yangtzecompute.com',
      name: 'YangtzeCompute | Enterprise GPU Cloud Marketplace',
      isPartOf: { '@id': 'https://yangtzecompute.com/#website' },
      about: { '@id': 'https://yangtzecompute.com/#organization' },
      description:
        'Access NVIDIA H100, A100, and RTX 4090 GPU clusters from verified global suppliers. Pay by the hour.',
      inLanguage: 'en-US',
    },
    {
      '@type': 'Service',
      '@id': 'https://yangtzecompute.com/#service',
      name: 'GPU Cloud Compute',
      serviceType: 'Cloud GPU Rental',
      provider: { '@id': 'https://yangtzecompute.com/#organization' },
      areaServed: 'Worldwide',
      description:
        'On-demand GPU compute service offering NVIDIA H100, A100, RTX 4090 and more. Billed hourly or monthly.',
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
