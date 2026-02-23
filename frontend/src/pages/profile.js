import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile, updateProfile } from '../utils/Api';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaUniversity, FaGraduationCap, FaEnvelope, FaEdit, FaCamera } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, setUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        skills: '',
        avatar: ''
    });
    const [previewImage, setPreviewImage] = useState(null);

    // If no ID provided, show current user's profile
    const profileId = id || currentUser?.id || currentUser?._id;
    const isOwnProfile = currentUser && (currentUser.id === profileId || currentUser._id === profileId);

    const fetchProfile = useCallback(async () => {
        if (!profileId) {
            console.error('No profile ID available');
            navigate('/dashboard');
            return;
        }
        try {
            const response = await getUserProfile(profileId);
            setProfile(response.data);
            setEditForm({
                name: response.data.name,
                skills: response.data.skills?.join(', ') || '',
                avatar: response.data.avatar || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    }, [profileId, navigate]);

    useEffect(() => {
        if (profileId) {
            fetchProfile();
        }
    }, [fetchProfile]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setEditForm({ ...editForm, avatar: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    // Ensure stored base64 (without data: prefix) becomes a valid data URL for CSS
    const asDataUrl = (s) => {
        if (!s) return null;
        if (typeof s === 'string' && (s.startsWith('data:') || s.startsWith('http'))) return s;
        return `data:image/jpeg;base64,${s}`;
    };
    const fileInputRef = React.useRef(null);
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. عرض معاينة فورية
        const previewUrl = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, avatar: previewUrl }));

        // 2. تحويل الصورة إلى base64 وإرسالها للسيرفر
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            setEditForm(prev => ({ ...prev, avatar: base64 }));
            try {
                const skills = profile.skills || [];
                const response = await updateProfile({
                    name: profile.name,
                    skills: skills,
                    avatar: base64
                });
                setProfile(response.data.user);
                if (isOwnProfile) {
                    setUser(response.data.user);
                }
            } catch (error) {
                console.error('Error saving avatar:', error);
                alert('حدث خطأ أثناء حفظ الصورة');
            }
        };
        reader.readAsDataURL(file);
    };
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const skills = editForm.skills.split(',').map(s => s.trim()).filter(s => s);
            const response = await updateProfile({
                name: editForm.name,
                skills: skills,
                avatar: editForm.avatar
            });

            setProfile(response.data.user);
            if (isOwnProfile) {
                setUser(response.data.user);
            }
            setIsEditing(false);
            alert('تم تحديث الملف الشخصي بنجاح!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('حدث خطأ أثناء التحديث');
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    if (!profile) {
        return (
            <div className="container">
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p>المستخدم غير موجود</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container container">
            {/* Header Section */}
            <div className="profile-header-card">
                <div className="profile-cover"></div>
                <div className="profile-info-main">
                    <div className="avatar-wrapper">
                        {/* هنا يتم عرض الصورة سواء كانت رابط دائم أو رابط معاينة مؤقت */}
                        <div className="profile-avatar" style={{
                            backgroundImage: profile.avatar ? `url(${profile.avatar.startsWith('blob') ? profile.avatar : asDataUrl(profile.avatar)})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}>
                            {!profile.avatar && profile.name && profile.name.charAt(0).toUpperCase()}
                        </div>

                        {isOwnProfile && (
                            <>
                                <button
                                    className="edit-avatar-btn"
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current.click();
                                    }}
                                >
                                    <FaCamera />
                                </button>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                            </>
                        )}
                    </div>

                    <div className="user-details">
                        <div className="name-row">
                            <h1>{profile.name}</h1>
                            {isOwnProfile && !isEditing && (
                                <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                                    <FaEdit /> تعديل الملف الشخصي
                                </button>
                            )}
                        </div>
                        <p className="university-tag"><FaUniversity /> {profile.university} — {profile.major}</p>
                        <div className="stats-strip">
                            <div className="stat-item">
                                <FaStar className="icon-gold" />
                                <span><strong>{profile.points}</strong> نقطة</span>
                            </div>
                            <div className="stat-item">
                                <FaGraduationCap />
                                <span>{profile.studentId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-grid">
                <div className="profile-side">
                    {isEditing ? (
                        <div className="card edit-form-card">
                            <h3>تحديث المعلومات</h3>
                            <form onSubmit={handleUpdateProfile}>
                                <div className="form-group">
                                    <label className="form-label">الاسم المستعار</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">المهارات (فاصلة بين كل مهارة)</label>
                                    <textarea
                                        className="form-textarea"
                                        value={editForm.skills}
                                        onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                                        placeholder="React, CSS, Problem Solving..."
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary btn-save">حفظ</button>
                                    <button type="button" className="btn btn-secondary btn-cancel" onClick={() => setIsEditing(false)}>إلغاء</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="card skills-card">
                            <h3>المهارات التقنية</h3>
                            <div className="skills-tags">
                                {profile.skills?.length > 0 ? profile.skills.map((skill, i) => (
                                    <span key={i} className="skill-badge">{skill}</span>
                                )) : <p className="empty-text">لا توجد مهارات مضافة</p>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile-main-content">
                    <div className="card content-card">
                        <h3>المشاريع المنجزة</h3>
                        <div className="projects-list">
                            {profile.projects?.length > 0 ? profile.projects.map((p, i) => (
                                <div key={i} className="project-item">
                                    <h4>{p.title}</h4>
                                    <p>{p.description}</p>
                                    {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer">رابط المشروع ←</a>}
                                </div>
                            )) : <p className="empty-text">لم يتم إضافة مشاريع بعد</p>}
                        </div>
                    </div>

                    {profile.enrolledCourses?.length > 0 && (
                        <div className="card content-card">
                            <h3>الدورات الحالية</h3>
                            <div className="courses-progress-grid">
                                {profile.enrolledCourses.map((c, i) => (
                                    <div key={i} className="course-progress-item">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <span>{c.courseId?.title}</span>
                                            <small>{c.progress}%</small>
                                        </div>
                                        <div className="mini-progress">
                                            <div className="fill" style={{ width: `${c.progress}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;