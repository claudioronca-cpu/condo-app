import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserPlus, Building, Sun, Moon } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        phone: '',
        unit_number: '',
        password: '',
        address: '', // for new condo
        condo_id: '', // for joining existing
    });

    const [isCreatingCondo, setIsCreatingCondo] = useState(true);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Clean data based on mode
        const dataToSend = { ...formData };
        if (isCreatingCondo) {
            delete dataToSend.condo_id;
        } else {
            delete dataToSend.address;
        }

        const res = await register(dataToSend);
        if (res.success) {
            navigate('/login');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center mt-8 mb-8 animate-fade-in">
            <button
                onClick={toggleTheme}
                className="btn-icon mb-4"
                title="Toggle Theme"
                style={{ alignSelf: 'flex-end', marginRight: 'max(0px, calc(50% - 275px))' }}
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="card" style={{ padding: '2.5rem', maxWidth: '550px', width: '100%' }}>
                <div className="flex flex-col items-center justify-center mb-6">
                    <div style={{ padding: '12px', borderRadius: '16px', backgroundColor: 'var(--bg-input)', color: 'var(--primary-color)' }}>
                        <UserPlus size={36} />
                    </div>
                    <h2 className="mt-4 mb-2">Register</h2>
                    <p className="text-muted text-center text-sm">Join or create a new condo space.</p>
                </div>

                <div className="flex gap-4 mb-6" style={{ background: 'var(--bg-input)', padding: '6px', borderRadius: '16px' }}>
                    <button
                        type="button"
                        className={`btn w-full ${isCreatingCondo ? 'btn-primary' : 'btn-outline'}`}
                        style={!isCreatingCondo ? { border: 'none' } : {}}
                        onClick={() => setIsCreatingCondo(true)}
                    >
                        Create New Condo
                    </button>
                    <button
                        type="button"
                        className={`btn w-full ${!isCreatingCondo ? 'btn-primary' : 'btn-outline'}`}
                        style={isCreatingCondo ? { border: 'none' } : {}}
                        onClick={() => setIsCreatingCondo(false)}
                    >
                        Join Existing
                    </button>
                </div>

                {error && (
                    <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', padding: '1rem', borderRadius: '12px', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <div className="w-full">
                            <label className="text-sm font-medium">First Name</label>
                            <input type="text" name="name" className="input-field mt-2" onChange={handleChange} required />
                        </div>
                        <div className="w-full">
                            <label className="text-sm font-medium">Last Name</label>
                            <input type="text" name="surname" className="input-field mt-2" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-full">
                            <label className="text-sm font-medium">Email</label>
                            <input type="email" name="email" className="input-field mt-2" onChange={handleChange} required />
                        </div>
                        <div className="w-full">
                            <label className="text-sm font-medium">Password</label>
                            <input type="password" name="password" className="input-field mt-2" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-full">
                            <label className="text-sm font-medium">Phone (Optional)</label>
                            <input type="text" name="phone" className="input-field mt-2" onChange={handleChange} />
                        </div>
                        <div className="w-full">
                            <label className="text-sm font-medium">Unit Number (Optional)</label>
                            <input type="text" name="unit_number" className="input-field mt-2" onChange={handleChange} />
                        </div>
                    </div>

                    {isCreatingCondo ? (
                        <div>
                            <label className="text-sm font-medium flex items-center gap-2 text-primary" style={{ color: 'var(--primary-color)' }}>
                                <Building size={16} /> Condo Address
                            </label>
                            <input type="text" name="address" className="input-field mt-2" onChange={handleChange} required={isCreatingCondo} placeholder="The address of the new condo" />
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-medium">Condo ID (from invite)</label>
                            <input type="text" name="condo_id" className="input-field mt-2" onChange={handleChange} required={!isCreatingCondo} placeholder="e.g. 1" />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary w-full mt-4 h-12">
                        Register Account
                    </button>
                </form>

                <div className="text-center text-sm mt-8" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <span className="text-muted">Already have an account? </span>
                    <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 500, textDecoration: 'none' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
}
