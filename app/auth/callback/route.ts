import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function safeNext(value:string|null){
  if(!value || !value.startsWith('/') || value.startsWith('//')) return '/en/start';
  return value;
}

export async function GET(request:NextRequest){
  const url=new URL(request.url);
  const code=url.searchParams.get('code');
  const next=safeNext(url.searchParams.get('next'));

  if(!code){
    const destination=new URL('/en/auth',url.origin);
    destination.searchParams.set('error','confirmation_missing_code');
    return NextResponse.redirect(destination);
  }

  try{
    const supabase=await supabaseServer();
    const {error}=await supabase.auth.exchangeCodeForSession(code);
    if(error){
      const destination=new URL('/en/auth',url.origin);
      destination.searchParams.set('error','confirmation_failed');
      return NextResponse.redirect(destination);
    }
    return NextResponse.redirect(new URL(next,url.origin));
  }catch{
    const destination=new URL('/en/auth',url.origin);
    destination.searchParams.set('error','confirmation_failed');
    return NextResponse.redirect(destination);
  }
}
