import type { Metadata } from 'next';
import './globals.css';
import './premium.css';
import './responsive.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://mycubacash.com'),
  title: {
    default: 'mycubacash.com | Remesas familiares, pagos comerciales y marketplace privado',
    template: '%s | mycubacash.com'
  },
  description: 'Remesas familiares, pagos a negocios privados, servicios de entrega verificados y marketplace del sector privado con seguimiento de transacciones y asistencia por WhatsApp Business.',
  applicationName: 'mycubacash.com',
  alternates: { canonical: '/es', languages: { es: '/es', en: '/en', fr: '/fr', pt: '/pt', ar: '/ar' } },
  openGraph: {
    title: 'mycubacash.com',
    description: 'Apoya a tu familia, paga negocios privados y sigue tus transacciones dentro de una red más transparente.',
    url: 'https://mycubacash.com/es',
    siteName: 'mycubacash.com',
    locale: 'es_US',
    type: 'website'
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="es"><body>{children}</body></html>;
}
