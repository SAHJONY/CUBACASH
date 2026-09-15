'use client';

import {usePathname} from 'next/navigation';
import {APP_COMMUNICATIONS,whatsappUrl} from '@/lib/communications';
import {localeOf} from '@/lib/i18n';

export default function GlobalBrandContact(){
  const pathname=usePathname()||'/es';
  const locale=localeOf(pathname.split('/')[1]);
  const es=locale==='es';
  const support=APP_COMMUNICATIONS.whatsappPrimary;
  return <footer className="globalBrandContact" aria-label={es?'Marca y contacto de MY CUBA CASH':'MY CUBA CASH brand and contact'}>
    <div className="globalBrandContactInner">
      <div className="globalBrandIdentity">
        <strong>MY CUBA CASH</strong>
        <span>{es?'Operado por SAHJONY LLC':'Operated by SAHJONY LLC'}</span>
      </div>
      <div className="globalBrandLinks">
        <a href="https://www.mycubacash.com">www.mycubacash.com</a>
        <a href={whatsappUrl(support.e164,es?'Hola, necesito información sobre MY CUBA CASH.':'Hello, I need information about MY CUBA CASH.')}>{support.label} {support.display}</a>
        <a href={`/${locale}/contact`}>{es?'Contacto':'Contact'}</a>
        <a href={`/${locale}/about`}>{es?'Quiénes somos':'About'}</a>
        <a href={`/${locale}/privacy`}>{es?'Privacidad':'Privacy'}</a>
        <a href={`/${locale}/terms`}>{es?'Términos':'Terms'}</a>
      </div>
    </div>
  </footer>;
}
