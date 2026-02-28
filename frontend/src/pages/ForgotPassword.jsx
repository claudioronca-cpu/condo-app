import { useState } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(''); // Shown for demo/testing purposes

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        setToken('');

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage('Success! A reset link has been simulated.');
            setToken(res.data.token); // In a real app, this would be in the email link
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container flex items-center justify-center min-h-screen">
            <div className="card w-full max-w-md p-8 animate-fade-in">
                <div className="flex flex-col items-center mb-6">
                    <div className="p-3 bg-primary-light rounded-2xl text-primary mb-4">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-2xl font-bold m-0">Reset Password</h2>
                    <p className="text-muted text-sm mt-2 text-center">
                        Enter your email and we'll send you a link to reset your password.
                    </p>
                </div>

                {message && (
                    <div className="p-4 mb-6 bg-success-light text-success rounded-xl text-sm leading-relaxed border border-success-light">
                        <p className="m-0 font-semibold">{message}</p>
                        {token && (
                            <div className="mt-2 pt-2 border-t border-success-light">
                                <p className="m-0 text-xs font-mono break-all opacity-80">
                                    Simulated Reset Link: <br />
                                    <strong>{window.location.origin}/reset-password?token={token}</strong>
                                </p>
                                <Link
                                    to={`/reset-password?token=${token}`}
                                    className="inline-block mt-3 text-xs font-bold underline"
                                >
                                    Click here to go to Reset Page
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="p-4 mb-6 bg-danger-light text-danger rounded-xl text-sm border border-danger-light font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="form-group">
                        <label className="text-sm font-semibold mb-2 block">Email Address</label>
                        <div className="flex items-center input-field focus-within:ring-2 focus-within:ring-primary/20">
                            <Mail size={18} className="text-muted mr-3" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
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
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-border flex justify-center">
                    <Link to="/login" className="flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
