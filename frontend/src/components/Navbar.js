import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../utils/Api';
import logo from './photo/logo.png';
import { FaBell, FaUser, FaSignOutAlt, FaEnvelope } from 'react-icons/fa'; // استيراد أيقونة الرسائل
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 30000);
            // استمع لحدث القراءة الفورية من صفحة الإشعارات
            const onRead = () => fetchUnreadCount();
            window.addEventListener('notificationsRead', onRead);
            return () => {
                clearInterval(interval);
                window.removeEventListener('notificationsRead', onRead);
            };
        }
    }, [isAuthenticated]);

    const fetchUnreadCount = async () => {
        try {
            const response = await getUnreadCount();
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* جهة اليمين: الشعار والقائمة الأساسية */}
                <div className="navbar-right-side">
                    <Link to="/" className="navbar-brand">
                        <img src={logo} alt={logo} className="navbar-logo-img" />
                        {/* <span className="brand-text">SkillBridge</span> */}
                    </Link>

                    <div className="navbar-menu">
                        {/* توجيه الرئيسية إلى لوحة التحكم إذا كان مسجلاً، أو الصفحة الرئيسية إذا لم يكن */}
                        <Link to={isAuthenticated ? "/dashboard" : "/"} className="nav-item">الرئيسية</Link>
                        <Link to="/courses" className="nav-item">الدورات التدريبية</Link>
                        <Link to="/help-requests" className="nav-item">طلبات المساعدة</Link>
                    </div>
                </div>

                {/* جهة اليسار: الأكشنز والبروفايل */}
                <div className="navbar-left-side">
                    {isAuthenticated ? (
                        <>
                            <div className="nav-icons">
                                {/* تم استبدال البحث بالرسائل */}
                                <Link title="المحادثات" to="/messages" className="icon-link">
                                    <FaEnvelope />
                                </Link>

                                <Link title="التنبيهات" to="/notifications" className="icon-link notification-badge">
                                    <FaBell />
                                    {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
                                </Link>
                            </div>

                            <div className="user-profile-menu">
                                <Link to="/profile" className="user-info">
                                    <span className="user-name">{user?.name}</span>
                                    <div className="avatar-circle" style={
                                        user?.avatar ? {
                                            backgroundImage: `url(${user.avatar.startsWith('data:') || user.avatar.startsWith('blob') || user.avatar.startsWith('http') ? user.avatar : `data:image/jpeg;base64,${user.avatar}`})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        } : {}
                                    }>
                                        {!user?.avatar && (user?.name?.charAt(0).toUpperCase() || 'U')}
                                    </div>
                                </Link>
                                <button onClick={handleLogout} className="logout-btn" title="خروج">
                                    <FaSignOutAlt />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="login-link">تسجيل الدخول</Link>
                            <Link to="/register" className="register-btn">إنشاء حساب</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;