import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Building2, Heart, ShieldCheck, Users, ArrowRight, Sun, Moon } from 'lucide-react';

export default function Landing() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    // If already logged in, no need to see landing page
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex flex-col min-h-screen animate-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Navigation */}
            <nav className="container flex items-center justify-between" style={{ padding: '1.5rem 2rem', maxWidth: '1200px' }}>
                <div className="flex items-center gap-3">
                    <div style={{ background: 'var(--primary-color)', padding: '10px', borderRadius: '12px', color: 'white' }}>
                        <Building2 size={24} />
                    </div>
                    <h1 className="m-0 text-xl font-bold" style={{ color: 'var(--text-main)' }}>CondoConnect</h1>
                </div>

                <div className="flex items-center gap-6">
                    <button onClick={toggleTheme} className="btn-icon" title="Toggle Theme">
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <Link to="/login" className="text-sm font-medium" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Log in</Link>
                    <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none' }}>Get Started</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="container flex-col items-center justify-center text-center flex" style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px' }}>

                <div className="inline-flex items-center gap-2 mb-6" style={{ background: 'var(--bg-input)', padding: '8px 16px', borderRadius: '30px', color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 500 }}>
                    <Heart size={16} /> Building better communities together
                </div>

                <h1 style={{ fontSize: '3.5rem', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                    Your condominium, <br />
                    <span style={{ color: 'var(--primary-color)' }}>connected like never before.</span>
                </h1>

                <p className="text-muted" style={{ fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '600px', lineHeight: 1.6 }}>
                    CondoConnect bridges the gap between administrators and owners.
                    Share documents transparently, stay informed instantly, and foster a community built on trust.
                </p>

                <div className="flex items-center justify-center gap-4 w-full" style={{ maxWidth: '400px' }}>
                    <Link to="/register" className="btn btn-primary w-full h-14" style={{ textDecoration: 'none', fontSize: '1.1rem' }}>
                        Join your Condo <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Features Grid */}
                <div className="grid mt-16" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1000px', textAlign: 'left' }}>
                    <div className="card p-6" style={{ padding: '2rem', background: 'var(--bg-card)', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                        <div className="mb-4" style={{ color: 'var(--primary-color)' }}><ShieldCheck size={32} /></div>
                        <h3 className="text-lg mb-2">Total Transparency</h3>
                        <p className="text-sm text-muted m-0">Access all common condominium documents in one secure, centralized place. No more lost emails.</p>
                    </div>

                    <div className="card p-6" style={{ padding: '2rem', background: 'var(--bg-card)', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                        <div className="mb-4" style={{ color: '#10b981' }}><Users size={32} /></div>
                        <h3 className="text-lg mb-2">Stronger Community</h3>
                        <p className="text-sm text-muted m-0">Feel connected to your neighbors and understand the decisions being made for your shared home.</p>
                    </div>
                </div>

            </main>

            <footer className="text-center text-sm text-muted" style={{ padding: '2rem', borderTop: '1px solid var(--border-color)' }}>
                © {new Date().getFullYear()} CondoConnect. All rights reserved.
            </footer>
        </div>
    );
}
