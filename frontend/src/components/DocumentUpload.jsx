import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { UploadCloud, FileText } from 'lucide-react';

export default function DocumentUpload({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [targetUserId, setTargetUserId] = useState('');
    const [members, setMembers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === 'admin') {
            axios.get('http://localhost:3000/condos/members')
                .then(res => setMembers(res.data))
                .catch(err => console.error('Failed to fetch members', err));
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !title) {
            setError('Please provide a title and select a file.');
            return;
        }

        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('document', file);
        formData.append('title', title);
        if (targetUserId) {
            formData.append('target_user_id', targetUserId);
        }

        try {
            await axios.post('http://localhost:3000/docs', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setTitle('');
            setFile(null);
            setTargetUserId('');
            if (onUploadSuccess) onUploadSuccess();
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex items-center gap-3 mb-4">
                <div style={{ background: 'var(--bg-input)', padding: '8px', borderRadius: '10px' }}>
                    <UploadCloud size={20} style={{ color: 'var(--primary-color)' }} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Upload Document</h3>
            </div>

            {error && (
                <div className="mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-4" style={{ flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
                    <label className="text-sm font-medium mb-1 block">Document Title</label>
                    <input
                        type="text"
                        className="input-field"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Meeting Minutes"
                        required
                    />
                </div>

                <div style={{ flex: '0 1 180px', minWidth: '140px' }}>
                    <label className="text-sm font-medium mb-1 block">File</label>
                    <label className="input-field" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        <FileText size={16} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file ? file.name : 'Choose File'}</span>
                        <input
                            type="file"
                            style={{ display: 'none' }}
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </label>
                </div>

                {user?.role === 'admin' && (
                    <div style={{ flex: '0 1 200px', minWidth: '150px' }}>
                        <label className="text-sm font-medium mb-1 block">Target User</label>
                        <select
                            className="input-field"
                            value={targetUserId}
                            onChange={(e) => setTargetUserId(e.target.value)}
                        >
                            <option value="">All (Common)</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.name} {m.surname}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="text-sm font-medium mb-1 block" style={{ visibility: 'hidden' }}>Upload</label>
                    <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', height: '44px' }} disabled={loading || !file || !title}>
                        <UploadCloud size={16} /> {loading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </form>

            {user?.role !== 'admin' && (
                <p className="text-sm text-muted mt-4 mb-0 p-3" style={{ background: 'var(--bg-input)', borderRadius: '8px' }}>
                    Note: Owners can only upload common documents visible to all members.
                </p>
            )}
        </div>
    );
}
