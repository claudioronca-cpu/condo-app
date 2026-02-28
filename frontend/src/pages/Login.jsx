import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Building2, LogIn, Moon, Sun } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center animate-fade-in" style={{ minHeight: '80vh' }}>

            {/* Theme Toggle Button outside the card */}
            <button
                onClick={toggleTheme}
                className="btn-icon mb-4"
                title="Toggle Theme"
                style={{ alignSelf: 'flex-end', marginRight: 'max(0px, calc(50% - 225px))' }}
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="card" style={{ padding: '3rem', maxWidth: '450px', width: '100%' }}>
                <div className="flex flex-col items-center justify-center mb-8">
                    <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'var(--bg-input)', color: 'var(--primary-color)' }}>
                        <Building2 size={36} />
                    </div>
                    <h2 className="mt-6 mb-2">CondiApp Login</h2>
                    <p className="text-center text-sm">Access your condominium documents.</p>
                </div>

                {error && (
                    <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>Email Address</label>
                        <input
                            type="email"
                            className="input-field mt-2"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-2">
                        <label className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>Password</label>
                        <input
                            type="password"
                            className="input-field mt-2"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-2">
                        <LogIn size={18} />
                        Sign In
                    </button>
                </form>

                <div className="text-center text-sm mt-8" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <span className="text-muted">Don't have an account? </span>
                    <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 500, textDecoration: 'none' }}>Register</Link>
                </div>
            </div>
        </div>
    );
}
