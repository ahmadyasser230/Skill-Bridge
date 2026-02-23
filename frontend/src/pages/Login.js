import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi } from '../utils/Api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await loginApi(formData);
            login(response.data.token, response.data.user);
            navigate('/dashboard');
        } catch (err) {
            // إذا كان الحساب غير مفعّل وجّه لصفحة التحقق
            if (err.response?.data?.requiresVerification) {
                navigate('/verify-email', {
                    state: {
                        userId: err.response.data.userId,
                        email: formData.email
                    }
                });
                return;
            }
            setError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '500px', paddingTop: '100px' }}>
            <div className="card">
                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                    تسجيل الدخول
                </h2>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">البريد الإلكتروني</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">كلمة المرور</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: '10px', marginBottom: '0' }}>
                        <Link to="/forgot-password" style={{ color: '#888', textDecoration: 'none', fontSize: '14px' }}>
                            نسيت كلمة المرور؟
                        </Link>
                    </p>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
                    ليس لديك حساب؟{' '}
                    <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        إنشاء حساب جديد
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;