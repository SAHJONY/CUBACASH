import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mycubacash.com'),
  title: {
    default: 'mycubacash.com | Family Remittance, Business Payments & Private Marketplace',
    template: '%s | mycubacash.com'
  },
  description: 'Family remittance requests, private-business payments, verified delivery services and a private-sector marketplace with transaction tracking and customer support.',
  applicationName: 'mycubacash.com',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'mycubacash.com',
    description: 'Support families, pay businesses and track transactions across a trusted private-sector network.',
    url: 'https://mycubacash.com',
    siteName: 'mycubacash.com',
    type: 'website'
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="es"><body>{children}</body></html>;
}
