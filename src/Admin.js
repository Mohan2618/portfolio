import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

const SECTIONS = [
  ['PROFILE', 'Edit your personal information, bio, photo and resume.'],
  ['SKILLS', 'Add, edit, delete and reorder technical skills.'],
  ['PROJECTS', 'Manage projects, descriptions, technologies and links.'],
  ['EXPERIENCE', 'Manage internships, roles, dates and technologies.'],
  ['EDUCATION', 'Manage degrees, dates, grades and descriptions.'],
  ['CERTIFICATIONS', 'Manage certificates, issuers, dates and credentials.'],
  ['SOCIAL LINKS', 'Manage the links displayed in the contact section.'],
  ['SITE SETTINGS', 'Control the hero, footer and contact text.']
];

const EMPTY = {
  skills: { name: '', category: '', level: 80, display_order: 0 },
  projects: { title: '', type: '', description: '', technologies: '', github_url: '', live_url: '', featured: false, display_order: 0 },
  experience: { company: '', role: '', location: '', start_date: '', end_date: '', description: '', technologies: '', display_order: 0 },
  education: { institution: '', degree: '', field: '', start_date: '', end_date: '', grade: '', description: '', display_order: 0 },
  certifications: { name: '', issuer: '', issue_date: '', credential_url: '', description: '', display_order: 0 },
  social_links: { platform: '', url: '', icon: '', display_order: 0 }
};

const META = {
  SKILLS: ['skills', 'Skill', ['name', 'category', 'level', 'display_order']],
  PROJECTS: ['projects', 'Project', ['title', 'type', 'description', 'technologies', 'github_url', 'live_url', 'featured', 'display_order']],
  EXPERIENCE: ['experience', 'Experience', ['company', 'role', 'location', 'start_date', 'end_date', 'description', 'technologies', 'display_order']],
  EDUCATION: ['education', 'Education', ['institution', 'degree', 'field', 'start_date', 'end_date', 'grade', 'description', 'display_order']],
  CERTIFICATIONS: ['certifications', 'Certification', ['name', 'issuer', 'issue_date', 'credential_url', 'description', 'display_order']],
  'SOCIAL LINKS': ['social_links', 'Social Link', ['platform', 'url', 'icon', 'display_order']]
};

function normalize(value, field) {
  if (['technologies'].includes(field)) return Array.isArray(value) ? value.join(', ') : value || '';
  return value ?? '';
}

function payloadFor(draft, table) {
  const p = { ...draft };
  if (['skills', 'projects', 'experience', 'education', 'certifications', 'social_links'].includes(table)) {
    if ('display_order' in p) p.display_order = Math.max(0, Number(p.display_order) || 0);
  }
  if (table === 'skills') p.level = Math.max(0, Math.min(100, Number(p.level) || 0));
  if (['projects', 'experience'].includes(table)) p.technologies = String(p.technologies || '').split(',').map(x => x.trim()).filter(Boolean);
  return p;
}

function Field({ name, value, onChange }) {
  const labels = { start_date: 'START DATE', end_date: 'END DATE', display_order: 'DISPLAY ORDER', github_url: 'GITHUB URL', live_url: 'LIVE URL', credential_url: 'CREDENTIAL URL' };
  const label = labels[name] || name.replaceAll('_', ' ').toUpperCase();
  if (name === 'about') return <label className="full-field">ABOUT / BIO<textarea rows="8" value={value} onChange={e => onChange(e.target.value)} /></label>;
  if (name === 'description') return <label className="full-field">{label}<textarea rows="5" value={value} onChange={e => onChange(e.target.value)} /></label>;
  if (name === 'featured') return <label className="project-featured-toggle"><input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} /> FEATURED PROJECT</label>;
  const type = ['start_date', 'end_date', 'issue_date'].includes(name) ? 'date' : ['level', 'display_order'].includes(name) ? 'number' : 'text';
  return <label>{label}<input type={type} value={value} onChange={e => onChange(e.target.value)} /></label>;
}

function CollectionEditor({ section }) {
  const [table, title, fields] = META[section];
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({ ...EMPTY[table] });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    const { data, error: e } = await supabase.from(table).select('*').order('display_order', { ascending: true }).order('id', { ascending: true });
    if (e) setError(e.message); else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [table]);

  const reset = () => { setDraft({ ...EMPTY[table], display_order: items.length }); setEditingId(null); };

  const save = async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const dataToSave = payloadFor(draft, table);
    const result = editingId
      ? await supabase.from(table).update(dataToSave).eq('id', editingId).select('*').single()
      : await supabase.from(table).insert(dataToSave).select('*').single();
    if (result.error) setError(result.error.message);
    else { setMessage(editingId ? title + ' updated successfully.' : title + ' added successfully.'); await load(); reset(); }
    setBusy(false);
  };

  const edit = item => {
    const next = {};
    fields.forEach(f => { next[f] = normalize(item[f], f); });
    setDraft(next); setEditingId(item.id); setError(''); setMessage('');
  };

  const remove = async id => {
    if (!window.confirm('Delete this item permanently?')) return;
    setError(''); setMessage('');
    const { error: e } = await supabase.from(table).delete().eq('id', id);
    if (e) setError(e.message); else { setItems(items.filter(x => x.id !== id)); if (editingId === id) reset(); setMessage(title + ' deleted.'); }
  };

  return <div className="editor-panel">
    <div className="editor-heading">
      <div><span className="eyebrow">{String(SECTIONS.findIndex(x => x[0] === section) + 1).padStart(2, '0')} / {section}</span><h2>{title} <span>Editor.</span></h2></div>
      <div className="editor-heading-actions"><span className="editor-live">● LIVE DATA</span><a href="/" className="admin-secondary-button">VIEW SITE ↗</a></div>
    </div>
    <form className="project-editor-form" onSubmit={save}>
      <div className="skill-editor-title">{editingId ? 'EDIT ' + title.toUpperCase() : 'ADD ' + title.toUpperCase()}</div>
      <div className="editor-fields">{fields.map(field => <Field key={field} name={field} value={draft[field] ?? ''} onChange={value => setDraft(d => ({ ...d, [field]: value }))} />)}</div>
      <div className="skill-form-actions"><button className="admin-primary-button" disabled={busy}>{busy ? 'SAVING...' : editingId ? 'UPDATE →' : 'ADD →'}</button>{editingId && <button type="button" className="admin-secondary-button" onClick={reset}>CANCEL</button>}</div>
    </form>
    {error && <div className="admin-error editor-message">{error}</div>}
    {message && <div className="editor-success editor-message">{message}</div>}
    <div className="projects-admin-list">
      {loading ? <div className="editor-status">LOADING {section}...</div> : items.length === 0 ? <div className="editor-status">NO {section} YET.</div> : items.map((item, index) => (
        <div className="project-admin-card" key={item.id}>
          <div className="project-admin-number">{String(index + 1).padStart(2, '0')}</div>
          <div className="project-admin-main">
            <div className="project-admin-title-row"><h3>{item.name || item.title || item.company || item.institution || item.platform || title}</h3>{item.issuer && <span className="project-featured-badge">{item.issuer}</span>}{item.featured && <span className="project-featured-badge">FEATURED</span>}</div>
            <p>{item.description || item.role || item.degree || item.url || item.category || ''}</p>
            <div className="project-admin-meta"><span>ORDER {item.display_order ?? 0}</span>{item.level !== undefined && <span>{item.level}%</span>}{item.start_date && <span>{item.start_date} → {item.end_date || 'PRESENT'}</span>}</div>
          </div>
          <div className="project-row-actions"><button type="button" className="admin-secondary-button" onClick={() => edit(item)}>EDIT</button><button type="button" className="admin-danger-button" onClick={() => remove(item.id)}>DELETE</button></div>
        </div>
      ))}
    </div>
  </div>;
}

function ProfileEditor({ userId }) {
  const empty = { name: '', role: '', tagline: '', about: '', location: '', initials: '', avatar_url: '', resume_url: '', email: '' };
  const [draft, setDraft] = useState(empty); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { supabase.from('profiles').select('*').limit(1).maybeSingle().then(({ data, error: e }) => { if (e) setError(e.message); else if (data) setDraft({ ...empty, ...data }); setLoading(false); }); }, []);
  const save = async e => { e.preventDefault(); setBusy(true); setError(''); const { error: e2 } = await supabase.from('profiles').update({ ...draft, id: userId, name: draft.name.trim() }).eq('id', userId); if (e2) setError(e2.message); else setMessage('Profile saved successfully.'); setBusy(false); };
  if (loading) return <div className="editor-panel editor-status">LOADING PROFILE...</div>;
  return <div className="editor-panel"><div className="editor-heading"><div><span className="eyebrow">01 / PROFILE</span><h2>Profile <span>Editor.</span></h2></div><div className="editor-heading-actions"><span className="editor-live">● LIVE DATA</span><a href="/" className="admin-secondary-button">VIEW SITE ↗</a></div></div><form className="project-editor-form" onSubmit={save}><div className="editor-fields">{['name','role','tagline','location','email','initials','avatar_url','resume_url'].map(f => <Field key={f} name={f} value={draft[f] || ''} onChange={v => setDraft(d => ({ ...d, [f]: v }))} />)}<Field name="about" value={draft.about || ''} onChange={v => setDraft(d => ({ ...d, about: v }))} /></div>{error && <div className="admin-error">{error}</div>}{message && <div className="editor-success">{message}</div>}<button className="admin-primary-button" disabled={busy}>{busy ? 'SAVING...' : 'SAVE PROFILE →'}</button></form></div>;
}

function SettingsEditor() {
  const empty = { site_title: '', hero_badge: '', footer_text: '', contact_message: '' };
  const [draft, setDraft] = useState(empty); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { supabase.from('site_settings').select('*').eq('id', 1).maybeSingle().then(({ data, error: e }) => { if (e) setError(e.message); else if (data) setDraft({ ...empty, ...data }); setLoading(false); }); }, []);
  const save = async e => { e.preventDefault(); setBusy(true); setError(''); const { error: e2 } = await supabase.from('site_settings').upsert({ ...draft, id: 1, updated_at: new Date().toISOString() }); if (e2) setError(e2.message); else setMessage('Site settings saved successfully.'); setBusy(false); };
  if (loading) return <div className="editor-panel editor-status">LOADING SITE SETTINGS...</div>;
  return <div className="editor-panel"><div className="editor-heading"><div><span className="eyebrow">08 / SITE SETTINGS</span><h2>Site <span>Settings.</span></h2></div></div><form className="project-editor-form" onSubmit={save}><div className="editor-fields"><Field name="site_title" value={draft.site_title} onChange={v => setDraft(d => ({ ...d, site_title: v }))}/><Field name="hero_badge" value={draft.hero_badge} onChange={v => setDraft(d => ({ ...d, hero_badge: v }))}/><Field name="footer_text" value={draft.footer_text} onChange={v => setDraft(d => ({ ...d, footer_text: v }))}/><Field name="contact_message" value={draft.contact_message} onChange={v => setDraft(d => ({ ...d, contact_message: v }))}/></div>{error && <div className="admin-error">{error}</div>}{message && <div className="editor-success">{message}</div>}<button className="admin-primary-button" disabled={busy}>{busy ? 'SAVING...' : 'SAVE SETTINGS →'}</button></form></div>;
}

function ControlCenter({ onSelect }) {
  return <div className="editor-panel control-center-panel"><div className="editor-heading"><div><span className="eyebrow">ADMIN / CONTROL CENTER</span><h2>Manage your <span>portfolio.</span></h2><p className="admin-muted">Select exactly what you want to edit. Changes are saved directly to Supabase and reflected on the public portfolio.</p></div></div><div className="admin-control-grid">{SECTIONS.map(([name, description], i) => <button key={name} className="admin-control-card" onClick={() => onSelect(name)}><span>{String(i + 1).padStart(2, '0')}</span><strong>{name}</strong><small>{description}</small><b>OPEN →</b></button>)}</div></div>;
}

export default function Admin() {
  const [selected, setSelected] = useState('CONTROL_CENTER'); const [checking, setChecking] = useState(true); const [user, setUser] = useState(null); const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError || !data.session) { window.location.assign('/?admin=login'); return; }
      const current = data.session.user;
      const { data: admin, error: adminError } = await supabase.from('admin_users').select('user_id').eq('user_id', current.id).maybeSingle();
      if (adminError || !admin) { await supabase.auth.signOut(); if (mounted) { setError('This account is not authorized as an admin.'); setChecking(false); } return; }
      if (mounted) { setUser(current); setChecking(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT' || !session) window.location.assign('/?admin=login'); });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (SECTIONS.some(x => x[0] === section)) setSelected(section);
  }, []);
  const select = section => { setSelected(section); window.history.replaceState(null, '', '/?admin=dashboard&section=' + encodeURIComponent(section)); };
  const signOut = async () => { await supabase.auth.signOut(); window.location.assign('/'); };
  if (checking) return <div className="admin-shell"><main className="admin-loading"><span className="eyebrow">AUTHENTICATING</span><h1>ADMIN<span>.</span></h1></main></div>;
  if (!user) return <div className="admin-shell"><main className="admin-loading"><span className="eyebrow">ACCESS DENIED</span><h1>ADMIN<span>.</span></h1><p className="admin-error">{error}</p><a className="admin-back-link" href="/">← BACK TO PORTFOLIO</a></main></div>;
  return <div className="admin-shell admin-app"><div className="admin-bg-grid"/><div className="admin-glow admin-glow-a"/><div className="admin-glow admin-glow-b"/>
    <header className="admin-header"><div><span className="eyebrow">PRIVATE ADMIN</span><h1>PORTFOLIO<span>.</span></h1></div><div className="admin-header-actions"><a href="/" className="admin-secondary-button">VIEW SITE ↗</a><button onClick={signOut} className="admin-secondary-button">SIGN OUT</button></div></header>
    <main className="admin-layout"><aside className="admin-sidebar"><div className="admin-user"><span className="admin-label">SIGNED IN AS</span><strong>{user.email}</strong><span className="admin-badge">● ADMIN ACCESS</span></div><nav className="admin-side-nav"><button className={selected === 'CONTROL_CENTER' ? 'admin-side-item active' : 'admin-side-item'} onClick={() => select('CONTROL_CENTER')}><span>⌂</span><div><strong>CONTROL CENTER</strong><small>All portfolio sections.</small></div></button>{SECTIONS.map(([name, desc], i) => <button key={name} className={selected === name ? 'admin-side-item active' : 'admin-side-item'} onClick={() => select(name)}><span>{String(i + 1).padStart(2, '0')}</span><div><strong>{name}</strong><small>{desc}</small></div></button>)}</nav></aside>
      <section className="admin-editor-area">{selected === 'CONTROL_CENTER' ? <ControlCenter onSelect={select}/> : selected === 'PROFILE' ? <ProfileEditor userId={user.id}/> : selected === 'SITE SETTINGS' ? <SettingsEditor/> : <CollectionEditor section={selected}/>}</section></main>
  </div>;
}
