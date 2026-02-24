import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Verifyemail.css';

const API_URL = 'https://skill-bridge-gmup.onrender.com';

const passwordRules = [
    { id: 'length', label: '8 أحرف على الأقل', test: p => p.length >= 8 },
    { id: 'upper', label: 'حرف كبير (A-Z)', test: p => /[A-Z]/.test(p) },
    { id: 'lower', label: 'حرف صغير (a-z)', test: p => /[a-z]/.test(p) },
    { id: 'number', label: 'رقم واحد على الأقل', test: p => /[0-9]/.test(p) },
    { id: 'special', label: 'رمز خاص (!@#$%^&*)', test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const VerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const userId = location.state?.userId;
    const userEmail = location.state?.email || '';
    const mode = location.state?.mode || 'verify';
    const isResetMode = mode === 'reset-password';

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [verifiedCode, setVerifiedCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const allRulesPassed = passwordRules.every(r => r.test(newPassword));

    const inputRefs = useRef([]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    useEffect(() => {
        if (!userId) navigate(isResetMode ? '/forgot-password' : '/register');
    }, [userId, navigate, isResetMode]);

    const handleInput = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const newCode = [...code];
        newCode[index] = digit;
        setCode(newCode);
        setError('');
        if (digit && index < 5) inputRefs.current[index + 1]?.focus();
        if (digit && index === 5) {
            const fullCode = [...newCode].join('');
            if (fullCode.length === 6) handleVerify(fullCode);
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0)
            inputRefs.current[index - 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) { setCode(pasted.split('')); handleVerify(pasted); }
    };

    const handleVerify = async (fullCode) => {
        const codeToVerify = fullCode || code.join('');
        if (codeToVerify.length < 6) { setError('أدخل الكود المكون من 6 أرقام كاملاً'); return; }

        setLoading(true);
        setError('');

        if (isResetMode) {
            try {
                await axios.post(`${API_URL}/auth/verify-reset-code`, { userId, code: codeToVerify });
                setVerifiedCode(codeToVerify);
                setShowNewPassword(true);
            } catch (err) {
                setError(err.response?.data?.message || 'الكود غير صحيح، حاول مجدداً');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const res = await axios.post(`${API_URL}/auth/verify-email`, { userId, code: codeToVerify });
                setSuccess('تم تفعيل حسابك بنجاح! 🎉');
                setTimeout(() => { login(res.data.token, res.data.user); navigate('/dashboard'); }, 1200);
            } catch (err) {
                setError(err.response?.data?.message || 'حدث خطأ، حاول مجدداً');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } finally {
                setLoading(false);
            }
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!allRulesPassed) return setError('كلمة المرور لا تستوفي المتطلبات المطلوبة');
        if (newPassword !== confirmPassword) return setError('كلمتا المرور غير متطابقتين');

        setLoading(true);
        try {
            await axios.post(`${API_URL}/auth/reset-password`, { userId, code: verifiedCode, newPassword });
            setSuccess('تم تغيير كلمة المرور بنجاح! 🎉');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ، حاول مجدداً');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setResendLoading(true);
        setError('');
        try {
            const endpoint = isResetMode ? '/auth/resend-reset-code' : '/auth/resend-code';
            await axios.post(`${API_URL}${endpoint}`, { userId, email: userEmail });
            setSuccess('تم إرسال كود جديد على بريدك الإلكتروني');
            setCountdown(60);
            setCanResend(false);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ');
        } finally {
            setResendLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '12px', borderRadius: '10px',
        border: '2px solid #cdd8e8', fontSize: '15px',
        outline: 'none', boxSizing: 'border-box', fontFamily: 'Cairo, sans-serif'
    };
    const labelStyle = {
        display: 'block', marginBottom: '6px',
        fontWeight: '600', color: '#0d3b66', fontSize: '14px'
    };

    return (
        <div className="verify-container">
            <div className="verify-card">
                <div className="verify-icon">
                    {isResetMode ? (
                        <svg viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="32" fill="#fff0e8" />
                            <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="28">🔑</text>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="32" fill="#e8f4ff" />
                            <path d="M16 22h32v20H16z" rx="3" stroke="#0d3b66" strokeWidth="2" fill="white" />
                            <path d="M16 22l16 13 16-13" stroke="#1a6eb5" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                </div>

                {!showNewPassword ? (
                    <>
                        <h1>{isResetMode ? 'أدخل كود التحقق' : 'تحقق من بريدك الإلكتروني'}</h1>
                        <p className="verify-subtitle">
                            {isResetMode ? 'أرسلنا كود إعادة تعيين كلمة المرور إلى' : 'أرسلنا كود مكوّن من 6 أرقام إلى'}
                            <br /><strong>{userEmail || 'بريدك الإلكتروني'}</strong>
                        </p>

                        <div className="code-inputs" onPaste={handlePaste}>
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => inputRefs.current[i] = el}
                                    type="text" inputMode="numeric" maxLength={1}
                                    value={digit}
                                    onChange={e => handleInput(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    className={`code-box ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                                    autoFocus={i === 0} disabled={loading}
                                />
                            ))}
                        </div>

                        {error && <div className="verify-error">{error}</div>}
                        {success && <div className="verify-success">{success}</div>}

                        <button className="verify-btn" onClick={() => handleVerify()} disabled={loading || code.join('').length < 6}>
                            {loading ? <span className="btn-spinner"></span> : isResetMode ? 'التحقق من الكود' : 'تفعيل الحساب'}
                        </button>

                        <div className="resend-area">
                            {canResend ? (
                                <button className="resend-btn" onClick={handleResend} disabled={resendLoading}>
                                    {resendLoading ? 'جاري الإرسال...' : 'إرسال كود جديد'}
                                </button>
                            ) : (
                                <p className="countdown-text">إعادة الإرسال بعد <strong>{countdown}</strong> ثانية</p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h1>كلمة المرور الجديدة</h1>
                        <p className="verify-subtitle">أدخل كلمة مرور جديدة لحسابك</p>

                        {error && <div className="verify-error">{error}</div>}
                        {success && <div className="verify-success">{success}</div>}

                        <form onSubmit={handleChangePassword} style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={labelStyle}>كلمة المرور الجديدة</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={inputStyle}
                                />
                                {/* شروط كلمة المرور */}
                                {newPassword.length > 0 && (
                                    <div className="verify-password-rules">
                                        {passwordRules.map(rule => {
                                            const passed = rule.test(newPassword);
                                            return (
                                                <div key={rule.id} className={`verify-password-rule ${passed ? 'passed' : 'failed'}`}>
                                                    <span className="verify-rule-icon">{passed ? '✓' : '✗'}</span>
                                                    <span>{rule.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={labelStyle}>تأكيد كلمة المرور</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="أعد كتابة كلمة المرور"
                                    required
                                    style={{
                                        ...inputStyle,
                                        borderColor: confirmPassword.length > 0
                                            ? (confirmPassword === newPassword ? '#16a34a' : '#dc2626')
                                            : '#cdd8e8'
                                    }}
                                />
                            </div>
                            <button type="submit" className="verify-btn" disabled={loading || !allRulesPassed}>
                                {loading ? <span className="btn-spinner"></span> : 'تغيير كلمة المرور'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;