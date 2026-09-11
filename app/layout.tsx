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
  description: 'Remesas familiares, pagos a negocios privados, servicios locales verificados y marketplace del sector privado con seguimiento de transacciones y Sofia como copiloto principal.',
  applicationName: 'mycubacash.com',
  alternates: { canonical: '/es', languages: { es: '/es', en: '/en', fr: '/fr', pt: '/pt', ar: '/ar' } },
  openGraph: {
    title: 'mycubacash.com',
    description: 'Apoya a tu familia, compara servicios y sigue tus transacciones con Sofia dentro de una red más transparente.',
    url: 'https://mycubacash.com/es',
    siteName: 'mycubacash.com',
    locale: 'es_US',
    type: 'website'
  }
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="es"><body>{children}<a href="/sofia" aria-label="Abrir Sofia" style={{position:'fixed',right:'max(18px, env(safe-area-inset-right))',bottom:'max(18px, env(safe-area-inset-bottom))',zIndex:80,display:'inline-flex',alignItems:'center',justifyContent:'center',minHeight:48,padding:'0 18px',borderRadius:999,border:'1px solid rgba(255,255,255,.22)',background:'rgba(8,8,10,.82)',color:'#fff',fontWeight:700,textDecoration:'none',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',boxShadow:'0 16px 48px rgba(0,0,0,.28)'}}>Sofia</a></body></html>;
}
