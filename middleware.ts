import {NextRequest,NextResponse} from 'next/server';

const LOCALES=['es','en','fr','pt','ar'] as const;

export function middleware(request:NextRequest){
  const {pathname}=request.nextUrl;
  if(pathname.startsWith('/api/')||pathname.startsWith('/_next/')||pathname==='/favicon.ico'||pathname.includes('.')) return NextResponse.next();
  const first=pathname.split('/').filter(Boolean)[0];
  if(LOCALES.includes(first as (typeof LOCALES)[number])){
    const response=NextResponse.next();
    if(first==='es') response.headers.set('Content-Language','es');
    return response;
  }
  const url=request.nextUrl.clone();
  url.pathname=`/es${pathname==='/'?'':pathname}`;
  return NextResponse.redirect(url,308);
}

export const config={matcher:['/((?!_next/static|_next/image).*)']};
