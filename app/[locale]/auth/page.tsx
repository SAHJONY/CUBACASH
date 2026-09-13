'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { localeOf } from '@/lib/i18n';
import { supabaseBrowser } from '@/lib/supabase/client';

function safeNext(value:string|null,locale:string){
  if(!value||!value.startsWith('/')||value.startsWith('//')) return `/${locale}/start`;
  return value;
}

export default function AuthPage(){
  const params=useParams<{locale:string}>();
  const searchParams=useSearchParams();
  const locale=localeOf(params?.locale);
  const es=locale==='es';
  const supabase=useMemo(()=>supabaseBrowser(),[]);
  const next=safeNext(searchParams.get('next'),locale);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [mode,setMode]=useState<'signin'|'signup'>('signin');
  const [message,setMessage]=useState(()=>{
    const error=searchParams.get('error');
    if(error==='confirmation_failed') return es?'No pudimos completar la confirmación del correo. Solicita un nuevo enlace e inténtalo otra vez.':'We could not complete email confirmation. Please request a new confirmation email and try again.';
    if(error==='confirmation_missing_code') return es?'Ese enlace de confirmación está incompleto o expiró. Solicita uno nuevo.':'That confirmation link is incomplete or expired. Please request a new confirmation email.';
    return '';
  });
  const [busy,setBusy]=useState(false);
  const [awaitingConfirmation,setAwaitingConfirmation]=useState(false);

  function callbackUrl(){
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try{
      if(mode==='signup'){
        const {data,error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:callbackUrl()}});
        if(error) throw error;
        if(data.session){window.location.href=next;return;}
        setAwaitingConfirmation(true);
        setMessage(es?`Cuenta creada para ${email}. Revisa tu correo y confirma la cuenta.`:`Account created for ${email}. Check your inbox and click the confirmation link to activate the account.`);
      }else{
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        window.location.href=next;
        return;
      }
    }catch(error){
      setMessage(error instanceof Error?error.message:(es?'Falló la autenticación.':'Authentication failed.'));
    }finally{setBusy(false);}
  }

  async function resend(){
    if(!email) return;
    setBusy(true);setMessage('');
    try{
      const {error}=await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo:callbackUrl()}});
      if(error) throw error;
      setAwaitingConfirmation(true);
      setMessage(es?`Se envió un nuevo correo de confirmación a ${email}. Revisa también spam.`:`A new confirmation email was sent to ${email}. Check spam or junk if you do not see it.`);
    }catch(error){setMessage(error instanceof Error?error.message:(es?'No se pudo reenviar el correo de confirmación.':'Could not resend confirmation email.'));}
    finally{setBusy(false);}
  }

  return <main className="shell premiumAppShell">
    <nav className="nav premiumNav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">MY CUBA CASH</div><small>{es?'Acceso seguro':'Secure Access'}</small></a>
      <div className="navlinks"><a href={`/${locale}`}>{es?'Inicio':'Home'}</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/delivery-providers`}>{es?'Proveedores':'Delivery'}</a></div>
    </nav>

    <section className="section" style={{maxWidth:720,margin:'0 auto'}}>
      <div className="sectionHead"><div><span className="eyebrow">{es?'CUENTA MY CUBA CASH':'MY CUBA CASH ACCOUNT'}</span><h1>{mode==='signin'?(es?'Inicia sesión en MY CUBA CASH':'Sign in to MY CUBA CASH'):(es?'Crea tu cuenta MY CUBA CASH':'Create your MY CUBA CASH account')}</h1></div><p>{next.includes('/command-center')?(es?'Después de iniciar sesión volverás directamente al Centro de Comando del Propietario.':'After sign-in you will return directly to the Owner Command Center.'):(es?'Usa tu cuenta para mantener tus operaciones vinculadas a una identidad segura.':'Use your account to keep your activity tied to one secure identity.')}</p></div>
      <form onSubmit={submit} className="feature premiumCard" style={{display:'grid',gap:16}}>
        <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}/></label>
        <label>{es?'Contraseña':'Password'}<input required minLength={8} type="password" autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}/></label>
        <button className="cta premiumCta" type="submit" disabled={busy}>{busy?(es?'Espera…':'Please wait…'):mode==='signin'?(es?'Iniciar sesión':'Sign In'):(es?'Crear cuenta':'Create Account')}</button>
        {message&&<p role="status" aria-live="polite">{message}</p>}
        {mode==='signup'&&awaitingConfirmation&&<button className="ghost" type="button" onClick={resend} disabled={busy}>{es?'Reenviar correo de confirmación':'Resend confirmation email'}</button>}
      </form>
      <div className="actions" style={{marginTop:18}}><button className="ghost" type="button" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('');setAwaitingConfirmation(false)}}>{mode==='signin'?(es?'¿Nuevo aquí? Crear cuenta':'New here? Create an account'):(es?'¿Ya tienes cuenta? Inicia sesión':'Already have an account? Sign in')}</button></div>
      <p className="sectionCopy">{es?'Nunca compartas contraseñas ni códigos de acceso. Sofia y el personal de MY CUBA CASH no deben pedir tu contraseña.':'Never share one-time codes or passwords. Sofia and MY CUBA CASH staff should not ask for your account password.'}</p>
    </section>
  </main>;
}
