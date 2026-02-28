import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            await api.post('/auth/reset-password', { token, password });
            setSuccess(true);
            setMessage('Your password has been reset successfully!');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="container flex items-center justify-center min-h-screen">
                <div className="card w-full max-w-md p-8 text-center animate-fade-in">
                    <AlertCircle size={48} className="text-danger mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Invalid Request</h2>
                    <p className="text-muted mb-6">No reset token was found in the URL.</p>
                    <Link to="/login" className="btn btn-primary inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container flex items-center justify-center min-h-screen">
            <div className="card w-full max-w-md p-8 animate-fade-in">
                <div className="flex flex-col items-center mb-6">
                    <div className="p-3 bg-primary-light rounded-2xl text-primary mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">Set New Password</h2>
                    <p className="text-muted text-sm mt-2 text-center">
                        Choose a strong password for your account.
                    </p>
                </div>

                {success ? (
                    <div className="text-center py-4">
                        <CheckCircle size={48} className="text-success mx-auto mb-4" />
                        <p className="text-success font-bold text-lg mb-2">{message}</p>
                        <p className="text-muted text-sm">Redirecting you to login...</p>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="p-4 mb-6 bg-danger-light text-danger rounded-xl text-sm border border-danger-light font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="form-group">
                                <label className="text-sm font-semibold mb-2 block">New Password</label>
                                <div className="flex items-center input-field focus-within:ring-2 focus-within:ring-primary/20">
                                    <Lock size={18} className="text-muted mr-3" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-transparent border-none outline-none text-main"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="text-sm font-semibold mb-2 block">Confirm Password</label>
                                <div className="flex items-center input-field focus-within:ring-2 focus-within:ring-primary/20">
                                    <Lock size={18} className="text-muted mr-3" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-transparent border-none outline-none text-main"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full py-3 h-auto text-base font-bold shadow-lg shadow-primary/20"
                                disabled={loading}
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
