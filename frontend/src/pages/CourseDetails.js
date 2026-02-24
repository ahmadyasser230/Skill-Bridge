import React, { useState, useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, enrollInCourse, updateCourseProgress, addVideo, addReview, deleteVideo, updateVideo, updateCourse, deleteCourse } from '../utils/Api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContext';
import { FaPlay, FaStar, FaPlus, FaCheck } from 'react-icons/fa';
import './CourseDetail.css';


const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [showAddVideo, setShowAddVideo] = useState(false);
    const [videoForm, setVideoForm] = useState({
        title: '',
        description: '',
        videoUrl: ''
    });
    const [videoFile, setVideoFile] = useState(null);

    // Course edit
    const [showEditCourse, setShowEditCourse] = useState(false);
    const [courseForm, setCourseForm] = useState({ title: '', description: '', price: 0, category: '', level: 'beginner' });

    // Reviews
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) { showToast('error', 'يجب تسجيل الدخول أولاً'); return; }
        if (!isEnrolled) { showToast('error', 'يجب التسجيل في الدورة لتقييمها'); return; }
        setSubmittingReview(true);
        try {
            await addReview(id, { rating: reviewRating, comment: reviewComment });
            setReviewComment('');
            setReviewRating(5);
            showToast('success', 'تم إرسال تقييمك، شكراً!');
            fetchCourse();
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'حدث خطأ';
            showToast('error', msg);
        } finally {
            setSubmittingReview(false);
        }
    };



    useEffect(() => {
        fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            const response = await getCourse(id);
            setCourse(response.data);

            // Check if user is enrolled
            if (user && response.data.enrolledStudents.includes(user.id)) {
                setIsEnrolled(true);
                // Get progress from user's enrolled courses
                const enrolledCourse = user.enrolledCourses?.find(ec => ec.courseId === id);
                if (enrolledCourse) {
                    setCurrentProgress(enrolledCourse.progress);
                }
            }

            if (response.data.videos && response.data.videos.length > 0) {
                setSelectedVideo(response.data.videos[0]);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleEnroll = async () => {
        try {
            await enrollInCourse(id);
            showToast('success', 'تم التسجيل في الدورة بنجاح!');
            fetchCourse();
        } catch (error) {
            const errMsg = error.response?.data?.message || 'حدث خطأ أثناء التسجيل';
            showToast('error', errMsg);
        }
    };

    const handleAddVideo = async (e) => {
        e.preventDefault();
        try {
            let { title, description, videoUrl } = videoForm;
            title = (title || '').trim();
            videoUrl = (videoUrl || '').trim();

            if (!title || (!videoUrl && !videoFile)) {
                showToast('error', 'الرجاء تعبئة العنوان وإرفاق رابط أو ملف فيديو');
                return;
            }

            // If editing an existing video (selectedVideo has _id and belongs to course)
            if (selectedVideo && selectedVideo._id) {
                // If file chosen, upload and replace
                if (videoFile) {
                    const form = new FormData();
                    form.append('video', videoFile);
                    form.append('title', title);
                    form.append('description', description || '');

                    // For replace, we can reuse addVideo but better to remove old video first and add new
                    await addVideo(id, form);
                    await deleteVideo(id, selectedVideo._id);
                } else {
                    // Update metadata only
                    await updateVideo(id, selectedVideo._id, { title, description });
                }

                setSelectedVideo(null);
            } else {
                // If a local file is selected, upload as FormData
                if (videoFile) {
                    const form = new FormData();
                    form.append('video', videoFile);
                    form.append('title', title);
                    form.append('description', description || '');

                    await addVideo(id, form);
                } else {
                    // Normalize URL: add https:// if missing so URL() can parse it
                    if (!/^https?:\/\//i.test(videoUrl)) {
                        videoUrl = 'https://' + videoUrl;
                    }

                    try {
                        // Validate URL
                        const parsed = new URL(videoUrl);
                        videoUrl = parsed.toString();
                    } catch (err) {
                        showToast('error', 'الرابط غير صالح');
                        return;
                    }

                    await addVideo(id, { title, description, videoUrl });
                }
            }

            setVideoForm({ title: '', description: '', videoUrl: '' });
            setVideoFile(null);
            setShowAddVideo(false);
            fetchCourse();
            showToast('success', 'تم حفظ التغييرات!');
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || 'حدث خطأ';
            showToast('error', errMsg);
        }
    };

    const handleVideoComplete = async (videoIndex) => {
        const newProgress = ((videoIndex + 1) / course.videos.length) * 100;
        try {
            await updateCourseProgress(id, newProgress);
            setCurrentProgress(newProgress);
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm('هل تريد حذف هذا الفيديو؟ هذه العملية غير قابلة للاستعادة.')) return;
        try {
            await deleteVideo(id, videoId);
            showToast('success', 'تم حذف الفيديو');
            fetchCourse();
        } catch (error) {
            const msg = error.response?.data?.message || 'حدث خطأ عند الحذف';
            showToast('error', msg);
            console.error('Error deleting video:', error);
        }
    };

    if (loading) {
        return <div className="spinner"></div>;
    }

    if (!course) {
        return <div className="container"><p style={{ color: '#0f172a' }}>الدورة غير موجودة</p></div>;
    }

    const isInstructor = user && course.instructor._id === user.id;

    return (
        <div className="container">
            {/* Course Header */}
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', color: '#0f172a' }}>
                <h1 style={{ marginBottom: '15px' }}>{course.title}</h1>
                <p style={{ fontSize: '18px', marginBottom: '20px', opacity: 0.9 }}>
                    {course.description}
                </p>
                <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <div>
                        <strong>المدرس:</strong> {course.instructor.name}
                    </div>
                    <div>
                        <strong>الفئة:</strong> {course.category}
                    </div>
                    <div>
                        <strong>المستوى:</strong>{' '}
                        {course.level === 'beginner' ? 'مبتدئ' :
                            course.level === 'intermediate' ? 'متوسط' : 'متقدم'}
                    </div>
                    <div>
                        <FaStar color="#fbbf24" /> {course.rating.toFixed(1)}
                    </div>
                    <div>
                        <strong>{course.enrolledStudents.length}</strong> طالب مسجل
                    </div>
                </div>
                {!isEnrolled && !isInstructor && (
                    <>
                        <button
                            onClick={handleEnroll}
                            className="btn"
                            style={{
                                background: 'white',
                                color: 'var(--primary)',
                                padding: '15px 40px',
                                fontSize: '18px'
                            }}
                            disabled={!user || (user.points < course.price)}
                        >
                            التسجيل في الدورة ({course.price} نقطة)
                        </button>

                        {!user && (
                            <p style={{ color: '#f87171', marginTop: '10px' }}>سجّل الدخول للتسجيل في الدورة</p>
                        )}

                        {user && user.points < course.price && (
                            <p style={{ color: '#f87171', marginTop: '10px' }}>لا تملك نقاط كافية ({user.points}/{course.price})</p>
                        )}
                    </>
                )}
                {isEnrolled && (
                    <div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>تقدمك:</strong> {currentProgress.toFixed(0)}%
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${currentProgress}%` }}></div>
                        </div>
                    </div>
                )}
                {isInstructor && (
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setShowAddVideo(true)} className="btn" style={{
                            background: 'white',
                            color: 'var(--primary)',
                            padding: '12px 24px'
                        }}>
                            <FaPlus /> إضافة فيديو
                        </button>
                        <button onClick={() => { setShowEditCourse(true); setCourseForm({ title: course.title, description: course.description, price: course.price, category: course.category, level: course.level }); }} className="btn btn-secondary">
                            تعديل الدورة
                        </button>
                        <button onClick={async () => { if (!window.confirm('هل أنت متأكد من حذف هذه الدورة؟')) return; try { await deleteCourse(course._id); showToast('success', 'تم حذف الدورة'); navigate('/courses'); } catch (err) { showToast('error', err.response?.data?.message || 'حدث خطأ'); } }} className="btn btn-danger">
                            حذف الدورة
                        </button>
                    </div>
                )}
            </div>



            {/* Add Video Modal */}
            {showAddVideo && (
                <div className="modal-overlay" onClick={() => { setShowAddVideo(false); setSelectedVideo(null); setVideoForm({ title: '', description: '', videoUrl: '' }); setVideoFile(null); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '20px' }}>{selectedVideo && selectedVideo._id ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}</h2>
                        <form onSubmit={handleAddVideo}>
                            <div className="form-group">
                                <label className="form-label">عنوان الفيديو</label>
                                <input
                                    type="text"
                                    value={videoForm.title}
                                    onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الوصف</label>
                                <textarea
                                    value={videoForm.description}
                                    onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                                    className="form-textarea"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">رابط الفيديو</label>
                                <input
                                    type="url"
                                    value={videoForm.videoUrl}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setVideoForm({ ...videoForm, videoUrl: val });
                                        // if user types a URL, clear any selected file and disable file input
                                        if (val) setVideoFile(null);
                                    }}
                                    className="form-input"
                                    placeholder="https://youtube.com/..."
                                    disabled={!!videoFile}
                                />
                                <small style={{ color: '#666' }}>{videoFile ? 'تم اختيار ملف محلي — لإدخال رابط أزل الملف أولاً' : 'أدخل رابط YouTube أو رابط مباشر لملف الفيديو (اختياري)'}</small>
                            </div>

                            <div className="form-group">
                                <label className="form-label">أو رفع ملف فيديو</label>
                                <input
                                    type="file"
                                    accept="video/*,image/*"
                                    onChange={(e) => {
                                        const f = e.target.files[0];
                                        setVideoFile(f || null);
                                        if (f) setVideoForm({ ...videoForm, videoUrl: '' });
                                    }}
                                    className="form-input"
                                    disabled={!!videoForm.videoUrl}
                                />
                                <small style={{ color: '#666' }}>{videoForm.videoUrl ? 'تم إدخال رابط — لإرفاق ملف أزل الرابط أولاً' : 'إذا رفعت ملفًا سيتم رفعه للسيرفر واستخدامه كمصدر للفيديو'}</small>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    إضافة الفيديو
                                </button>
                                <button type="button" onClick={() => setShowAddVideo(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Course Content */}
            {(isEnrolled || isInstructor) ? (
                <>
                    <div className="course-grid">
                        {/* Video Player */}
                        <div className="course-left">
                            <div className="card course-player">
                                {selectedVideo ? (
                                    <div>
                                        <div className="player-viewport">
                                            {(() => {
                                                const rawUrl = selectedVideo.videoUrl || '';
                                                // إصلاح روابط الفيديو المرفوعة — تحويلها لتشير للـ backend
                                                const url = rawUrl.startsWith('/uploads/')
                                                    ? `https://skill-bridge-gmup.onrender.com${rawUrl}`
                                                    : rawUrl;

                                                const isImage = url.match(/\.(png|jpe?g|gif|svg)(\?.*)?$/i);
                                                const isVideoFile = url.match(/\.(mp4|webm|ogg|avi|mov|mkv)(\?.*)?$/i)
                                                    || url.includes('/uploads/videos/');

                                                let embedUrl = null;
                                                try {
                                                    const parsed = new URL(url);
                                                    const host = parsed.hostname;
                                                    if (host.includes('youtu.be')) {
                                                        const id = parsed.pathname.slice(1);
                                                        embedUrl = `https://www.youtube.com/embed/${id}`;
                                                    } else if (host.includes('youtube.com')) {
                                                        const vid = parsed.searchParams.get('v');
                                                        if (vid) embedUrl = `https://www.youtube.com/embed/${vid}`;
                                                        else if (parsed.pathname.includes('/embed/')) embedUrl = url;
                                                    }
                                                } catch (e) {
                                                    // ignore parsing errors
                                                }

                                                if (embedUrl) {
                                                    return (
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            src={embedUrl}
                                                            title={selectedVideo.title}
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            style={{ borderRadius: '8px' }}
                                                        ></iframe>
                                                    );
                                                } else if (isVideoFile) {
                                                    return (
                                                        <video width="100%" height="100%" controls style={{ borderRadius: '8px' }} key={url}>
                                                            <source src={url} type="video/mp4" />
                                                            <source src={url} />
                                                            متصفحك لا يدعم تشغيل الفيديو.
                                                        </video>
                                                    );
                                                } else if (isImage) {
                                                    return <img src={url} alt={selectedVideo.title} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />;
                                                } else {
                                                    return (
                                                        <div style={{ textAlign: 'center', color: '#fff' }}>
                                                            <p>لا يمكن عرض هذا الرابط داخل المشغل.</p>
                                                            <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary">فتح في تبويب جديد</a>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>
                                        <h3>{selectedVideo.title}</h3>
                                        <p style={{ color: '#666', marginTop: '10px' }}>{selectedVideo.description}</p>
                                        {isEnrolled && (
                                            <button
                                                onClick={() => handleVideoComplete(course.videos.indexOf(selectedVideo))}
                                                className="btn btn-success"
                                                style={{ marginTop: '15px' }}
                                            >
                                                <FaCheck /> تم إكمال الفيديو
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                        لا توجد فيديوهات متاحة حالياً
                                    </p>
                                )}
                            </div>

                            {/* Reviews (shown under video player/content) */}
                            <div className="card" style={{ marginTop: '20px' }}>
                                <h3 style={{ marginBottom: '15px' }}>التقييمات</h3>
                                {course.reviews && course.reviews.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {course.reviews.map((r) => (
                                            <div key={r._id} className="review-card">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong>{r.user?.name || 'مستخدم'}</strong>
                                                    <div style={{ color: '#fbbf24' }}>{Array.from({ length: r.rating }).map((_, i) => <FaStar key={i} />)}</div>
                                                </div>
                                                {r.comment && <p style={{ color: '#666', marginTop: '8px' }}>{r.comment}</p>}
                                                <div style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>{new Date(r.createdAt).toLocaleDateString('ar')}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#666' }}>لا توجد تقييمات بعد</p>
                                )}

                                {isEnrolled && !course.reviews?.some(rv => rv.user?.toString() === (user?.id || user?._id)) && (
                                    <form onSubmit={handleSubmitReview} style={{ marginTop: '16px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                                            <label className="form-label" style={{ margin: 0 }}>التقييم:</label>
                                            <select value={reviewRating} onChange={(e) => setReviewRating(parseInt(e.target.value))} className="form-select" style={{ width: '120px' }}>
                                                <option value={5}>5 - ممتاز</option>
                                                <option value={4}>4 - جيد جداً</option>
                                                <option value={3}>3 - جيد</option>
                                                <option value={2}>2 - مقبول</option>
                                                <option value={1}>1 - ضعيف</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <textarea placeholder="اكتب رأيك..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="form-textarea" />
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingReview}>
                                                {submittingReview ? 'جاري الإرسال...' : 'إرسال التقييم'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Right column: محتوى الدورة (narrow) */}
                        <aside className="course-sidebar">
                            <div className="card">
                                <h3 style={{ marginBottom: '20px' }}>محتوى الدورة</h3>
                                {course.videos && course.videos.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {course.videos.map((video, index) => (
                                            <div
                                                key={video._id || index}
                                                className={'video-list-item' + (selectedVideo === video ? ' selected' : '')}
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }} onClick={() => setSelectedVideo(video)}>
                                                    <FaPlay size={14} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 'bold' }}>{video.title}</div>
                                                        {video.duration > 0 && (
                                                            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
                                                                {video.duration} دقيقة
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {isInstructor && (
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button className="btn btn-secondary" onClick={() => { setSelectedVideo(video); setShowAddVideo(true); setVideoForm({ title: video.title, description: video.description || '', videoUrl: video.videoUrl }); }}>
                                                            تعديل
                                                        </button>
                                                        <button className="btn btn-danger" onClick={() => handleDeleteVideo(video._id)}>
                                                            حذف
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', textAlign: 'center' }}>لا توجد فيديوهات بعد</p>
                                )}
                            </div>
                        </aside>
                    </div>
                </>
            ) : (
                <div className="card" style={{ marginTop: '30px', textAlign: 'center', padding: '60px' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>محتوى الدورة محمي</h3>                    <p style={{ color: '#666', marginBottom: '30px' }}>
                        يجب التسجيل في الدورة لمشاهدة الفيديوهات والمحتوى التعليمي
                    </p>
                    {!isInstructor && (
                        <button onClick={handleEnroll} className="btn btn-primary" style={{ padding: '15px 40px', fontSize: '18px' }}>
                            سجل الآن ({course.price} نقطة)
                        </button>
                    )}
                </div>
            )}
            {/* Edit Course Modal */}
            {showEditCourse && (
                <div className="modal-overlay" onClick={() => setShowEditCourse(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '20px' }}>تعديل الدورة</h2>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await updateCourse(course._id, courseForm);
                                setShowEditCourse(false);
                                fetchCourse();
                                showToast('success', 'تم تحديث الدورة');
                            } catch (err) {
                                showToast('error', err.response?.data?.message || 'حدث خطأ');
                            }
                        }}>
                            <div className="form-group">
                                <label className="form-label">عنوان الدورة</label>
                                <input className="form-input" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الوصف</label>
                                <textarea className="form-textarea" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">السعر</label>
                                <input className="form-input" type="number" min="0" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: parseInt(e.target.value) })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الفئة</label>
                                <input className="form-input" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">المستوى</label>
                                <select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })} className="form-select">
                                    <option value="beginner">مبتدئ</option>
                                    <option value="intermediate">متوسط</option>
                                    <option value="advanced">متقدم</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="submit" className="btn btn-primary">حفظ التغييرات</button>
                                <button type="button" onClick={() => setShowEditCourse(false)} className="btn btn-secondary">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseDetail;