'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { localeOf } from '@/lib/i18n';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function AuthPage(){
  const params=useParams<{locale:string}>();
  const searchParams=useSearchParams();
  const locale=localeOf(params?.locale);
  const supabase=useMemo(()=>supabaseBrowser(),[]);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [mode,setMode]=useState<'signin'|'signup'>('signin');
  const [message,setMessage]=useState(()=>{
    const error=searchParams.get('error');
    if(error==='confirmation_failed') return 'We could not complete email confirmation. Please request a new confirmation email and try again.';
    if(error==='confirmation_missing_code') return 'That confirmation link is incomplete or expired. Please request a new confirmation email.';
    return '';
  });
  const [busy,setBusy]=useState(false);
  const [awaitingConfirmation,setAwaitingConfirmation]=useState(false);

  function callbackUrl(){
    return `${window.location.origin}/auth/callback?next=/${locale}/start`;
  }

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try{
      if(mode==='signup'){
        const {data,error}=await supabase.auth.signUp({
          email,
          password,
          options:{emailRedirectTo:callbackUrl()}
        });
        if(error) throw error;
        if(data.session){
          window.location.href=`/${locale}/start`;
          return;
        }
        setAwaitingConfirmation(true);
        setMessage(`Account created for ${email}. Check your inbox and click the confirmation link to activate the account.`);
      }else{
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        window.location.href=`/${locale}/start`;
        return;
      }
    }catch(error){
      setMessage(error instanceof Error?error.message:'Authentication failed.');
    }finally{
      setBusy(false);
    }
  }

  async function resend(){
    if(!email) return;
    setBusy(true);
    setMessage('');
    try{
      const {error}=await supabase.auth.resend({
        type:'signup',
        email,
        options:{emailRedirectTo:callbackUrl()}
      });
      if(error) throw error;
      setAwaitingConfirmation(true);
      setMessage(`A new confirmation email was sent to ${email}. Check spam or junk if you do not see it.`);
    }catch(error){
      setMessage(error instanceof Error?error.message:'Could not resend confirmation email.');
    }finally{
      setBusy(false);
    }
  }

  return <main className="shell">
    <nav className="nav">
      <a href={`/${locale}`} className="brandwrap"><div className="brand">mycubacash.com</div><small>Secure Customer Access</small></a>
      <div className="navlinks"><a href={`/${locale}`}>Home</a><a href={`/${locale}/marketplace`}>Marketplace</a><a href={`/${locale}/delivery-providers`}>Delivery</a></div>
    </nav>

    <section className="section" style={{maxWidth:720,margin:'0 auto'}}>
      <div className="sectionHead"><div><span className="eyebrow">CUSTOMER ACCOUNT</span><h1>{mode==='signin'?'Sign in to mycubacash':'Create your mycubacash account'}</h1></div><p>Use your account to keep your remittance, marketplace and delivery activity tied to one verified platform identity.</p></div>
      <form onSubmit={submit} className="feature" style={{display:'grid',gap:16}}>
        <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}/></label>
        <label>Password<input required minLength={8} type="password" autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} style={{width:'100%',padding:12,marginTop:6}}/></label>
        <button className="cta" type="submit" disabled={busy}>{busy?'Please wait…':mode==='signin'?'Sign In':'Create Account'}</button>
        {message&&<p role="status" aria-live="polite">{message}</p>}
        {mode==='signup'&&awaitingConfirmation&&<button className="ghost" type="button" onClick={resend} disabled={busy}>Resend confirmation email</button>}
      </form>
      <div className="actions" style={{marginTop:18}}>
        <button className="ghost" type="button" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('');setAwaitingConfirmation(false)}}>{mode==='signin'?'New here? Create an account':'Already have an account? Sign in'}</button>
      </div>
      <p className="sectionCopy">New accounts may require email confirmation before sign-in. Never share one-time codes or passwords with delivery providers, businesses or other users. mycubacash staff and Sofia should not ask for your account password.</p>
    </section>
  </main>;
}
