import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, addProject, updateProject, deleteProject } from '../utils/Api';
import { FaStar, FaPlus, FaBook, FaHandsHelping } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddProject, setShowAddProject] = useState(false);
    const [projectForm, setProjectForm] = useState({ title: '', description: '', link: '' });
    const [editingProject, setEditingProject] = useState(null);
    const [editProjectForm, setEditProjectForm] = useState({ title: '', description: '', link: '' });

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await getDashboard();
            setDashboardData(response.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            // If token expired or invalid, clear it
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        try {
            await addProject(projectForm);
            setProjectForm({ title: '', description: '', link: '' });
            setShowAddProject(false);
            fetchDashboard();
        } catch (error) {
            console.error('Error adding project:', error);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
        try {
            await deleteProject(projectId);
            fetchDashboard();
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setEditProjectForm({ title: project.title, description: project.description, link: project.link || '' });
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        try {
            await updateProject(editingProject._id, editProjectForm);
            setEditingProject(null);
            fetchDashboard();
        } catch (error) {
            console.error('Error updating project:', error);
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    if (!dashboardData) {
        return (
            <div className="container">
                <div className="card">
                    <p style={{ color: '#0f172a' }}>تعذر تحميل بيانات لوحة التحكم. الرجاء المحاولة لاحقًا.</p>
                </div>
            </div>
        );
    }

    const { user = {}, enrolledCourses = [], createdCourses = [] } = dashboardData;

    return (
        <div className="container">
            <h1 className="dashboard-title">لوحة التحكم</h1>

            {/* User Info Card */}
            <div className="card user-profile-card">
                <div className="user-header">
                    <div>
                        <h2>{user.name} 👋</h2>
                        <div className="user-meta">
                            <span>📧 {user.email}</span>
                            <span>🎓 {user.university} - {user.major}</span>
                        </div>
                    </div>

                    <div className="user-points">
                        <FaStar />
                        <div className="points-value">{user.points}</div>
                        <div className="points-label">نقطة</div>
                    </div>
                </div>

                <div className="skills-container">
                    {user.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">
                            #{skill}
                        </span>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid-2">
                <Link to="/help-requests" className="card quick-action green">
                    <FaHandsHelping />
                    <h3>طلب مساعدة</h3>
                    <p>احصل على مساعدة من طلاب آخرين</p>
                </Link>

                <Link to="/courses" className="card quick-action orange">
                    <FaBook />
                    <h3>تصفح الدورات</h3>
                    <p>تعلم من دورات تعليمية متنوعة</p>
                </Link>
            </div>

            {/* Projects */}
            <div className="card">
                <div className="section-header">
                    <h3>المشاريع</h3>
                    <button
                        onClick={() => setShowAddProject(!showAddProject)}
                        className="btn btn-primary"
                    >
                        <FaPlus /> إضافة مشروع
                    </button>
                </div>

                {showAddProject && (
                    <form className="project-form" onSubmit={handleAddProject}>
                        <input
                            type="text"
                            placeholder="عنوان المشروع"
                            value={projectForm.title}
                            onChange={(e) =>
                                setProjectForm({ ...projectForm, title: e.target.value })
                            }
                            className="form-input"
                            required
                        />

                        <textarea
                            placeholder="وصف المشروع"
                            value={projectForm.description}
                            onChange={(e) =>
                                setProjectForm({ ...projectForm, description: e.target.value })
                            }
                            className="form-textarea"
                            required
                        />

                        <input
                            type="url"
                            placeholder="رابط المشروع (اختياري)"
                            value={projectForm.link}
                            onChange={(e) =>
                                setProjectForm({ ...projectForm, link: e.target.value })
                            }
                            className="form-input"
                        />

                        <button type="submit" className="btn btn-primary">
                            حفظ المشروع
                        </button>
                    </form>
                )}

                {user.projects?.length > 0 ? (
                    <div className="projects-list">
                        {user.projects.map((project) => (
                            <div key={project._id || project.title} className="project-item" style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                    <h4 style={{ margin: 0, flex: 1 }}>{project.title}</h4>
                                    <div style={{ display: 'flex', gap: '6px', marginRight: '10px' }}>
                                        <button
                                            onClick={() => handleEditProject(project)}
                                            className="btn btn-secondary"
                                            style={{ padding: '4px 10px', fontSize: '12px' }}
                                        >
                                            تعديل
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProject(project._id)}
                                            className="btn btn-danger"
                                            style={{ padding: '4px 10px', fontSize: '12px' }}
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </div>
                                <p style={{ color: '#666', marginBottom: '6px' }}>{project.description}</p>
                                {project.link && (
                                    <a href={project.link} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#0055ff' }}>
                                        عرض المشروع ←
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-text">لم تضف مشاريع بعد</p>
                )}
            </div>

            {/* Edit Project Modal */}
            {editingProject && (
                <div className="modal-overlay" onClick={() => setEditingProject(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '20px' }}>تعديل المشروع</h2>
                        <form onSubmit={handleUpdateProject}>
                            <div className="form-group">
                                <label className="form-label">عنوان المشروع</label>
                                <input
                                    type="text"
                                    value={editProjectForm.title}
                                    onChange={(e) => setEditProjectForm({ ...editProjectForm, title: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">وصف المشروع</label>
                                <textarea
                                    value={editProjectForm.description}
                                    onChange={(e) => setEditProjectForm({ ...editProjectForm, description: e.target.value })}
                                    className="form-textarea"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">رابط المشروع (اختياري)</label>
                                <input
                                    type="url"
                                    value={editProjectForm.link}
                                    onChange={(e) => setEditProjectForm({ ...editProjectForm, link: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>حفظ التغييرات</button>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditingProject(null)}>إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Enrolled Courses */}
            <div className="card">
                <h3>الدورات المسجل بها</h3>

                {enrolledCourses?.length > 0 ? (
                    <div className="grid-2">
                        {enrolledCourses.map((enroll) => (
                            <Link
                                key={enroll._id}
                                to={`/courses/${enroll.courseId._id}`}
                                className="course-card"
                            >
                                <h4>{enroll.courseId.title}</h4>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${enroll.progress}%` }}
                                    />
                                </div>
                                <span>{enroll.progress}% مكتمل</span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="empty-text">لم تسجل في أي دورات بعد</p>
                )}
            </div>

            {/* Created Courses */}
            {createdCourses?.length > 0 && (
                <div className="card">
                    <h3>الدورات التي أنشأتها</h3>
                    <div className="grid-2">
                        {createdCourses.map((course) => (
                            <Link
                                key={course._id}
                                to={`/courses/${course._id}`}
                                className="course-card"
                            >
                                <h4>{course.title}</h4>
                                <p>{course.enrolledStudents?.length || 0} طالب مسجل</p>
                                <p className="revenue">
                                    الإيرادات: {course.totalRevenue || 0} نقطة
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

};

export default Dashboard;