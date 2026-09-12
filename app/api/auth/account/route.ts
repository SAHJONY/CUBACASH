import {NextRequest, NextResponse} from 'next/server';
import {supabaseServer} from '@/lib/supabase/server';

function safeNext(value:unknown){
  if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')) return '/es/start';
  return value;
}

export async function POST(request:NextRequest){
  try{
    const body=await request.json();
    const action=body?.action;
    const email=typeof body?.email==='string'?body.email.trim():'';
    const password=typeof body?.password==='string'?body.password:'';
    const next=safeNext(body?.next);
    const supabase=await supabaseServer();

    if(!email) return NextResponse.json({ok:false,error:'EMAIL_REQUIRED'},{status:400});

    if(action==='signin'){
      if(!password) return NextResponse.json({ok:false,error:'PASSWORD_REQUIRED'},{status:400});
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error) return NextResponse.json({ok:false,error:error.message},{status:error.status||400});
      return NextResponse.json({ok:true,next});
    }

    const origin=request.nextUrl.origin;
    const emailRedirectTo=`${origin}/auth/callback?next=${encodeURIComponent(next)}`;

    if(action==='signup'){
      if(password.length<8) return NextResponse.json({ok:false,error:'PASSWORD_TOO_SHORT'},{status:400});
      const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo}});
      if(error) return NextResponse.json({ok:false,error:error.message},{status:error.status||400});
      return NextResponse.json({ok:true,next,hasSession:Boolean(data.session),awaitingConfirmation:!data.session});
    }

    if(action==='resend'){
      const {error}=await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo}});
      if(error) return NextResponse.json({ok:false,error:error.message},{status:error.status||400});
      return NextResponse.json({ok:true});
    }

    return NextResponse.json({ok:false,error:'INVALID_ACTION'},{status:400});
  }catch(error){
    console.error('auth-account-route',error);
    return NextResponse.json({ok:false,error:'AUTH_SERVICE_UNAVAILABLE'},{status:503});
  }
}
