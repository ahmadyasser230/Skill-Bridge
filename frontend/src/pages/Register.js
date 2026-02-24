import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../utils/Api';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const passwordRules = [
    { id: 'length', label: '8 أحرف على الأقل', test: p => p.length >= 8 },
    { id: 'upper', label: 'حرف كبير (A-Z)', test: p => /[A-Z]/.test(p) },
    { id: 'lower', label: 'حرف صغير (a-z)', test: p => /[a-z]/.test(p) },
    { id: 'number', label: 'رقم واحد على الأقل (0-9)', test: p => /[0-9]/.test(p) },
    { id: 'special', label: 'رمز خاص (!@#$%^&*)', test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        studentId: '', university: '', major: '', skills: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const universities = [
        'الجامعة الإسلامية - غزة',
        'جامعة الأزهر - غزة',
        'جامعة الأقصى',
        'جامعة فلسطين',
        'كلية فلسطين التقنية'
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const allRulesPassed = passwordRules.every(r => r.test(formData.password));

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     setError('');
    //     const userData = { name, email, password };
    //     fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(userData)
    //     })

    //     if (!allRulesPassed) {
    //         setError('كلمة المرور لا تستوفي المتطلبات المطلوبة');
    //         setPasswordFocused(true);
    //         return;
    //     }

    //     setLoading(true);
    //     try {
    //         const skills = formData.skills.split(',').map(s => s.trim()).filter(s => s);
    //         const response = await register({ ...formData, skills });
    //         navigate('/verify-email', {
    //             state: { userId: response.data.userId, email: formData.email }
    //         });
    //     } catch (err) {
    //         setError(err.response?.data?.message || 'حدث خطأ أثناء التسجيل');
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // ✅ أولاً: تحقق من شروط كلمة المرور
        if (!allRulesPassed) {
            setError('كلمة المرور لا تستوفي المتطلبات المطلوبة');
            setPasswordFocused(true);
            return;
        }

        setLoading(true);
        try {
            // ✅ ثانياً: جمع البيانات من formData (هذا هو الحل)
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                studentId: formData.studentId,
                university: formData.university,
                major: formData.major,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
            };

            // ✅ ثالثاً: استخدم دالة register فقط (بدون fetch)
            const response = await register(userData);

            // ✅ رابعاً: التنقل بعد النجاح
            navigate('/verify-email', {
                state: { userId: response.data.userId, email: formData.email }
            });
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ أثناء التسجيل');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reg-container">
            <div className="reg-card">
                <div className="reg-header">
                    <h1>انضم إلى SkillBridge</h1>
                    <p>ابدأ رحلتك التعليمية وتبادل المهارات مع زملائك</p>
                </div>

                {error && <div className="reg-error-msg">{error}</div>}

                <form onSubmit={handleSubmit} className="register-grid-form">
                    {/* القسم الأول */}
                    <section className="form-section">
                        <h3><span className="section-number">1</span> الحساب الأساسي</h3>
                        <div className="form-group">
                            <label>الاسم الكامل</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="أدخل اسمك الثلاثي" />
                        </div>
                        <div className="form-group">
                            <label>البريد الإلكتروني</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="example@email.com" />
                        </div>
                        <div className="form-group">
                            <label>كلمة المرور</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onFocus={() => setPasswordFocused(true)}
                                required
                                placeholder="••••••••"
                            />
                            {/* شروط كلمة المرور */}
                            {(passwordFocused || formData.password.length > 0) && (
                                <div className="password-rules">
                                    {passwordRules.map(rule => {
                                        const passed = rule.test(formData.password);
                                        return (
                                            <div key={rule.id} className={`password-rule ${passed ? 'passed' : 'failed'}`}>
                                                <span className="rule-icon">{passed ? '✓' : '✗'}</span>
                                                <span>{rule.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* القسم الثاني */}
                    <section className="form-section">
                        <h3><span className="section-number">2</span> البيانات الجامعية</h3>
                        <div className="form-group">
                            <label>الرقم الجامعي</label>
                            <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} required placeholder="مثلاً: 120201234" />
                        </div>
                        <div className="form-group">
                            <label>الجامعة</label>
                            <select name="university" value={formData.university} onChange={handleChange} required>
                                <option value="">اختر جامعتك</option>
                                {universities.map((uni, i) => (
                                    <option key={i} value={uni}>{uni}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>التخصص الدراسي</label>
                            <input type="text" name="major" value={formData.major} onChange={handleChange} required placeholder="مثلاً: هندسة أنظمة حاسوب" />
                        </div>
                    </section>

                    {/* القسم الثالث */}
                    <section className="form-section full-width">
                        <h3><span className="section-number">3</span> مهاراتك (اختياري)</h3>
                        <div className="form-group">
                            <label>المهارات التقنية</label>
                            <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="JavaScript, Graphic Design, Public Speaking..." />
                            <small className="field-hint">افصل بين المهارات بفاصلة (,)</small>
                        </div>
                    </section>

                    <div className="form-footer full-width">
                        <button type="submit" className="btn-auth-submit" disabled={loading}>
                            {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب الآن'}
                        </button>
                        <p>لديك حساب بالفعل؟ <Link to="/login">تسجيل الدخول</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;