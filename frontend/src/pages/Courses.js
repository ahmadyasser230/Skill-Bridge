import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCourses, getCourse, getMyCourses, createCourse, enrollInCourse, updateCourseProgress, addVideo, updateCourse, deleteCourse } from '../utils/Api';
import { useAuth } from '../context/AuthContext';
import { FaPlay, FaStar, FaPlus } from 'react-icons/fa';
import './Courses.css';

const Courses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState('browse');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: 0,
        category: '',
        level: 'beginner'
    });

    // Edit state
    const [editingCourse, setEditingCourse] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', price: 0, category: '', level: 'beginner' });

    useEffect(() => {
        if (activeTab === 'browse') fetchCourses();
        else fetchMyCourses();
    }, [activeTab]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await getCourses();
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyCourses = async () => {
        setLoading(true);
        try {
            const response = await getMyCourses();
            setMyCourses(response.data);
        } catch (error) {
            console.error('Error fetching my courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            await createCourse(formData);
            setFormData({ title: '', description: '', price: 0, category: '', level: 'beginner' });
            setShowCreateForm(false);
            // بعد الإنشاء روح على تاب "دوراتي"
            setActiveTab('my-courses');
            alert('تم إنشاء الدورة بنجاح!');
        } catch (error) {
            console.error('Error creating course:', error);
            alert(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const openEdit = (course) => {
        setEditingCourse(course);
        setEditForm({ title: course.title, description: course.description, price: course.price, category: course.category, level: course.level });
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try {
            await updateCourse(editingCourse._id, editForm);
            setEditingCourse(null);
            if (activeTab === 'my-courses') fetchMyCourses();
            else fetchCourses();
            alert('تم تحديث الدورة بنجاح!');
        } catch (error) {
            console.error('Error updating course:', error);
            alert(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الدورة؟ سيتم فقدان جميع بياناتها.')) return;
        try {
            await deleteCourse(courseId);
            if (activeTab === 'my-courses') fetchMyCourses();
            else fetchCourses();
            alert('تم حذف الدورة بنجاح');
        } catch (error) {
            console.error('Error deleting course:', error);
            alert(error.response?.data?.message || 'حدث خطأ');
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '8px', marginTop: '12px' }}>
                <h1 style={{ color: '#0f172a' }}>الدورات التعليمية</h1>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className={activeTab === 'browse' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setActiveTab('browse')}>تصفح الدورات</button>
                        <button className={activeTab === 'my-courses' ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setActiveTab('my-courses')}>دوراتي</button>
                    </div>
                    <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                        <FaPlus /> إنشاء دورة جديدة
                    </button>
                </div>
            </div>

            {/* Create Course Modal */}
            {showCreateForm && (
                <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '20px' }}>إنشاء دورة جديدة</h2>
                        <form onSubmit={handleCreateCourse}>
                            <div className="form-group">
                                <label className="form-label">عنوان الدورة</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الوصف</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="form-textarea"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">السعر (بالنقاط)</label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                    className="form-input"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الفئة</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="form-input"
                                    placeholder="مثال: البرمجة، التصميم، الرياضيات"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">المستوى</label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="beginner">مبتدئ</option>
                                    <option value="intermediate">متوسط</option>
                                    <option value="advanced">متقدم</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    إنشاء الدورة
                                </button>
                                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Course Modal */}
            {editingCourse && (
                <div className="modal-overlay" onClick={() => setEditingCourse(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '20px' }}>تعديل الدورة</h2>
                        <form onSubmit={handleUpdateCourse}>
                            <div className="form-group">
                                <label className="form-label">عنوان الدورة</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الوصف</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="form-textarea"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">السعر (بالنقاط)</label>
                                <input
                                    type="number"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) })}
                                    className="form-input"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الفئة</label>
                                <input
                                    type="text"
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">المستوى</label>
                                <select
                                    value={editForm.level}
                                    onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="beginner">مبتدئ</option>
                                    <option value="intermediate">متوسط</option>
                                    <option value="advanced">متقدم</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    حفظ التغييرات
                                </button>
                                <button type="button" onClick={() => setEditingCourse(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Courses Grid */}
            {loading ? (
                <div className="spinner"></div>
            ) : (activeTab === 'browse' ? (courses.length > 0 ? (
                <div className="grid grid-3">
                    {courses.map((course) => {
                        const isOwner = user && course.instructor && (course.instructor._id === user.id || course.instructor._id === user._id);
                        return (
                            <div key={course._id}>
                                <Link to={`/courses/${course._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card">
                                        <div className="card-actions">
                                            {isOwner && (
                                                <>
                                                    <div className="icon-btn" title="تعديل" onClick={(e) => { e.preventDefault(); openEdit(course); }}>&#9998;</div>
                                                    <div className="icon-btn" title="حذف" onClick={(e) => { e.preventDefault(); handleDeleteCourse(course._id); }}>&#128465;</div>
                                                </>
                                            )}
                                        </div>

                                        <div style={{
                                            height: '150px',
                                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                                            borderRadius: '8px',
                                            marginBottom: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#0f172a'
                                        }}>
                                            <FaPlay size={40} />
                                        </div>
                                        <h3 style={{ marginBottom: '10px' }}>{course.title}</h3>
                                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                                            {course.description.substring(0, 100)}...
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span className="badge badge-primary">{course.category}</span>
                                            <span style={{ fontSize: '14px', color: '#666' }}>
                                                {course.level === 'beginner' ? 'مبتدئ' :
                                                    course.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <FaStar color="#f59e0b" />
                                                <span>{course.rating.toFixed(1)}</span>
                                            </div>
                                            <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                                                {course.price} نقطة
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                            بواسطة: {course.instructor.name}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: '#666' }}>لا توجد دورات متاحة حالياً</p>
                </div>
            )) : (myCourses.length > 0 ? (
                <div className="grid grid-3">
                    {myCourses.map((course) => (
                        <div key={course._id}>
                            <div className="card" style={{ position: 'relative' }}>
                                <div className="card-actions">
                                    <div className="icon-btn" title="تعديل" onClick={(e) => { e.stopPropagation(); openEdit(course); }}>&#9998;</div>
                                    <div className="icon-btn" title="حذف" onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course._id); }}>&#128465;</div>
                                </div>
                                <Link to={`/courses/${course._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                    <div style={{
                                        height: '150px',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                                        borderRadius: '8px',
                                        marginBottom: '15px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#0f172a'
                                    }}>
                                        <FaPlay size={40} />
                                    </div>
                                    <h3 style={{ marginBottom: '10px' }}>{course.title}</h3>
                                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                                        {course.description.substring(0, 100)}...
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span className="badge badge-primary">{course.category}</span>
                                        <span style={{ fontSize: '14px', color: '#666' }}>
                                            {course.level === 'beginner' ? 'مبتدئ' :
                                                course.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <FaStar color="#f59e0b" />
                                            <span>{course.rating.toFixed(1)}</span>
                                        </div>
                                        <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                                            {course.price} نقطة
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                                        بواسطة: أنت
                                    </p>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: '#666' }}>لا توجد دورات خاصة بك بعد</p>
                </div>
            )))}
        </div>
    );
};

export default Courses;