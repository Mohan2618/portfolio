import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './App.css';

const sections = [
  ['PROFILE', 'Your name, role, bio and contact details.'],
  ['SKILLS', 'Manage technologies and proficiency levels.'],
  ['PROJECTS', 'Add, edit and reorder portfolio projects.'],
  ['EXPERIENCE', 'Manage internships and professional experience.'],
  ['EDUCATION', 'Manage degrees and academic details.'],
  ['CERTIFICATIONS', 'Manage certifications and credentials.'],
  ['SOCIAL LINKS', 'Control links shown in the contact section.'],
  ['SITE SETTINGS', 'Manage hero, footer and site-wide text.']
];

const emptyProfile = { name: '', role: '', tagline: '', about: '', location: '', initials: '', avatar_url: '', resume_url: '', email: '' };

function ProfileEditor({ userId }) {
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
      if (loadError) setError(loadError.message);
      else if (data) setProfile({ ...emptyProfile, ...data });
      setLoading(false);
    };
    load();
  }, []);

  const update = (field, value) => setProfile(current => ({ ...current, [field]: value }));

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    if (!userId) { setError('Your session has expired. Please sign in again.'); setSaving(false); return; }

    const payload = {
      id: userId,
      name: profile.name.trim(),
      role: profile.role,
      tagline: profile.tagline,
      about: profile.about,
      location: profile.location,
      initials: profile.initials,
      avatar_url: profile.avatar_url,
      resume_url: profile.resume_url,
      email: profile.email
    };

    const { data: savedProfile, error: saveError } = await supabase.from('profiles').update(payload).eq('id', userId).select('*').single();
    if (saveError) setError(saveError.message);
    else { setProfile({ ...emptyProfile, ...savedProfile }); setMessage('Profile saved successfully. Refresh the public site to see the changes.'); }
    setSaving(false);
  };

  if (loading) return <div className="editor-status">LOADING PROFILE...</div>;

  return (
    <div className="editor-panel">
      <div className="editor-heading">
        <div><span className="eyebrow">01 / PROFILE</span><h2>Profile <span>Editor.</span></h2></div>
        <div className="editor-heading-actions"><span className="editor-live">● LIVE DATA</span><a href="/" className="admin-secondary-button">PUBLIC PORTFOLIO ↗</a><button type="submit" form="profile-editor-form" className="admin-primary-button editor-save-top" disabled={saving}>{saving ? "SAVING..." : "SAVE PROFILE →"}</button></div>
      </div>
      <form id="profile-editor-form" className="editor-form" onSubmit={save}>
        <div className="editor-fields">
          {[['name','NAME','Your full name'],['role','ROLE','Your professional role'],['tagline','TAGLINE','Short introduction'],['location','LOCATION','City, country'],['email','PUBLIC EMAIL','Contact email'],['initials','INITIALS','e.g. ML'],['avatar_url','AVATAR URL','Optional image URL'],['resume_url','RESUME URL','Optional resume URL']].map(([field,label,placeholder]) => (
            <label key={field}>{label}<input value={profile[field] || ''} onChange={e => update(field,e.target.value)} placeholder={placeholder} /></label>
          ))}
          <label className="full-field">ABOUT<textarea value={profile.about || ''} onChange={e => update('about',e.target.value)} placeholder="Write your portfolio introduction..." rows="7" /></label>
        </div>
        {error && <div className="admin-error">{error}</div>}
        {message && <div className="editor-success">{message}</div>}
        <button className="admin-primary-button editor-save-bottom" disabled={saving}>{saving ? 'SAVING...' : 'SAVE PROFILE →'}</button>
      </form>
    </div>
  );
}


function SkillsEditor() {
  const emptySkill = { name: '', category: '', level: 80, display_order: 0 };
  const [skills, setSkills] = useState([]);
  const [draft, setDraft] = useState(emptySkill);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadSkills = async () => {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.from('skills').select('*').order('display_order', { ascending: true }).order('id', { ascending: true });
    if (loadError) setError(loadError.message);
    else setSkills(data || []);
    setLoading(false);
  };

  useEffect(() => { loadSkills(); }, []);

  const updateDraft = (field, value) => setDraft(current => ({ ...current, [field]: value }));

  const resetForm = () => {
    setDraft({ ...emptySkill, display_order: skills.length });
    setEditingId(null);
    setMessage('');
    setError('');
  };

  const saveSkill = async event => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const payload = {
      name: draft.name.trim(),
      category: draft.category.trim(),
      level: Math.max(0, Math.min(100, Number(draft.level) || 0)),
      display_order: Math.max(0, Number(draft.display_order) || 0)
    };

    if (!payload.name) {
      setError('Skill name is required.');
      setSaving(false);
      return;
    }

    const query = editingId
      ? supabase.from('skills').update(payload).eq('id', editingId).select('*').single()
      : supabase.from('skills').insert(payload).select('*').single();

    const { data, error: saveError } = await query;
    if (saveError) {
      setError(saveError.message);
    } else {
      setMessage(editingId ? 'Skill updated successfully.' : 'Skill added successfully.');
      if (editingId) setSkills(current => current.map(item => item.id === editingId ? data : item));
      else setSkills(current => [...current, data].sort((a, b) => (a.display_order - b.display_order) || (a.id - b.id)));
      resetForm();
    }
    setSaving(false);
  };

  const editSkill = skill => {
    setEditingId(skill.id);
    setDraft({ name: skill.name || '', category: skill.category || '', level: skill.level ?? 80, display_order: skill.display_order ?? 0 });
    setMessage('');
    setError('');
  };

  const deleteSkill = async id => {
    if (!window.confirm('Delete this skill from your portfolio?')) return;
    setError('');
    setMessage('');
    const { error: deleteError } = await supabase.from('skills').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else {
      setSkills(current => current.filter(item => item.id !== id));
      if (editingId === id) resetForm();
      setMessage('Skill deleted successfully.');
    }
  };

  return (
    <div className="editor-panel">
      <div className="editor-heading">
        <div><span className="eyebrow">02 / SKILLS</span><h2>Skills <span>Editor.</span></h2></div>
        <div className="editor-heading-actions"><span className="editor-live">● LIVE DATA</span><a href="/" className="admin-secondary-button">PUBLIC PORTFOLIO ↗</a></div>
      </div>

      <form className="skill-editor-form" onSubmit={saveSkill}>
        <div className="skill-editor-title">{editingId ? 'EDIT SKILL' : 'ADD SKILL'}</div>
        <div className="editor-fields">
          <label>SKILL NAME<input value={draft.name} onChange={e => updateDraft('name', e.target.value)} placeholder="React" required /></label>
          <label>CATEGORY<input value={draft.category} onChange={e => updateDraft('category', e.target.value)} placeholder="Frontend" /></label>
          <label>PROFICIENCY %<input type="number" min="0" max="100" value={draft.level} onChange={e => updateDraft('level', e.target.value)} /></label>
          <label>DISPLAY ORDER<input type="number" min="0" value={draft.display_order} onChange={e => updateDraft('display_order', e.target.value)} /></label>
        </div>
        <div className="skill-form-actions">
          <button className="admin-primary-button" disabled={saving}>{saving ? 'SAVING...' : editingId ? 'UPDATE SKILL →' : 'ADD SKILL →'}</button>
          {editingId && <button type="button" className="admin-secondary-button" onClick={resetForm}>CANCEL</button>}
        </div>
      </form>

      {error && <div className="admin-error editor-message">{error}</div>}
      {message && <div className="editor-success editor-message">{message}</div>}

      <div className="skills-admin-list">
        <div className="skills-admin-list-head"><span>SKILL</span><span>CATEGORY</span><span>LEVEL</span><span>ORDER</span><span>ACTIONS</span></div>
        {loading ? <div className="editor-status">LOADING SKILLS...</div> : skills.length === 0 ? <div className="editor-status">NO SKILLS YET. ADD YOUR FIRST SKILL ABOVE.</div> : skills.map(skill => (
          <div className="skill-admin-row" key={skill.id}>
            <strong>{skill.name}</strong><span>{skill.category || '—'}</span><span>{skill.level}%</span><span>{skill.display_order}</span>
            <div className="skill-row-actions"><button className="admin-secondary-button" onClick={() => editSkill(skill)}>EDIT</button><button className="admin-danger-button" onClick={() => deleteSkill(skill.id)}>DELETE</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('PROFILE');

  useEffect(() => {
    let mounted = true;
    const checkAdmin = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) { window.location.href = '/?admin=login'; return; }
      const currentUser = sessionData.session.user;
      const { data: adminUser, error: adminError } = await supabase.from('admin_users').select('user_id').eq('user_id', currentUser.id).maybeSingle();
      if (adminError || !adminUser) {
        await supabase.auth.signOut();
        if (mounted) { setError('Your account is not authorized to access the admin dashboard.'); setChecking(false); }
        return;
      }
      if (mounted) { setUser(currentUser); setAuthorized(true); setChecking(false); }
    };
    checkAdmin();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT' || !session) window.location.href = '/?admin=login'; });
    return () => { mounted = false; authListener.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

  if (checking) return <div className="admin-shell"><main className="admin-loading"><span className="eyebrow">AUTHENTICATING</span><h1>ADMIN<span>.</span></h1></main></div>;
  if (!authorized) return <div className="admin-shell"><main className="admin-loading"><span className="eyebrow">ACCESS DENIED</span><h1>ADMIN<span>.</span></h1><p className="admin-error">{error}</p><a className="admin-back-link" href="/">← Back to portfolio</a></main></div>;

  return (
    <div className="admin-shell admin-app">
      <div className="admin-bg-grid" /><div className="admin-glow admin-glow-a" /><div className="admin-glow admin-glow-b" />
      <header className="admin-header"><div><span className="eyebrow">CONTROL CENTER</span><h1>PORTFOLIO<span>.</span></h1></div><div className="admin-header-actions"><a href="/" className="admin-secondary-button">VIEW SITE ↗</a><button onClick={signOut} className="admin-secondary-button">SIGN OUT</button></div></header>
      <main className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-user"><span className="admin-label">SIGNED IN AS</span><strong>{user?.email}</strong><span className="admin-badge">● ADMIN ACCESS</span></div>
          <nav className="admin-side-nav">
            {sections.map(([title, description], index) => <button key={title} className={selected === title ? 'admin-side-item active' : 'admin-side-item'} onClick={() => setSelected(title)}><span>0{index + 1}</span><div><strong>{title}</strong><small>{description}</small></div></button>)}
          </nav>
        </aside>
        <section className="admin-editor-area">
          {selected === 'PROFILE' ? <ProfileEditor userId={user.id} /> : selected === 'SKILLS' ? <SkillsEditor /> : <div className="editor-placeholder"><span className="eyebrow">COMING NEXT</span><h2>{selected} <span>EDITOR.</span></h2><p>This section is ready for its database editor. Select Profile to test the first live editor.</p></div>}
        </section>
      </main>
    </div>
  );
}
