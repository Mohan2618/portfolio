import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { supabase } from './lib/supabase';
import Login from './Login';
import Admin from './Admin';

const emptyPortfolio = {
  profile: { initials: 'ML', name: '', shortName: '', role: '', tagline: '', about: '', location: '', avatarUrl: '', resumeUrl: '', email: '' },
  skills: [], projects: [], socials: [],
  settings: { heroBadge: 'HELLO, WORLD', footerText: 'BUILT WITH REACT', contactMessage: "Let's build something useful." }
};

function useTilt() {
  const ref = useRef(null);
  const onMove = event => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.setProperty('--rx', (-y * 7) + 'deg');
    el.style.setProperty('--ry', (x * 9) + 'deg');
    el.style.setProperty('--mx', (x * 50 + 50) + '%');
    el.style.setProperty('--my', (y * 50 + 50) + '%');
  };
  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty('--rx', '0deg');
    ref.current.style.setProperty('--ry', '0deg');
    ref.current.style.setProperty('--mx', '50%');
    ref.current.style.setProperty('--my', '50%');
  };
  return { ref, onMouseMove: onMove, onMouseLeave: onLeave };
}

function TiltCard({ children, className = '' }) {
  const tilt = useTilt();
  return <div ref={tilt.ref} className={'tilt-card ' + className} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}><div className="tilt-shine" />{children}</div>;
}

function Navbar({ active, setActive }) {
  const links = ['HOME', 'ABOUT', 'SKILLS', 'PROJECTS', 'RESUME', 'CONTACT'];
  return <header className="navbar"><button className="brand-3d" onClick={() => setActive('HOME')} aria-label="Go home"><span>ML</span></button><nav>{links.map(link => <button key={link} className={active === link ? 'nav-link active' : 'nav-link'} onClick={() => setActive(link)}>{link}</button>)}<a className="nav-link admin-nav-link" href="/?admin=dashboard">ADMIN</a></nav></header>;
}

function Hero({ portfolio, setActive }) {
  return <section className="section hero" id="HOME"><div className="hero-grid" /><div className="orb orb-a" /><div className="orb orb-b" /><div className="hero-copy"><span className="eyebrow">{portfolio.settings.heroBadge}</span><h1>{portfolio.profile.shortName}<span>.</span></h1><div className="hero-role">{portfolio.profile.role}</div><p>{portfolio.profile.tagline}</p><div className="hero-actions"><button className="button-3d primary" onClick={() => setActive('PROJECTS')}>Explore Work</button><button className="button-3d secondary" onClick={() => setActive('CONTACT')}>Let's Connect</button></div></div><TiltCard className="hero-card"><div className="cube-scene"><div className="cube"><span className="front">AI</span><span className="back">ML</span><span className="right">JS</span><span className="left">API</span><span className="top">DEV</span><span className="bottom">SQL</span></div></div><div className="hero-card-meta"><span>BUILDING</span><strong>Ideas → Products</strong></div></TiltCard><span className="scroll-label">SCROLL TO EXPLORE ↓</span></section>;
}

function About({ portfolio }) {
  return <section className="section" id="ABOUT"><div className="section-heading"><span className="eyebrow">01 / ABOUT</span><h2>Behind the <span>builds.</span></h2></div><div className="about-grid"><TiltCard className="profile-card"><div className="avatar-3d">{portfolio.profile.avatarUrl ? <img src={portfolio.profile.avatarUrl} alt={portfolio.profile.name} /> : portfolio.profile.initials}</div><span className="status-dot">AVAILABLE FOR OPPORTUNITIES</span><h3>{portfolio.profile.name}</h3><p>{portfolio.profile.location}</p></TiltCard><div className="about-copy"><p className="lead">{portfolio.profile.about}</p><div className="stats-grid"><TiltCard><strong>AI</strong><span>Applied intelligence</span></TiltCard><TiltCard><strong>WEB</strong><span>Full-stack products</span></TiltCard><TiltCard><strong>API</strong><span>Backend systems</span></TiltCard><TiltCard><strong>CODE</strong><span>Problem solving</span></TiltCard></div></div></div></section>;
}

function Skills({ skills }) {
  return <section className="section" id="SKILLS"><div className="section-heading"><span className="eyebrow">02 / SKILLS</span><h2>A stack built to <span>ship.</span></h2></div><div className="skills-grid">{skills.map(skill => <TiltCard key={skill.id || skill.name} className="skill-card"><div className="skill-top"><span>{skill.name}</span><small>{skill.group}</small></div><div className="skill-bar"><span style={{ width: skill.level + '%' }} /></div><strong>{skill.level}%</strong></TiltCard>)}</div></section>;
}

function projectType(title) {
  const types = { Lumina: 'AI Application', 'ReviewRadar AI': 'AI / Search', AuraSum: 'NLP', TestPilot: 'Developer Tool' };
  return types[title] || 'Project';
}

function Projects({ projects }) {
  return <section className="section" id="PROJECTS"><div className="section-heading"><span className="eyebrow">03 / PROJECTS</span><h2>Things I've <span>built.</span></h2></div><div className="projects-grid">{projects.map((project, index) => <TiltCard key={project.id || project.title} className="project-card"><div className="project-number">0{index + 1}</div><span className="project-type">{project.type || projectType(project.title)}</span><h3>{project.title}</h3><p>{project.description}</p><div className="tags">{(project.tech || []).map(item => <span key={item}>{item}</span>)}</div><div className="project-arrow">↗</div></TiltCard>)}</div></section>;
}

function Experience({ experience }) {
  return <section className="section" id="EXPERIENCE"><div className="section-heading"><span className="eyebrow">04 / EXPERIENCE</span><h2>Where I've <span>worked.</span></h2></div><div className="experience-grid">{experience.map((item,index)=><TiltCard key={item.id||index} className="experience-card"><div className="experience-top"><div><div className="experience-company">{item.company}</div><h3 className="experience-role">{item.role}</h3></div><span className="experience-date">{item.startDate||'—'} → {item.endDate||'PRESENT'}</span></div><div className="experience-location">{item.location}</div><p className="experience-description">{item.description}</p><div className="tags">{item.technologies.map(tech=><span key={tech}>{tech}</span>)}</div></TiltCard>)}</div></section>;
}

function Resume({ portfolio }) {
  return <section className="section resume-section" id="RESUME"><div className="resume-card"><span className="eyebrow">04 / RESUME</span><h2>Ready to <span>connect?</span></h2><p>View the latest resume and learn more about my technical experience.</p><a className="button-3d primary" href={portfolio.profile.resumeUrl || "/portfolio/Resume-AIML.pdf"} target="_blank" rel="noreferrer">View Resume ↗</a></div></section>;
}

function Contact({ portfolio }) {
  return <section className="section contact-section" id="CONTACT"><div className="section-heading"><span className="eyebrow">05 / CONTACT</span><h2>{portfolio.settings.contactMessage}</h2></div><div className="contact-grid">{portfolio.socials.map(item => <TiltCard key={item.id || item.label} className="contact-card"><span className="contact-index">↗</span><small>CONNECT</small><h3>{item.label}</h3><a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{item.href.replace('mailto:', '')}</a></TiltCard>)}</div></section>;
}

async function loadPortfolio() {
  const [ { data: profile, error: profileError }, { data: skills, error: skillsError }, { data: projects, error: projectsError }, { data: experience, error: experienceError }, { data: socials, error: socialsError }, { data: settings, error: settingsError } ] = await Promise.all([
    supabase.from('profiles').select('*').limit(1).maybeSingle(),
    supabase.from('skills').select('*').order('display_order', { ascending: true }),
    supabase.from('projects').select('*').order('display_order', { ascending: true }),
    supabase.from('experience').select('*').order('display_order', { ascending: true }),
    supabase.from('social_links').select('*').order('display_order', { ascending: true }),
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  ]);
  const error = profileError || skillsError || projectsError || experienceError || socialsError || settingsError;
  if (error) throw error;
  const name = profile?.name || '';
  const firstName = name.trim().split(/\s+/)[0] || '';
  return {
    profile: { initials: profile?.initials || 'ML', name, shortName: firstName.toUpperCase(), role: profile?.role || '', tagline: profile?.tagline || '', about: profile?.about || '', location: profile?.location || '', avatarUrl: profile?.avatar_url || '', resumeUrl: profile?.resume_url || '', email: profile?.email || '' },
    skills: (skills || []).map(item => ({ id: item.id, name: item.name, level: item.level ?? 0, group: item.category || 'Skills' })),
    projects: (projects || []).map(item => ({ id: item.id, title: item.title, type: item.type || '', description: item.description || '', tech: item.technologies || [] })),
    experience: (experience || []).map(item => ({ id: item.id, company: item.company, role: item.role, location: item.location || '', startDate: item.start_date || '', endDate: item.end_date || '', description: item.description || '', technologies: item.technologies || [] })),
    socials: (socials || []).map(item => ({ id: item.id, label: item.platform, href: item.url })),
    settings: { heroBadge: settings?.hero_badge || 'HELLO, WORLD', footerText: settings?.footer_text || 'BUILT WITH REACT', contactMessage: settings?.contact_message || "Let's build something useful." }
  };
}

function PublicPortfolio() {
  const [active, setActive] = useState('HOME');
  const [portfolio, setPortfolio] = useState(emptyPortfolio);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    loadPortfolio().then(data => { if (mounted) { setPortfolio(data); setLoading(false); } }).catch(err => { console.error('Failed to load portfolio data:', err); if (mounted) { setError(err.message || 'Unable to load portfolio data.'); setLoading(false); } });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const main = document.querySelector('.main-content');
    const handleScroll = () => {
      const sections = [...document.querySelectorAll('.section')];
      const current = sections.reduce((closest, section) => { const distance = Math.abs(section.getBoundingClientRect().top - 100); return distance < closest.distance ? { id: section.id, distance } : closest; }, { id: 'HOME', distance: Infinity });
      setActive(current.id);
    };
    main?.addEventListener('scroll', handleScroll);
    return () => main?.removeEventListener('scroll', handleScroll);
  }, []);

  const goTo = id => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setActive(id); };

  if (loading) return <div className="app"><main className="main-content"><section className="section hero"><div className="hero-grid" /><div className="hero-copy"><span className="eyebrow">LOADING PORTFOLIO</span><h1>MOHAN<span>.</span></h1><p>Loading portfolio data from Supabase...</p></div></section></main></div>;
  if (error) return <div className="app"><main className="main-content"><section className="section hero"><div className="hero-copy"><span className="eyebrow">DATABASE ERROR</span><h1>PORTFOLIO<span>.</span></h1><p>{error}</p><button className="button-3d primary" onClick={() => window.location.reload()}>Retry</button></div></section></main></div>;

  return <div className="app"><Navbar active={active} setActive={goTo} /><main className="main-content"><Hero portfolio={portfolio} setActive={goTo} /><About portfolio={portfolio} /><Skills skills={portfolio.skills} /><Projects projects={portfolio.projects} /><Experience experience={portfolio.experience} /><Resume portfolio={portfolio} /><Contact portfolio={portfolio} /><footer>{portfolio.profile.name.toUpperCase()} <span>•</span> {portfolio.settings.footerText}</footer></main></div>;
}

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const adminRoute = new URLSearchParams(window.location.search).get('admin');
  if (adminRoute === 'login') return <Login />;
  if (adminRoute === 'dashboard') return <Admin />;
  return <PublicPortfolio />;
}
