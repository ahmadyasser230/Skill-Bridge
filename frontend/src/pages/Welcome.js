import React from 'react';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaHandsHelping, FaBook, FaComments } from 'react-icons/fa';
import './Welcome.css';

const Welcome = () => {
    const features = [
        {
            icon: <FaHandsHelping size={50} />,
            title: 'طلب المساعدة',
            description: 'احصل على مساعدة من طلاب آخرين في دراستك ومشاريعك'
        },
        {
            icon: <FaGraduationCap size={50} />,
            title: 'كسب النقاط',
            description: 'ساعد الآخرين واكسب نقاط يمكنك استخدامها في الدورات'
        },
        {
            icon: <FaBook size={50} />,
            title: 'الدورات التعليمية',
            description: 'تصفح وتعلم من دورات منشأة من طلاب مثلك'
        },
        {
            icon: <FaComments size={50} />,
            title: 'التواصل المباشر',
            description: 'تواصل مع الطلاب عبر نظام المحادثات الفوري'
        }
    ];

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '100px 20px',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '48px', marginBottom: '20px', fontWeight: 'bold' }}>
                    مرحباً بك في منصة الطلاب الجامعيين
                </h1>
                <p style={{ fontSize: '24px', marginBottom: '40px', opacity: 0.9 }}>
                    منصة تعليمية للتعاون والمساعدة بين طلاب الجامعات
                </p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/register" className="btn" style={{
                        background: 'white',
                        color: '#667eea',
                        padding: '15px 40px',
                        fontSize: '18px',
                        textDecoration: 'none'
                    }}>
                        ابدأ الآن
                    </Link>
                    <Link to="/login" className="btn" style={{
                        background: 'transparent',
                        border: '2px solid white',
                        color: 'white',
                        padding: '15px 40px',
                        fontSize: '18px',
                        textDecoration: 'none'
                    }}>
                        تسجيل الدخول
                    </Link>
                </div>
            </div>

            {/* Features Section */}
            <div className="container" style={{ padding: '80px 20px' }}>
                <h2 style={{
                    textAlign: 'center',
                    fontSize: '36px',
                    marginBottom: '60px',
                    color: 'white'
                }}>
                    ماذا تقدم المنصة؟
                </h2>

                <div className="grid grid-2">
                    {features.map((feature, index) => (
                        <div key={index} className="card" style={{ textAlign: 'center' }}>
                            <div style={{
                                color: '#667eea',
                                marginBottom: '20px',
                                display: 'flex',
                                justifyContent: 'center'
                            }}>
                                {feature.icon}
                            </div>
                            <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#333' }}>
                                {feature.title}
                            </h3>
                            <p style={{ color: '#666', lineHeight: '1.6' }}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* How It Works */}
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '80px 20px' }}>
                <div className="container">
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '36px',
                        marginBottom: '60px',
                        color: 'white'
                    }}>
                        كيف تعمل المنصة؟
                    </h2>

                    <div className="grid grid-3">
                        <div className="card">
                            <div style={{
                                background: '#667eea',
                                color: 'white',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                marginBottom: '20px'
                            }}>
                                1
                            </div>
                            <h4 style={{ fontSize: '20px', marginBottom: '10px' }}>سجل حساب</h4>
                            <p style={{ color: '#666' }}>أنشئ حسابك باستخدام معلوماتك الجامعية</p>
                        </div>

                        <div className="card">
                            <div style={{
                                background: '#667eea',
                                color: 'white',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                marginBottom: '20px'
                            }}>
                                2
                            </div>
                            <h4 style={{ fontSize: '20px', marginBottom: '10px' }}>اطلب أو قدم مساعدة</h4>
                            <p style={{ color: '#666' }}>اطلب مساعدة أو ساعد الآخرين واكسب نقاط</p>
                        </div>

                        <div className="card">
                            <div style={{
                                background: '#667eea',
                                color: 'white',
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                marginBottom: '20px'
                            }}>
                                3
                            </div>
                            <h4 style={{ fontSize: '20px', marginBottom: '10px' }}>تعلم وشارك</h4>
                            <p style={{ color: '#666' }}>استخدم النقاط للدورات أو أنشئ دورات خاصة بك</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '60px 20px',
                textAlign: 'center'
            }}>
                <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>
                    جاهز للبدء؟
                </h2>
                <p style={{ fontSize: '20px', marginBottom: '30px', opacity: 0.9 }}>
                    انضم إلى مجتمع SKILLBRIDGE  اليوم
                </p>
                <Link to="/register" className="btn" style={{
                    background: 'white',
                    color: '#667eea',
                    padding: '15px 40px',
                    fontSize: '18px',
                    textDecoration: 'none'
                }}>
                    إنشاء حساب مجاني
                </Link>
            </div>
        </div>
    );
};

export default Welcome;