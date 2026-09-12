import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function safeNext(value:string|null){
  if(!value || !value.startsWith('/') || value.startsWith('//')) return '/es/start';
  return value;
}

function authDestination(url:URL,next:string,error:string){
  const locale=next.split('/')[1]||'es';
  const supported=['es','en','fr','pt','ar'].includes(locale)?locale:'es';
  const destination=new URL(`/${supported}/auth`,url.origin);
  destination.searchParams.set('error',error);
  destination.searchParams.set('next',next);
  return destination;
}

export async function GET(request:NextRequest){
  const url=new URL(request.url);
  const code=url.searchParams.get('code');
  const next=safeNext(url.searchParams.get('next'));

  if(!code) return NextResponse.redirect(authDestination(url,next,'confirmation_missing_code'));

  try{
    const supabase=await supabaseServer();
    const {error}=await supabase.auth.exchangeCodeForSession(code);
    if(error) return NextResponse.redirect(authDestination(url,next,'confirmation_failed'));
    return NextResponse.redirect(new URL(next,url.origin));
  }catch{
    return NextResponse.redirect(authDestination(url,next,'confirmation_failed'));
  }
}
