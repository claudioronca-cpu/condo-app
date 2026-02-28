import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Building2, LogOut, Users, Sun, Moon } from 'lucide-react';
import DocumentList from '../components/DocumentList';
import DocumentUpload from '../components/DocumentUpload';
import axios from 'axios';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [inviteMessage, setInviteMessage] = useState('');

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const generateInvite = async () => {
        try {
            const res = await axios.post('http://localhost:3000/condos/invite', { email: 'placeholder@email.com', role: 'owner' });
            setInviteMessage(res.data.instructions);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
            {/* Header Card */}
            <header className="card flex items-center justify-between mb-8" style={{ padding: '1.5rem 2rem' }}>
                <div className="flex items-center gap-4">
                    <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '16px' }}>
                        <Building2 className="text-primary" style={{ color: 'var(--primary-color)' }} size={28} />
                    </div>
                    <div>
                        <h2 className="m-0 text-xl">Condo Platform</h2>
                        <p className="text-sm mt-1 mb-0" style={{ color: 'var(--text-muted)' }}>
                            Welcome, <strong style={{ color: 'var(--text-main)' }}>{user.name}</strong> • Condo ID: {user.condo_id}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-owner'}`}>
                        {user.role === 'admin' ? 'Administrator' : 'Condo Owner'}
                    </span>

                    <button onClick={toggleTheme} className="btn-icon" title="Toggle Theme">
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>

                    <button className="btn btn-outline btn-danger" style={{ padding: '8px 16px' }} onClick={logout}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            {/* Admin Panel */}
            {user.role === 'admin' && (
                <div className="card mb-8" style={{ padding: '1.5rem 2rem', borderLeft: '4px solid var(--primary-color)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="flex items-center gap-2 m-0 text-lg">
                                <Users size={20} style={{ color: 'var(--primary-color)' }} />
                                Manage Members
                            </h3>
                            <p className="text-sm mt-2 mb-0" style={{ color: 'var(--text-muted)' }}>Generate an invitation code for new condo owners to register.</p>
                            {inviteMessage && (
                                <div className="mt-4" style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <strong>Invite Link Generated: </strong>{inviteMessage}
                                </div>
                            )}
                        </div>
                        <button className="btn btn-primary" onClick={generateInvite}>
                            <Users size={16} /> Generate Invite
                        </button>
                    </div>
                </div>
            )}

            {/* Main Grid */}
            <div className="flex flex-col" style={{ gap: '2rem' }}>
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '2rem' }}>
                    {/* Left Column - Upload Zone */}
                    <div className="flex flex-col gap-4">
                        <DocumentUpload onUploadSuccess={triggerRefresh} />
                    </div>

                    {/* Right Column - Document List */}
                    <div className="flex flex-col h-full w-full">
                        <DocumentList refreshTrigger={refreshTrigger} />
                    </div>
                </div>
            </div>
        </div>
    );
}
