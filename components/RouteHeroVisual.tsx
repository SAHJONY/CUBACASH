'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

const IMG=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&fm=jpg&q=88&w=2600`;
const visuals:Record<string,string>={
  '/remittances':IMG('photo-1609676678267-950d4856294a'),
  '/start':IMG('photo-1516627145497-ae6968895b74'),
  '/fees':IMG('photo-1556761175-4b46a572b786'),
  '/tarifas':IMG('photo-1556761175-4b46a572b786'),
  '/how-it-works':IMG('photo-1786477186200-1e33caefa12e'),
  '/como-funciona':IMG('photo-1786477186200-1e33caefa12e'),
  '/local-services':IMG('photo-1617347454431-f49d7ff5c3b1'),
  '/delivery-providers':IMG('photo-1583691791840-3b3235d5b9f3'),
  '/delivery':IMG('photo-1583691791840-3b3235d5b9f3'),
  '/providers/join':IMG('photo-1521737711867-e3b97375f902'),
  '/catalog':IMG('photo-1722745604035-b00591ddc896'),
  '/payments':IMG('photo-1556761175-b413da4baf72'),
  '/about':IMG('photo-1509240320968-c84e69a2ffc1'),
  '/contact':IMG('photo-1573496799652-408c2ac9fe98'),
  '/contacto':IMG('photo-1573496799652-408c2ac9fe98'),
  '/faq':IMG('photo-1588614380352-e8533179653b'),
  '/quick-start':IMG('photo-1583691791840-3b3235d5b9f3'),
  '/guia-rapida':IMG('photo-1583691791840-3b3235d5b9f3'),
};

export default function RouteHeroVisual(){
  const pathname=usePathname()||'';
  useEffect(()=>{
    const clean=pathname.replace(/^\/(es|en|fr|pt|ar)/,'')||'/';
    const src=visuals[clean];
    if(src) document.documentElement.style.setProperty('--route-hero-image',`url("${src}")`);
    else document.documentElement.style.removeProperty('--route-hero-image');
    document.documentElement.toggleAttribute('data-route-visual',Boolean(src));
    return()=>{document.documentElement.style.removeProperty('--route-hero-image');document.documentElement.removeAttribute('data-route-visual')};
  },[pathname]);
  return null;
}
