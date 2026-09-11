'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { localeOf } from '@/lib/i18n';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function AuthPage(){
  const params=useParams<{locale:string}>();
  const locale=localeOf(params?.locale);
  const supabase=useMemo(()=>supabaseBrowser(),[]);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [mode,setMode]=useState<'signin'|'signup'>('signin');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try{
      if(mode==='signup'){
        const {error}=await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}/${locale}/remittances`}});
        if(error) throw error;
        setMessage('Account created. Check your email if confirmation is required.');
      }else{
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        window.location.href=`/${locale}/remittances`;
        return;
      }
    }catch(error){
      setMessage(error instanceof Error?error.message:'Authentication failed.');
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
        {message&&<p role="status">{message}</p>}
      </form>
      <div className="actions" style={{marginTop:18}}>
        <button className="ghost" type="button" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('')}}>{mode==='signin'?'New here? Create an account':'Already have an account? Sign in'}</button>
      </div>
      <p className="sectionCopy">Never share one-time codes or passwords with delivery providers, businesses or other users. mycubacash staff and Sofia should not ask for your account password.</p>
    </section>
  </main>;
}
