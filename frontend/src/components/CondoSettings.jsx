import { useState, useEffect } from 'react';
import api from '../api';
import { X, Save, MapPin, Building2 } from 'lucide-react';

export default function CondoSettings({ isOpen, onClose }) {
    const [address, setAddress] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchDetails();
        }
    }, [isOpen]);

    const fetchDetails = async () => {
        try {
            const res = await api.get('/condos/details');
            setAddress(res.data.address || '');
            setName(res.data.name || '');
            setMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!address || !name) {
            setMessage('Both fields are required.');
            return;
        }
        setLoading(true);
        try {
            await api.put('/condos/settings', { address, name });
            setMessage('Settings saved successfully!');
            setTimeout(() => onClose(), 1200);
        } catch (err) {
            setMessage(err.response?.data?.error || 'Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="animate-fade-in"
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{ padding: '2.5rem', maxWidth: '500px', width: '90%', position: 'relative' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    className="btn-icon"
                    style={{ position: 'absolute', top: '1rem', right: '1rem' }}
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '12px', color: 'var(--primary-color)' }}>
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 className="m-0 text-xl">Condo Settings</h2>
                        <p className="text-sm text-muted m-0 mt-1">Update your condo's details.</p>
                    </div>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-2" style={{ color: 'var(--primary-color)' }}>
                            <Building2 size={14} /> Condo Name
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Flavia 1"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium flex items-center gap-2 mb-2" style={{ color: 'var(--primary-color)' }}>
                            <MapPin size={14} /> Full Address
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="e.g. via flavia 1, Milano, 20161"
                        />
                    </div>

                    {message && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            background: message.includes('success') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: message.includes('success') ? 'var(--success-color)' : 'var(--danger-color)'
                        }}>
                            {message}
                        </div>
                    )}

                    <button
                        className="btn btn-primary w-full h-12 mt-2"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
