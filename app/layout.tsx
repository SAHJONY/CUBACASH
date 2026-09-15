import type { Metadata } from 'next';
import './globals.css';
import './premium.css';
import './responsive.css';
import './founding.css';
import './monetization.css';
import GlobalBrandContact from '@/components/GlobalBrandContact';
import RouteHeroVisual from '@/components/RouteHeroVisual';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mycubacash.com'),
  title: {
    default: 'MY CUBA CASH | Apoyo familiar a Cuba con costos claros',
    template: '%s | MY CUBA CASH'
  },
  description: 'Consulta la tarifa de MY CUBA CASH antes de registrarte, verifica la disponibilidad real de proveedores y recibe apoyo para coordinar solicitudes familiares a Cuba.',
  applicationName: 'MY CUBA CASH',
  alternates: { canonical: '/es', languages: { es: '/es', en: '/en', fr: '/fr', pt: '/pt', ar: '/ar' } },
  openGraph: {
    title: 'MY CUBA CASH',
    description: 'Costos visibles antes del registro, estado real de la red y apoyo claro para familias cubanas.',
    url: 'https://www.mycubacash.com/es',
    siteName: 'MY CUBA CASH',
    locale: 'es_US',
    type: 'website',
    images: [{
      url: '/social/my-cuba-cash-cuba-20260913.jpg',
      width: 1200,
      height: 630,
      type: 'image/jpeg',
      alt: 'Familia cubana y emprendedor privado conectados en el Malecón de La Habana.'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MY CUBA CASH',
    description: 'Consulta costos y disponibilidad real antes de crear una cuenta.',
    images: ['/social/my-cuba-cash-cuba-20260913.jpg']
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="es"><body><RouteHeroVisual/>{children}<GlobalBrandContact/><a href="/sofia" aria-label="Abrir Sofia" style={{position:'fixed',right:'max(18px, env(safe-area-inset-right))',bottom:'max(18px, env(safe-area-inset-bottom))',zIndex:80,display:'inline-flex',alignItems:'center',justifyContent:'center',minHeight:48,padding:'0 18px',borderRadius:999,border:'1px solid rgba(255,255,255,.22)',background:'rgba(8,8,10,.82)',color:'#fff',fontWeight:700,textDecoration:'none',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',boxShadow:'0 16px 48px rgba(0,0,0,.28)'}}>Sofía</a></body></html>;
}
