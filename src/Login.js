import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setBusy(true); setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setBusy(false); return; }
    const { data: admin, error: adminError } = await supabase.from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
    if (adminError || !admin) { await supabase.auth.signOut(); setError('This account is not authorized as an admin.'); setBusy(false); return; }
    window.location.assign('/?admin=dashboard&section=CONTROL_CENTER');
  };

  return <div className="admin-shell"><div className="admin-bg-grid"/><div className="admin-glow admin-glow-a"/><div className="admin-glow admin-glow-b"/><main className="login-page"><div className="login-card tilt-admin-card"><span className="eyebrow">PRIVATE AREA</span><h1>ADMIN<span>.</span></h1><p className="admin-muted">Sign in to manage your portfolio.</p><form onSubmit={submit} className="admin-form"><label>EMAIL<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label><label>PASSWORD<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>{error&&<div className="admin-error">{error}</div>}<button className="admin-primary-button" disabled={busy}>{busy?'SIGNING IN...':'SIGN IN →'}</button></form><a className="admin-back-link" href="/">← BACK TO PORTFOLIO</a></div></main></div>;
}
