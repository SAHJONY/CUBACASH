import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mycubacash.com'),
  title: {
    default: 'mycubacash.com',
    template: '%s | mycubacash.com'
  },
  description: 'Private-sector economy operating platform for commerce, sourcing, RFQs, compliance and business operations.',
  applicationName: 'mycubacash.com',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'mycubacash.com',
    description: 'Private-sector economy operating platform',
    url: 'https://mycubacash.com',
    siteName: 'mycubacash.com',
    type: 'website'
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="es"><body>{children}</body></html>;
}
