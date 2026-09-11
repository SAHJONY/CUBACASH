import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAHJONY CUBACASH',
  description: 'Private-sector economy operating platform'
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="es"><body>{children}</body></html>;
}
