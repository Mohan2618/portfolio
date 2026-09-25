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

export default function Admin() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        window.location.href = '/login';
        return;
      }

      const currentUser = sessionData.session.user;
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (adminError || !adminUser) {
        await supabase.auth.signOut();
        if (mounted) {
          setError('Your account is not authorized to access the admin dashboard.');
          setChecking(false);
        }
        return;
      }

      if (mounted) {
        setUser(currentUser);
        setAuthorized(true);
        setChecking(false);
      }
    };

    checkAdmin();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) window.location.href = '/login';
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (checking) {
    return (
      <div className="admin-shell">
        <main className="admin-loading">
          <span className="eyebrow">AUTHENTICATING</span>
          <h1>ADMIN<span>.</span></h1>
        </main>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="admin-shell">
        <main className="admin-loading">
          <span className="eyebrow">ACCESS DENIED</span>
          <h1>ADMIN<span>.</span></h1>
          <p className="admin-error">{error}</p>
          <a className="admin-back-link" href="/">← Back to portfolio</a>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-bg-grid" />
      <div className="admin-glow admin-glow-a" />
      <div className="admin-glow admin-glow-b" />

      <header className="admin-header">
        <div>
          <span className="eyebrow">CONTROL CENTER</span>
          <h1>PORTFOLIO<span>.</span></h1>
        </div>
        <div className="admin-header-actions">
          <a href="/" className="admin-secondary-button">VIEW SITE ↗</a>
          <button onClick={signOut} className="admin-secondary-button">SIGN OUT</button>
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-welcome">
          <div>
            <span className="admin-label">SIGNED IN AS</span>
            <strong>{user?.email}</strong>
          </div>
          <span className="admin-badge">● ADMIN ACCESS</span>
        </div>

        <section className="admin-grid">
          {sections.map(([title, description], index) => (
            <article className="admin-section-card" key={title}>
              <span className="admin-card-number">0{index + 1}</span>
              <span className="admin-label">EDITOR</span>
              <h2>{title}</h2>
              <p>{description}</p>
              <button className="admin-edit-button" disabled>
                EDITOR COMING NEXT →
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
