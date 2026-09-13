'use client';

import {useState} from 'react';

type Props={locale:string;es:boolean};

export default function ShareAppButton({locale,es}:Props){
  const [copied,setCopied]=useState(false);

  async function share(){
    const url=`${window.location.origin}/${locale}`;
    const data={
      title:'MY CUBA CASH',
      text:es
        ?'Conoce MY CUBA CASH: remesas familiares, servicios y marketplace privado.'
        :'Discover MY CUBA CASH: family remittances, services and a private marketplace.',
      url
    };

    if(navigator.share){
      try{
        await navigator.share(data);
        return;
      }catch(error){
        if(error instanceof DOMException&&error.name==='AbortError') return;
      }
    }

    try{
      await navigator.clipboard.writeText(url);
    }catch{
      const input=document.createElement('textarea');
      input.value=url;
      input.style.position='fixed';
      input.style.opacity='0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }

    setCopied(true);
    window.setTimeout(()=>setCopied(false),2200);
  }

  return <button type="button" className="glassCta shareAppButton" onClick={share} aria-label={es?'Compartir MY CUBA CASH':'Share MY CUBA CASH'}>{copied?(es?'Enlace copiado':'Link copied'):(es?'Compartir MY CUBA CASH':'Share MY CUBA CASH')}</button>;
}
