import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../utils/Api';
import { FaBell, FaTrash, FaCheck, FaCheckDouble } from 'react-icons/fa';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await getNotifications();
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            window.dispatchEvent(new CustomEvent('notificationsRead'));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            // أخبر الـ Navbar بأن العدد تغير فوراً
            window.dispatchEvent(new CustomEvent('notificationsRead'));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const icons = {
            'help-request': '🆘',
            'offer': '🤝',
            'message': '💬',
            'course': '📚',
            'general': '🔔'
        };
        return icons[type] || '🔔';
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="notifications-container container">
            <header className="page-header">
                <div className="header-title">
                    <h1>الإشعارات</h1>
                    {unreadCount > 0 && <span className="unread-badge">{unreadCount} جديد</span>}
                </div>
                {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="btn-secondary-outline">
                        <FaCheckDouble /> تحديد الكل كمقروء
                    </button>
                )}
            </header>

            {notifications.length > 0 ? (
                <div className="notifications-list">
                    {notifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        >
                            <div className="notification-icon-wrapper">
                                {getNotificationIcon(notification.type)}
                            </div>

                            <div className="notification-content">
                                <div className="notification-main">
                                    <h3>{notification.title}</h3>
                                    <p>{notification.message}</p>
                                </div>

                                <div className="notification-meta">
                                    <span className="time">{new Date(notification.createdAt).toLocaleString('ar')}</span>
                                    {notification.link && (
                                        <Link to={notification.link} className="details-link">
                                            عرض التفاصيل ←
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="notification-actions">
                                {!notification.read && (
                                    <button onClick={() => handleMarkAsRead(notification._id)} className="action-btn check" title="تحديد كمقروء">
                                        <FaCheck />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(notification._id)} className="action-btn delete" title="حذف">
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-notifications">
                    <div className="empty-icon"><FaBell /></div>
                    <p>صندوق الإشعارات فارغ حالياً</p>
                </div>
            )}
        </div>
    );
};

export default Notifications;