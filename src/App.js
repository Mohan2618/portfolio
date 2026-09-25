import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const portfolio = {
  profile: {
    initials: 'ML',
    name: 'Mohan Lingabathina',
    shortName: 'MOHAN',
    role: 'Software Engineer • AI/ML • Full Stack',
    tagline: 'I build intelligent, practical software and turn ideas into products.',
    about: 'Computer Science and Engineering student specializing in AI/ML at SRM University AP. I enjoy building full-stack applications, AI-powered tools, APIs, and developer-focused products.',
    location: 'Andhra Pradesh, India'
  },
  skills: [
    { name: 'Java', level: 88, group: 'Languages' },
    { name: 'Python', level: 92, group: 'Languages' },
    { name: 'JavaScript', level: 88, group: 'Languages' },
    { name: 'SQL', level: 86, group: 'Languages' },
    { name: 'React', level: 84, group: 'Frontend' },
    { name: 'FastAPI', level: 86, group: 'Backend' },
    { name: 'Flask', level: 84, group: 'Backend' },
    { name: 'Node.js', level: 78, group: 'Backend' },
    { name: 'AI / ML', level: 86, group: 'AI' },
    { name: 'Git / GitHub', level: 90, group: 'Tools' }
  ],
  projects: [
    { title: 'Lumina', type: 'AI Application', description: 'AI-powered image processing and conversational assistant built as a full-stack application.', tech: ['React', 'Flask', 'Supabase', 'AI APIs'] },
    { title: 'ReviewRadar AI', type: 'AI / Search', description: 'Semantic review search platform using embeddings, vector search, and FastAPI.', tech: ['FastAPI', 'ChromaDB', 'Python', 'ML'] },
    { title: 'AuraSum', type: 'NLP', description: 'Offline document summarization application using extractive and local transformer-based summarization.', tech: ['Flask', 'T5', 'NLP', 'Python'] },
    { title: 'TestPilot', type: 'Developer Tool', description: 'A planned automated software testing platform for analyzing applications against requirements.', tech: ['FastAPI', 'React', 'Testing', 'AI'] }
  ],
  socials: [
    { label: 'GitHub', href: 'https://github.com/Mohan2618' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    { label: 'Email', href: 'mailto:mohanlingabathina8@gmail.com' }
  ]
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
  return (
    <div ref={tilt.ref} className={'tilt-card ' + className} onMouseMove={tilt.onMouseMove} onMouseLeave={tilt.onMouseLeave}>
      <div className="tilt-shine" />
      {children}
    </div>
  );
}

function Navbar({ active, setActive }) {
  const links = ['HOME', 'ABOUT', 'SKILLS', 'PROJECTS', 'RESUME', 'CONTACT'];
  return (
    <header className="navbar">
      <button className="brand-3d" onClick={() => setActive('HOME')} aria-label="Go home"><span>ML</span></button>
      <nav>{links.map(link => <button key={link} className={active === link ? 'nav-link active' : 'nav-link'} onClick={() => setActive(link)}>{link}</button>)}</nav>
    </header>
  );
}

function Hero({ setActive }) {
  return (
    <section className="section hero" id="HOME">
      <div className="hero-grid" />
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="hero-copy">
        <span className="eyebrow">HELLO, WORLD</span>
        <h1>{portfolio.profile.shortName}<span>.</span></h1>
        <div className="hero-role">{portfolio.profile.role}</div>
        <p>{portfolio.profile.tagline}</p>
        <div className="hero-actions">
          <button className="button-3d primary" onClick={() => setActive('PROJECTS')}>Explore Work</button>
          <button className="button-3d secondary" onClick={() => setActive('CONTACT')}>Let's Connect</button>
        </div>
      </div>
      <TiltCard className="hero-card">
        <div className="cube-scene"><div className="cube">
          <span className="front">AI</span><span className="back">ML</span><span className="right">JS</span>
          <span className="left">API</span><span className="top">DEV</span><span className="bottom">SQL</span>
        </div></div>
        <div className="hero-card-meta"><span>BUILDING</span><strong>Ideas → Products</strong></div>
      </TiltCard>
      <span className="scroll-label">SCROLL TO EXPLORE ↓</span>
    </section>
  );
}

function About() {
  return (
    <section className="section" id="ABOUT">
      <div className="section-heading"><span className="eyebrow">01 / ABOUT</span><h2>Behind the <span>builds.</span></h2></div>
      <div className="about-grid">
        <TiltCard className="profile-card">
          <div className="avatar-3d">{portfolio.profile.initials}</div>
          <span className="status-dot">AVAILABLE FOR OPPORTUNITIES</span>
          <h3>{portfolio.profile.name}</h3><p>{portfolio.profile.location}</p>
        </TiltCard>
        <div className="about-copy">
          <p className="lead">{portfolio.profile.about}</p>
          <div className="stats-grid">
            <TiltCard><strong>AI</strong><span>Applied intelligence</span></TiltCard>
            <TiltCard><strong>WEB</strong><span>Full-stack products</span></TiltCard>
            <TiltCard><strong>API</strong><span>Backend systems</span></TiltCard>
            <TiltCard><strong>CODE</strong><span>Problem solving</span></TiltCard>
          </div>
        </div>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section className="section" id="SKILLS">
      <div className="section-heading"><span className="eyebrow">02 / SKILLS</span><h2>A stack built to <span>ship.</span></h2></div>
      <div className="skills-grid">
        {portfolio.skills.map(skill => (
          <TiltCard key={skill.name} className="skill-card">
            <div className="skill-top"><span>{skill.name}</span><small>{skill.group}</small></div>
            <div className="skill-bar"><span style={{ width: skill.level + '%' }} /></div>
            <strong>{skill.level}%</strong>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function Projects() {
  return (
    <section className="section" id="PROJECTS">
      <div className="section-heading"><span className="eyebrow">03 / PROJECTS</span><h2>Things I've <span>built.</span></h2></div>
      <div className="projects-grid">
        {portfolio.projects.map((project, index) => (
          <TiltCard key={project.title} className="project-card">
            <div className="project-number">0{index + 1}</div>
            <span className="project-type">{project.type}</span>
            <h3>{project.title}</h3><p>{project.description}</p>
            <div className="tags">{project.tech.map(item => <span key={item}>{item}</span>)}</div>
            <div className="project-arrow">↗</div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function Resume() {
  return (
    <section className="section resume-section" id="RESUME">
      <div className="resume-card">
        <span className="eyebrow">04 / RESUME</span><h2>Ready to <span>connect?</span></h2>
        <p>View the latest resume and learn more about my technical experience.</p>
        <a className="button-3d primary" href="/portfolio/Resume-AIML.pdf" target="_blank" rel="noreferrer">View Resume ↗</a>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="section contact-section" id="CONTACT">
      <div className="section-heading"><span className="eyebrow">05 / CONTACT</span><h2>Let's build something <span>useful.</span></h2></div>
      <div className="contact-grid">
        {portfolio.socials.map(item => (
          <TiltCard key={item.label} className="contact-card">
            <span className="contact-index">↗</span><small>CONNECT</small><h3>{item.label}</h3>
            <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{item.href.replace('mailto:', '')}</a>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [active, setActive] = useState('HOME');

  useEffect(() => {
    const main = document.querySelector('.main-content');
    const handleScroll = () => {
      const sections = [...document.querySelectorAll('.section')];
      const current = sections.reduce((closest, section) => {
        const distance = Math.abs(section.getBoundingClientRect().top - 100);
        return distance < closest.distance ? { id: section.id, distance } : closest;
      }, { id: 'HOME', distance: Infinity });
      setActive(current.id);
    };
    main?.addEventListener('scroll', handleScroll);
    return () => main?.removeEventListener('scroll', handleScroll);
  }, []);

  const goTo = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActive(id);
  };

  return (
    <div className="app">
      <Navbar active={active} setActive={goTo} />
      <main className="main-content">
        <Hero setActive={goTo} /><About /><Skills /><Projects /><Resume /><Contact />
        <footer>MOHAN LINGABATHINA <span>•</span> BUILT WITH REACT</footer>
      </main>
    </div>
  );
}
