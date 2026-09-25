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



function EducationEditor() {
  const emptyEducation={institution:'',degree:'',field:'',start_date:'',end_date:'',grade:'',description:'',display_order:0};
  const [items,setItems]=useState([]); const [draft,setDraft]=useState(emptyEducation); const [editingId,setEditingId]=useState(null);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState(''); const [error,setError]=useState('');
  const load=async()=>{setLoading(true);setError('');const {data,error:loadError}=await supabase.from('education').select('*').order('display_order',{ascending:true}).order('id',{ascending:true});if(loadError)setError(loadError.message);else setItems(data||[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const update=(field,value)=>setDraft(d=>({...d,[field]:value}));
  const reset=()=>{setDraft({...emptyEducation,display_order:items.length});setEditingId(null);setMessage('');setError('');};
  const save=async event=>{event.preventDefault();setSaving(true);setMessage('');setError('');
    const payload={institution:draft.institution.trim(),degree:draft.degree.trim(),field:draft.field.trim(),start_date:draft.start_date||null,end_date:draft.end_date||null,grade:draft.grade.trim(),description:draft.description.trim(),display_order:Math.max(0,Number(draft.display_order)||0)};
    if(!payload.institution){setError('Institution is required.');setSaving(false);return;}
    const query=editingId?supabase.from('education').update(payload).eq('id',editingId).select('*').single():supabase.from('education').insert(payload).select('*').single();
    const {data,error:saveError}=await query;
    if(saveError)setError(saveError.message);else{setItems(cur=>(editingId?cur.map(x=>x.id===editingId?data:x):[...cur,data]).sort((a,b)=>(a.display_order-b.display_order)||(a.id-b.id)));setMessage(editingId?'Education updated successfully.':'Education added successfully.');reset();}setSaving(false);
  };
  const edit=item=>{setEditingId(item.id);setDraft({institution:item.institution||'',degree:item.degree||'',field:item.field||'',start_date:item.start_date||'',end_date:item.end_date||'',grade:item.grade||'',description:item.description||'',display_order:item.display_order??0});setMessage('');setError('');};
  const remove=async id=>{if(!window.confirm('Delete this education entry?'))return;const {error:deleteError}=await supabase.from('education').delete().eq('id',id);if(deleteError)setError(deleteError.message);else{setItems(cur=>cur.filter(x=>x.id!==id));setMessage('Education deleted successfully.');if(editingId===id)reset();}};
  return <div className="editor-panel">
    <div className="editor-heading"><div><span className="eyebrow">05 / EDUCATION</span><h2>Education <span>Editor.</span></h2></div><div className="editor-heading-actions"><span className="editor-live">● LIVE DATA</span><a href="/" className="admin-secondary-button">PUBLIC PORTFOLIO ↗</a></div></div>
    <form className="project-editor-form" onSubmit={save}><div className="skill-editor-title">{editingId?'EDIT EDUCATION':'ADD EDUCATION'}</div>
      <div className="editor-fields">
        <label>INSTITUTION<input value={draft.institution} onChange={e=>update('institution',e.target.value)} placeholder="SRM University AP" required/></label>
        <label>DEGREE<input value={draft.degree} onChange={e=>update('degree',e.target.value)} placeholder="B.Tech"/></label>
        <label>FIELD / STREAM<input value={draft.field} onChange={e=>update('field',e.target.value)} placeholder="Computer Science & Engineering"/></label>
        <label>GRADE / CGPA<input value={draft.grade} onChange={e=>update('grade',e.target.value)} placeholder="8.5 CGPA"/></label>
        <label>START DATE<input type="date" value={draft.start_date} onChange={e=>update('start_date',e.target.value)}/></label>
        <label>END DATE<input type="date" value={draft.end_date} onChange={e=>update('end_date',e.target.value)}/></label>
        <label>DISPLAY ORDER<input type="number" min="0" value={draft.display_order} onChange={e=>update('display_order',e.target.value)}/></label>
        <label className="full-field">DESCRIPTION<textarea rows="5" value={draft.description} onChange={e=>update('description',e.target.value)} placeholder="Relevant coursework, achievements, activities..."/></label>
      </div>
      <div className="skill-form-actions"><button className="admin-primary-button" disabled={saving}>{saving?'SAVING...':editingId?'UPDATE EDUCATION →':'ADD EDUCATION →'}</button>{editingId&&<button type="button" className="admin-secondary-button" onClick={reset}>CANCEL</button>}</div>
    </form>
    {error&&<div className="admin-error editor-message">{error}</div>}{message&&<div className="editor-success editor-message">{message}</div>}
    <div className="projects-admin-list">{loading?<div className="editor-status">LOADING EDUCATION...</div>:items.length===0?<div className="editor-status">NO EDUCATION YET. ADD YOUR FIRST ENTRY ABOVE.</div>:items.map((item,index)=><div className="project-admin-card" key={item.id}><div className="project-admin-number">0{index+1}</div><div className="project-admin-main"><div className="project-admin-title-row"><h3>{item.degree||'Education'}</h3><span className="project-featured-badge">{item.institution}</span></div><p>{item.field||'Field not specified'}{item.grade?' • '+item.grade:''}</p><div className="project-admin-meta"><span>{item.start_date||'—'} → {item.end_date||'PRESENT'}</span><span>ORDER {item.display_order}</span></div></div><div className="project-row-actions"><button className="admin-secondary-button" onClick={()=>edit(item)}>EDIT</button><button className="admin-danger-button" onClick={()=>remove(item.id)}>DELETE</button></div></div>)}</div>
  </div>;
}

function ExperienceEditor() {
  const emptyExperience = { company:'', role:'', location:'', start_date:'', end_date:'', description:'', technologies:'', display_order:0 };
  const [items,setItems]=useState([]);
  const [draft,setDraft]=useState(emptyExperience);
  const [editingId,setEditingId]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  const load=async()=>{
    setLoading(true); setError('');
    const {data,error:loadError}=await supabase.from('experience').select('*').order('display_order',{ascending:true}).order('id',{ascending:true});
    if(loadError)setError(loadError.message); else setItems(data||[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[]);
  const update=(field,value)=>setDraft(d=>({...d,[field]:value}));
  const reset=()=>{setDraft({...emptyExperience,display_order:items.length});setEditingId(null);setMessage('');setError('');};
  const save=async event=>{
    event.preventDefault(); setSaving(true);setMessage('');setError('');
    const payload={
      company:draft.company.trim(),role:draft.role.trim(),location:draft.location.trim(),
      start_date:draft.start_date||null,end_date:draft.end_date||null,
      description:draft.description.trim(),
      technologies:draft.technologies.split(',').map(x=>x.trim()).filter(Boolean),
      display_order:Math.max(0,Number(draft.display_order)||0)
    };
    if(!payload.company||!payload.role){setError('Company and role are required.');setSaving(false);return;}
    const query=editingId?supabase.from('experience').update(payload).eq('id',editingId).select('*').single():supabase.from('experience').insert(payload).select('*').single();
    const {data,error:saveError}=await query;
    if(saveError)setError(saveError.message);
    else{setItems(cur=>(editingId?cur.map(x=>x.id===editingId?data:x):[...cur,data]).sort((a,b)=>(a.display_order-b.display_order)||(a.id-b.id)));setMessage(editingId?'Experience updated successfully.':'Experience added successfully.');reset();}
    setSaving(false);
  };
  const edit=item=>{setEditingId(item.id);setDraft({company:item.company||'',role:item.role||'',location:item.location||'',start_date:item.start_date||'',end_date:item.end_date||'',description:item.description||'',technologies:Array.isArray(item.technologies)?item.technologies.join(', '):'',display_order:item.display_order??0});setMessage('');setError('');};
  const remove=async id=>{if(!window.confirm('Delete this experience entry?'))return;const {error:deleteError}=await supabase.from('experience').delete().eq('id',id);if(deleteError)setError(deleteError.message);else{setItems(cur=>cur.filter(x=>x.id!==id));setMessage('Experience deleted successfully.');if(editingId===id)reset();}};
  return <div className="editor-panel">
    <div className="editor-heading"><div><span className="eyebrow">04 / EXPERIENCE</span><h2>Experience <span>Editor.</span></h2></div><div className="editor-heading-actions"><span className="editor-live">● LIVE DATA</span><a href="/" className="admin-secondary-button">PUBLIC PORTFOLIO ↗</a></div></div>
    <form className="project-editor-form" onSubmit={save}>
      <div className="skill-editor-title">{editingId?'EDIT EXPERIENCE':'ADD EXPERIENCE'}</div>
      <div className="editor-fields">
        <label>COMPANY<input value={draft.company} onChange={e=>update('company',e.target.value)} placeholder="Company name" required/></label>
        <label>ROLE<input value={draft.role} onChange={e=>update('role',e.target.value)} placeholder="Software Engineer" required/></label>
        <label>LOCATION<input value={draft.location} onChange={e=>update('location',e.target.value)} placeholder="Hyderabad, India"/></label>
        <label>DISPLAY ORDER<input type="number" min="0" value={draft.display_order} onChange={e=>update('display_order',e.target.value)}/></label>
        <label>START DATE<input type="date" value={draft.start_date} onChange={e=>update('start_date',e.target.value)}/></label>
        <label>END DATE<input type="date" value={draft.end_date} onChange={e=>update('end_date',e.target.value)}/></label>
        <label className="full-field">TECHNOLOGIES<input value={draft.technologies} onChange={e=>update('technologies',e.target.value)} placeholder="Java, Spring, React"/></label>
        <label className="full-field">DESCRIPTION<textarea rows="5" value={draft.description} onChange={e=>update('description',e.target.value)} placeholder="Describe your responsibilities and achievements..."/></label>
      </div>
      <div className="skill-form-actions"><button className="admin-primary-button" disabled={saving}>{saving?'SAVING...':editingId?'UPDATE EXPERIENCE →':'ADD EXPERIENCE →'}</button>{editingId&&<button type="button" className="admin-secondary-button" onClick={reset}>CANCEL</button>}</div>
    </form>
    {error&&<div className="admin-error editor-message">{error}</div>}{message&&<div className="editor-success editor-message">{message}</div>}
    <div className="projects-admin-list">{loading?<div className="editor-status">LOADING EXPERIENCE...</div>:items.length===0?<div className="editor-status">NO EXPERIENCE YET. ADD YOUR FIRST ENTRY ABOVE.</div>:items.map((item,index)=><div className="project-admin-card" key={item.id}><div className="project-admin-number">0{index+1}</div><div className="project-admin-main"><div className="project-admin-title-row"><h3>{item.role}</h3><span className="project-featured-badge">{item.company}</span></div><p>{item.description||'No description added.'}</p><div className="project-admin-meta"><span>{item.location||'LOCATION NOT SET'}</span><span>{item.start_date||'—'} → {item.end_date||'PRESENT'}</span><span>{Array.isArray(item.technologies)&&item.technologies.length?item.technologies.join(' · '):'NO TECHNOLOGIES'}</span></div></div><div className="project-row-actions"><button className="admin-secondary-button" onClick={()=>edit(item)}>EDIT</button><button className="admin-danger-button" onClick={()=>remove(item.id)}>DELETE</button></div></div>)}</div>
  </div>;
}

function ProjectsEditor() {
  const emptyProject = { title: '', description: '', image_url: '', github_url: '', live_url: '', technologies: '', featured: false, display_order: 0 };
  const [projects, setProjects] = useState([]);
  const [draft, setDraft] = useState(emptyProject);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    const { data, error: loadError } = await supabase.from('projects').select('*').order('display_order', { ascending: true }).order('id', { ascending: true });
    if (loadError) setError(loadError.message);
    else setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { loadProjects(); }, []);

  const updateDraft = (field, value) => setDraft(current => ({ ...current, [field]: value }));

  const resetForm = () => {
    setDraft({ ...emptyProject, display_order: projects.length });
    setEditingId(null);
    setMessage('');
    setError('');
  };

  const saveProject = async event => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const technologies = draft.technologies
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      image_url: draft.image_url.trim(),
      github_url: draft.github_url.trim(),
      live_url: draft.live_url.trim(),
      technologies,
      featured: Boolean(draft.featured),
      display_order: Math.max(0, Number(draft.display_order) || 0)
    };

    if (!payload.title) {
      setError('Project title is required.');
      setSaving(false);
      return;
    }

    const query = editingId
      ? supabase.from('projects').update(payload).eq('id', editingId).select('*').single()
      : supabase.from('projects').insert(payload).select('*').single();

    const { data, error: saveError } = await query;
    if (saveError) {
      setError(saveError.message);
    } else {
      setMessage(editingId ? 'Project updated successfully.' : 'Project added successfully.');
      if (editingId) setProjects(current => current.map(item => item.id === editingId ? data : item).sort((a, b) => (a.display_order - b.display_order) || (a.id - b.id)));
      else setProjects(current => [...current, data].sort((a, b) => (a.display_order - b.display_order) || (a.id - b.id)));
      resetForm();
    }
    setSaving(false);
  };

  const editProject = project => {
    setEditingId(project.id);
    setDraft({
      title: project.title || '',
      description: project.description || '',
      image_url: project.image_url || '',
      github_url: project.github_url || '',
      live_url: project.live_url || '',
      technologies: Array.isArray(project.technologies) ? project.technologies.join(', ') : '',
      featured: Boolean(project.featured),
      display_order: project.display_order ?? 0
    });
    setMessage('');
    setError('');
  };

  const deleteProject = async id => {
    if (!window.confirm('Delete this project from your portfolio?')) return;
    setError('');
    setMessage('');
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', id);
    if (deleteError) setError(deleteError.message);
    else {
      setProjects(current => current.filter(item => item.id !== id));
      if (editingId === id) resetForm();
      setMessage('Project deleted successfully.');
    }
  };

  return (
    <div className="editor-panel">
      <div className="editor-heading">
        <div><span className="eyebrow">03 / PROJECTS</span><h2>Projects <span>Editor.</span></h2></div>
        <div className="editor-heading-actions"><span className="editor-live">● LIVE DATA</span><a href="/" className="admin-secondary-button">PUBLIC PORTFOLIO ↗</a></div>
      </div>

      <form className="project-editor-form" onSubmit={saveProject}>
        <div className="skill-editor-title">{editingId ? 'EDIT PROJECT' : 'ADD PROJECT'}</div>
        <div className="editor-fields">
          <label>PROJECT TITLE<input value={draft.title} onChange={e => updateDraft('title', e.target.value)} placeholder="Lumina" required /></label>
          <label>DISPLAY ORDER<input type="number" min="0" value={draft.display_order} onChange={e => updateDraft('display_order', e.target.value)} /></label>
          <label>GITHUB URL<input value={draft.github_url} onChange={e => updateDraft('github_url', e.target.value)} placeholder="https://github.com/..." /></label>
          <label>LIVE URL<input value={draft.live_url} onChange={e => updateDraft('live_url', e.target.value)} placeholder="https://..." /></label>
          <label>IMAGE URL<input value={draft.image_url} onChange={e => updateDraft('image_url', e.target.value)} placeholder="Optional project image URL" /></label>
          <label>TECHNOLOGIES<input value={draft.technologies} onChange={e => updateDraft('technologies', e.target.value)} placeholder="React, FastAPI, Supabase" /></label>
          <label className="full-field">DESCRIPTION<textarea value={draft.description} onChange={e => updateDraft('description', e.target.value)} placeholder="Describe what you built and the problem it solves..." rows="5" /></label>
        </div>
        <label className="project-featured-toggle"><input type="checkbox" checked={draft.featured} onChange={e => updateDraft('featured', e.target.checked)} /><span>FEATURE THIS PROJECT ON THE PORTFOLIO</span></label>
        <div className="skill-form-actions">
          <button className="admin-primary-button" disabled={saving}>{saving ? 'SAVING...' : editingId ? 'UPDATE PROJECT →' : 'ADD PROJECT →'}</button>
          {editingId && <button type="button" className="admin-secondary-button" onClick={resetForm}>CANCEL</button>}
        </div>
      </form>

      {error && <div className="admin-error editor-message">{error}</div>}
      {message && <div className="editor-success editor-message">{message}</div>}

      <div className="projects-admin-list">
        {loading ? <div className="editor-status">LOADING PROJECTS...</div> : projects.length === 0 ? <div className="editor-status">NO PROJECTS YET. ADD YOUR FIRST PROJECT ABOVE.</div> : projects.map((project, index) => (
          <div className="project-admin-card" key={project.id}>
            <div className="project-admin-number">0{index + 1}</div>
            <div className="project-admin-main">
              <div className="project-admin-title-row"><h3>{project.title}</h3>{project.featured && <span className="project-featured-badge">FEATURED</span>}</div>
              <p>{project.description || 'No description added.'}</p>
              <div className="project-admin-meta">
                <span>ORDER {project.display_order}</span>
                <span>{Array.isArray(project.technologies) && project.technologies.length ? project.technologies.join(' · ') : 'NO TECHNOLOGIES'}</span>
              </div>
              <div className="project-admin-links">
                {project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer">GITHUB ↗</a>}
                {project.live_url && <a href={project.live_url} target="_blank" rel="noreferrer">LIVE ↗</a>}
              </div>
            </div>
            <div className="project-row-actions"><button className="admin-secondary-button" onClick={() => editProject(project)}>EDIT</button><button className="admin-danger-button" onClick={() => deleteProject(project.id)}>DELETE</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CertificationsEditor() {
  const empty={name:'',issuer:'',issue_date:'',credential_url:'',description:'',display_order:0};
  const [items,setItems]=useState([]),[draft,setDraft]=useState(empty),[editingId,setEditingId]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const load=async()=>{setLoading(true);const {data,error:loadError}=await supabase.from('certifications').select('*').order('display_order',{ascending:true}).order('id',{ascending:true});if(loadError)setError(loadError.message);else setItems(data||[]);setLoading(false);};
  useEffect(()=>{load();},[]);
  const update=(f,v)=>setDraft(d=>({...d,[f]:v}));
  const reset=()=>{setDraft({...empty,display_order:items.length});setEditingId(null);};
  const save=async event=>{event.preventDefault();setSaving(true);setError('');setMessage('');const payload={name:draft.name.trim(),issuer:draft.issuer.trim(),issue_date:draft.issue_date||null,credential_url:draft.credential_url.trim(),description:draft.description.trim(),display_order:Math.max(0,Number(draft.display_order)||0)};if(!payload.name){setError('Certification name is required.');setSaving(false);return;}const query=editingId?supabase.from('certifications').update(payload).eq('id',editingId).select('*').single():supabase.from('certifications').insert(payload).select('*').single();const {data,error:saveError}=await query;if(saveError)setError(saveError.message);else{setItems(x=>(editingId?x.map(i=>i.id===editingId?data:i):[...x,data]).sort((a,b)=>(a.display_order-b.display_order)||(a.id-b.id)));setMessage(editingId?'Certification updated.':'Certification added.');reset();}setSaving(false);};
  const edit=i=>{setEditingId(i.id);setDraft({name:i.name||'',issuer:i.issuer||'',issue_date:i.issue_date||'',credential_url:i.credential_url||'',description:i.description||'',display_order:i.display_order??0});};
  const remove=async id=>{if(!window.confirm('Delete this certification?'))return;const {error:deleteError}=await supabase.from('certifications').delete().eq('id',id);if(deleteError)setError(deleteError.message);else{setItems(x=>x.filter(i=>i.id!==id));setMessage('Certification deleted.');}};
  return <div className="editor-panel"><div className="editor-heading"><div><span className="eyebrow">06 / CERTIFICATIONS</span><h2>Certifications <span>Editor.</span></h2></div><div className="editor-heading-actions"><span className="editor-live">● LIVE DATA</span><a href="/" className="admin-secondary-button">PUBLIC PORTFOLIO ↗</a></div></div>
  <form className="project-editor-form" onSubmit={save}><div className="skill-editor-title">{editingId?'EDIT CERTIFICATION':'ADD CERTIFICATION'}</div><div className="editor-fields"><label>NAME<input value={draft.name} onChange={e=>update('name',e.target.value)} required/></label><label>ISSUER<input value={draft.issuer} onChange={e=>update('issuer',e.target.value)}/></label><label>ISSUE DATE<input type="date" value={draft.issue_date} onChange={e=>update('issue_date',e.target.value)}/></label><label>DISPLAY ORDER<input type="number" min="0" value={draft.display_order} onChange={e=>update('display_order',e.target.value)}/></label><label className="full-field">CREDENTIAL URL<input value={draft.credential_url} onChange={e=>update('credential_url',e.target.value)} placeholder="https://..."/></label><label className="full-field">DESCRIPTION<textarea rows="4" value={draft.description} onChange={e=>update('description',e.target.value)}/></label></div><div className="skill-form-actions"><button className="admin-primary-button" disabled={saving}>{saving?'SAVING...':editingId?'UPDATE →':'ADD CERTIFICATION →'}</button>{editingId&&<button type="button" className="admin-secondary-button" onClick={reset}>CANCEL</button>}</div></form>
  {error&&<div className="admin-error editor-message">{error}</div>}{message&&<div className="editor-success editor-message">{message}</div>}<div className="projects-admin-list">{loading?<div className="editor-status">LOADING...</div>:items.map((i,n)=><div className="project-admin-card" key={i.id}><div className="project-admin-number">0{n+1}</div><div className="project-admin-main"><h3>{i.name}</h3><p>{i.issuer||'Issuer not specified'}{i.issue_date?' • '+i.issue_date:''}</p>{i.credential_url&&<div className="project-admin-links"><a href={i.credential_url} target="_blank" rel="noreferrer">CREDENTIAL ↗</a></div>}</div><div className="project-row-actions"><button className="admin-secondary-button" onClick={()=>edit(i)}>EDIT</button><button className="admin-danger-button" onClick={()=>remove(i.id)}>DELETE</button></div></div>)}</div></div>;
}

function SocialLinksEditor() {
  const empty={platform:'',url:'',icon:'',display_order:0}; const [items,setItems]=useState([]),[draft,setDraft]=useState(empty),[editingId,setEditingId]=useState(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  const load=async()=>{setLoading(true);const {data,error:loadError}=await supabase.from('social_links').select('*').order('display_order',{ascending:true}).order('id',{ascending:true});if(loadError)setError(loadError.message);else setItems(data||[]);setLoading(false);}; useEffect(()=>{load();},[]);
  const update=(f,v)=>setDraft(d=>({...d,[f]:v})); const reset=()=>{setDraft({...empty,display_order:items.length});setEditingId(null);};
  const save=async event=>{event.preventDefault();setSaving(true);setError('');setMessage('');const payload={platform:draft.platform.trim(),url:draft.url.trim(),icon:draft.icon.trim(),display_order:Math.max(0,Number(draft.display_order)||0)};if(!payload.platform||!payload.url){setError('Platform and URL are required.');setSaving(false);return;}const query=editingId?supabase.from('social_links').update(payload).eq('id',editingId).select('*').single():supabase.from('social_links').insert(payload).select('*').single();const {data,error:saveError}=await query;if(saveError)setError(saveError.message);else{setItems(x=>(editingId?x.map(i=>i.id===editingId?data:i):[...x,data]).sort((a,b)=>(a.display_order-b.display_order)||(a.id-b.id)));setMessage(editingId?'Social link updated.':'Social link added.');reset();}setSaving(false);};
  const edit=i=>{setEditingId(i.id);setDraft({platform:i.platform||'',url:i.url||'',icon:i.icon||'',display_order:i.display_order??0});}; const remove=async id=>{if(!window.confirm('Delete this social link?'))return;const {error:deleteError}=await supabase.from('social_links').delete().eq('id',id);if(deleteError)setError(deleteError.message);else{setItems(x=>x.filter(i=>i.id!==id));setMessage('Social link deleted.');}};
  return <div className="editor-panel"><div className="editor-heading"><div><span className="eyebrow">07 / SOCIAL LINKS</span><h2>Social Links <span>Editor.</span></h2></div></div><form className="project-editor-form" onSubmit={save}><div className="skill-editor-title">{editingId?'EDIT SOCIAL LINK':'ADD SOCIAL LINK'}</div><div className="editor-fields"><label>PLATFORM<input value={draft.platform} onChange={e=>update('platform',e.target.value)} placeholder="GitHub" required/></label><label>ICON<input value={draft.icon} onChange={e=>update('icon',e.target.value)} placeholder="github"/></label><label className="full-field">URL<input value={draft.url} onChange={e=>update('url',e.target.value)} placeholder="https://github.com/..." required/></label><label>DISPLAY ORDER<input type="number" min="0" value={draft.display_order} onChange={e=>update('display_order',e.target.value)}/></label></div><div className="skill-form-actions"><button className="admin-primary-button" disabled={saving}>{saving?'SAVING...':editingId?'UPDATE →':'ADD SOCIAL LINK →'}</button>{editingId&&<button type="button" className="admin-secondary-button" onClick={reset}>CANCEL</button>}</div></form>{error&&<div className="admin-error editor-message">{error}</div>}{message&&<div className="editor-success editor-message">{message}</div>}<div className="projects-admin-list">{loading?<div className="editor-status">LOADING...</div>:items.map((i,n)=><div className="project-admin-card" key={i.id}><div className="project-admin-number">0{n+1}</div><div className="project-admin-main"><h3>{i.platform}</h3><p>{i.url}</p></div><div className="project-row-actions"><button className="admin-secondary-button" onClick={()=>edit(i)}>EDIT</button><button className="admin-danger-button" onClick={()=>remove(i.id)}>DELETE</button></div></div>)}</div></div>;
}

function SiteSettingsEditor() {
  const [draft,setDraft]=useState({site_title:'',hero_badge:'',footer_text:'',contact_message:''}),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
  useEffect(()=>{supabase.from('site_settings').select('*').eq('id',1).maybeSingle().then(({data,error:loadError})=>{if(loadError)setError(loadError.message);else if(data)setDraft({site_title:data.site_title||'',hero_badge:data.hero_badge||'',footer_text:data.footer_text||'',contact_message:data.contact_message||''});setLoading(false);});},[]);
  const save=async event=>{event.preventDefault();setSaving(true);setError('');const payload={id:1,site_title:draft.site_title.trim(),hero_badge:draft.hero_badge.trim(),footer_text:draft.footer_text.trim(),contact_message:draft.contact_message.trim(),updated_at:new Date().toISOString()};const {data,error:saveError}=await supabase.from('site_settings').upsert(payload).select('*').single();if(saveError)setError(saveError.message);else{setDraft({site_title:data.site_title||'',hero_badge:data.hero_badge||'',footer_text:data.footer_text||'',contact_message:data.contact_message||''});setMessage('Site settings saved.');}setSaving(false);};
  if(loading)return <div className="editor-status">LOADING SITE SETTINGS...</div>;
  return <div className="editor-panel"><div className="editor-heading"><div><span className="eyebrow">08 / SITE SETTINGS</span><h2>Site <span>Settings.</span></h2></div></div><form className="project-editor-form" onSubmit={save}><div className="editor-fields"><label>SITE TITLE<input value={draft.site_title} onChange={e=>setDraft(d=>({...d,site_title:e.target.value}))}/></label><label>HERO BADGE<input value={draft.hero_badge} onChange={e=>setDraft(d=>({...d,hero_badge:e.target.value}))}/></label><label>FOOTER TEXT<input value={draft.footer_text} onChange={e=>setDraft(d=>({...d,footer_text:e.target.value}))}/></label><label className="full-field">CONTACT MESSAGE<textarea rows="4" value={draft.contact_message} onChange={e=>setDraft(d=>({...d,contact_message:e.target.value}))}/></label></div>{error&&<div className="admin-error editor-message">{error}</div>}{message&&<div className="editor-success editor-message">{message}</div>}<button className="admin-primary-button" disabled={saving}>{saving?'SAVING...':'SAVE SITE SETTINGS →'}</button></form></div>;
}

function ControlCenter({ onSelect }) {
  return <div className="editor-panel control-center-panel">
    <div className="editor-heading">
      <div><span className="eyebrow">ADMIN • CONTROL CENTER</span><h2>Manage your <span>portfolio.</span></h2><p className="admin-muted">Choose a section below to view, edit, or update your portfolio data.</p></div>
      <div className="editor-heading-actions"><a href="/" className="admin-secondary-button">PUBLIC PORTFOLIO ↗</a></div>
    </div>
    <div className="admin-control-grid">
      {sections.map(([title, description], index) => <button key={title} className="admin-control-card" onClick={() => { onSelect(title); window.history.replaceState(null, '', '/?admin=dashboard&section=' + encodeURIComponent(title)); }}><span>0{index + 1}</span><strong>{title}</strong><small>{description}</small><b>OPEN →</b></button>)}
    </div>
  </div>;
}

function Admin() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('CONTROL_CENTER');

  useEffect(() => {
    const requestedSection = new URLSearchParams(window.location.search).get('section');
    const validSections = ['PROFILE', 'SKILLS', 'PROJECTS', 'EXPERIENCE', 'EDUCATION', 'CERTIFICATIONS', 'SOCIAL LINKS', 'SITE SETTINGS'];
    setSelected(validSections.includes(requestedSection) ? requestedSection : 'CONTROL_CENTER');
  }, []);

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
      <header className="admin-header"><div><span className="eyebrow">CONTROL CENTER • BUILD 700A98A</span><h1>PORTFOLIO<span>.</span></h1></div><div className="admin-header-actions"><a href="/" className="admin-secondary-button">VIEW SITE ↗</a><button onClick={signOut} className="admin-secondary-button">SIGN OUT</button></div></header>
      <main className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-user"><span className="admin-label">SIGNED IN AS</span><strong>{user?.email}</strong><span className="admin-badge">● ADMIN ACCESS</span></div>
          <nav className="admin-side-nav">
            <button className={selected === 'CONTROL_CENTER' ? 'admin-side-item active' : 'admin-side-item'} onClick={() => { setSelected('CONTROL_CENTER'); window.history.replaceState(null, '', '/?admin=dashboard&section=CONTROL_CENTER'); }}><span>⌂</span><div><strong>CONTROL CENTER</strong><small>Return to all portfolio editors.</small></div></button>
            {sections.map(([title, description], index) => <button key={title} className={selected === title ? 'admin-side-item active' : 'admin-side-item'} onClick={() => { setSelected(title); window.history.replaceState(null, '', `/?admin=dashboard&section=${encodeURIComponent(title)}`); }}><span>0{index + 1}</span><div><strong>{title}</strong><small>{description}</small></div></button>)}
          </nav>
        </aside>
        <section className="admin-editor-area">
          {selected === 'CONTROL_CENTER' ? <ControlCenter onSelect={setSelected} /> : selected === 'PROFILE' ? <ProfileEditor userId={user.id} /> : selected === 'SKILLS' ? <SkillsEditor /> : selected === 'PROJECTS' ? <ProjectsEditor /> : selected === 'EXPERIENCE' ? <ExperienceEditor /> : selected === 'EDUCATION' ? <EducationEditor /> : selected === 'CERTIFICATIONS' ? <CertificationsEditor /> : selected === 'SOCIAL LINKS' ? <SocialLinksEditor /> : selected === 'SITE SETTINGS' ? <SiteSettingsEditor /> : <ControlCenter onSelect={setSelected} />}
        </section>
      </main>
    </div>
  );
}
