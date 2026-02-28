import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Users, User, Clock } from 'lucide-react';

export default function DocumentList({ refreshTrigger }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchDocuments();
    }, [refreshTrigger]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:3000/docs');
            setDocuments(res.data);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (filePath, originalTitle) => {
        const fileUrl = `http://localhost:3000/uploads/${filePath}`;
        window.open(fileUrl, '_blank');
    };

    return (
        <div className="card" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div style={{ background: 'var(--bg-input)', padding: '8px', borderRadius: '10px' }}>
                        <FileText size={20} style={{ color: 'var(--primary-color)' }} />
                    </div>
                    <h3 className="m-0 text-lg">Condo Documents</h3>
                </div>
                <span className="badge badge-owner">{documents.length} Files</span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8 mt-4" style={{ background: 'var(--bg-input)', borderRadius: '12px' }}>
                    <p className="m-0 text-muted">Loading documents...</p>
                </div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center mt-4 p-8" style={{ background: 'var(--bg-input)', borderRadius: '12px', flex: 1 }}>
                    <FileText size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
                    <p className="text-muted m-0">No documents found.<br />Start by uploading one!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3" style={{ flex: 1, overflowY: 'auto' }}>
                    {documents.map(doc => (
                        <div key={doc.id} className="card flex items-center justify-between" style={{ padding: '1.25rem', boxShadow: 'none', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                            <div className="flex items-center gap-4 w-full">
                                <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '12px' }}>
                                    <FileText style={{ color: 'var(--primary-color)' }} size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1.05rem', marginBottom: '6px', color: 'var(--text-main)' }}>{doc.title}</h4>
                                    <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                                        <span className="flex items-center gap-1.5 font-medium" title="Visibility">
                                            {doc.target_user_id ? <User size={14} /> : <Users size={14} />}
                                            {doc.target_user_id ? 'Personal' : 'Common'}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={14} /> {new Date(doc.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            Uploaded by <strong style={{ fontWeight: 500 }}>{doc.uploader_name}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="btn-icon"
                                style={{ background: 'var(--bg-input)', padding: '10px', marginLeft: '1rem', color: 'var(--text-main)' }}
                                onClick={() => handleDownload(doc.file_path, doc.title)}
                                title="Download Document"
                            >
                                <Download size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
