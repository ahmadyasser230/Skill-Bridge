import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../utils/Api';
import './Login.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await forgotPassword(email);
            navigate('/verify-email', {
                state: {
                    userId: res.data.userId,
                    email,
                    mode: 'reset-password'
                }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ، حاول مجدداً');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '500px', paddingTop: '100px' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center', marginBottom: '8px', color: '#333' }}>
                    🔑 نسيت كلمة المرور؟
                </h2>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '28px', fontSize: '14px' }}>
                    أدخل بريدك الإلكتروني وسنرسل لك كود للتحقق
                </p>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        textAlign: 'right'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">البريد الإلكتروني</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="example@email.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'جاري الإرسال...' : 'إرسال كود التحقق'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                    تذكرت كلمة المرور؟{' '}
                    <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        تسجيل الدخول
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;