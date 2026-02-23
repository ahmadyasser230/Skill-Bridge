import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getHelpRequests, getMyRequests, createHelpRequest, submitOffer, acceptOffer, completeRequest, updateHelpRequest, deleteHelpRequest } from '../utils/Api';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaClock, FaCheckCircle } from 'react-icons/fa';
import './HelpRequests.css';

const HelpRequests = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('browse');
    const [requests, setRequests] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        deadline: '',
        difficulty: 'easy'
    });

    // Edit state
    const [editingRequest, setEditingRequest] = useState(null);
    const [editFormData, setEditFormData] = useState({ title: '', description: '', category: '', deadline: '' });
    const [offerForm, setOfferForm] = useState({
        message: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'browse') {
                const response = await getHelpRequests();
                setRequests(response.data);
            } else {
                const response = await getMyRequests();
                setMyRequests(response.data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateRequest = async (e) => {
        e.preventDefault();

        // Check if user already has an open request
        const hasOpenRequest = myRequests.some(req => req.status === 'open');
        if (hasOpenRequest) {
            alert('لديك طلب مساعدة مفتوح بالفعل. يجب إغلاق الطلب الحالي قبل إنشاء طلب جديد.');
            return;
        }

        try {
            await createHelpRequest(formData);
            setFormData({ title: '', description: '', category: '', deadline: '', difficulty: 'easy' });
            setShowCreateForm(false);
            fetchData();
        } catch (error) {
            console.error('Error creating request:', error);
        }
    };

    const openEditRequest = (request) => {
        setEditingRequest(request);
        setEditFormData({ title: request.title, description: request.description, category: request.category, deadline: request.deadline ? request.deadline.split('T')[0] : '' });
    };

    const handleUpdateRequest = async (e) => {
        e.preventDefault();
        try {
            await updateHelpRequest(editingRequest._id, editFormData);
            setEditingRequest(null);
            fetchData();
            alert('تم تحديث الطلب بنجاح');
        } catch (error) {
            console.error('Error updating request:', error);
            alert(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm('هل أنت متأكد من حذف طلب المساعدة؟ لا يمكن التراجع عن ذلك.')) return;
        try {
            await deleteHelpRequest(requestId);
            fetchData();
            alert('تم حذف الطلب بنجاح');
        } catch (error) {
            console.error('Error deleting request:', error);
            alert(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleSubmitOffer = async (requestId) => {
        try {
            await submitOffer(requestId, {
                message: offerForm.message
            });
            setOfferForm({ message: '' });
            setSelectedRequest(null);
            alert('تم تقديم العرض بنجاح!');
            fetchData();
        } catch (error) {
            console.error('Error submitting offer:', error);
            alert(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleAcceptOffer = async (requestId, offerId) => {
        try {
            await acceptOffer(requestId, offerId);
            alert('تم قبول العرض وإنشاء محادثة!');
            fetchData();
        } catch (error) {
            console.error('Error accepting offer:', error);
            alert(error.response?.data?.message || 'حدث خطأ');
        }
    };

    const handleCompleteRequest = async (requestId) => {
        try {
            await completeRequest(requestId);
            alert('تم إكمال الطلب ومنح النقاط!');
            fetchData();
        } catch (error) {
            console.error('Error completing request:', error);
        }
    };

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#0f172a' }}>طلبات المساعدة</h1>
                {activeTab === 'my-requests' && !myRequests.some(req => req.status === 'open') && (
                    <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                        <FaPlus /> طلب مساعدة جديد
                    </button>
                )}
                {activeTab === 'my-requests' && myRequests.some(req => req.status === 'open') && (
                    <div style={{
                        padding: '10px 20px',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '8px'
                    }}>
                        لديك طلب مساعدة مفتوح - أكمله أولاً
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <button
                    className={activeTab === 'browse' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setActiveTab('browse')}
                >
                    تصفح الطلبات
                </button>
                <button
                    className={activeTab === 'my-requests' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setActiveTab('my-requests')}
                >
                    طلباتي
                </button>
            </div>

            {/* Create Request Modal */}
            {showCreateForm && (
                <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '20px' }}>طلب مساعدة جديد</h2>
                        <form onSubmit={handleCreateRequest}>
                            <div className="form-group">
                                <label className="form-label">العنوان</label>
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
                                <label className="form-label">الفئة</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="form-select"
                                    required
                                >
                                    <option value="">اختر الفئة</option>
                                    <option value="البرمجة">البرمجة</option>
                                    <option value="الرياضيات">الرياضيات</option>
                                    <option value="الفيزياء">الفيزياء</option>
                                    <option value="الكيمياء">الكيمياء</option>
                                    <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                                    <option value="أخرى">أخرى</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">الموعد النهائي (اختياري)</label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">مستوى الصعوبة</label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                    {[
                                        { value: 'easy', label: 'سهل', points: 10, color: '#10b981' },
                                        { value: 'medium', label: 'متوسط', points: 15, color: '#f59e0b' },
                                        { value: 'hard', label: 'صعب', points: 20, color: '#ef4444' }
                                    ].map(opt => (
                                        <label key={opt.value} style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '12px 8px',
                                            border: `2px solid ${formData.difficulty === opt.value ? opt.color : '#e5e7eb'}`,
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            background: formData.difficulty === opt.value ? `${opt.color}15` : '#fff',
                                            transition: 'all 0.2s'
                                        }}>
                                            <input
                                                type="radio"
                                                name="difficulty"
                                                value={opt.value}
                                                checked={formData.difficulty === opt.value}
                                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                                style={{ display: 'none' }}
                                            />
                                            <span style={{ fontWeight: '700', color: opt.color, fontSize: '15px' }}>{opt.label}</span>
                                            <span style={{ fontSize: '12px', color: '#666' }}>{opt.points} نقطة</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    إنشاء الطلب
                                </button>
                                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Request Modal */}
            {editingRequest && (
                <div className="modal-overlay" onClick={() => setEditingRequest(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: '20px' }}>تعديل الطلب</h2>
                        <form onSubmit={handleUpdateRequest}>
                            <div className="form-group">
                                <label className="form-label">العنوان</label>
                                <input
                                    type="text"
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الوصف</label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="form-textarea"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">الفئة</label>
                                <select
                                    value={editFormData.category}
                                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                    className="form-select"
                                    required
                                >
                                    <option value="">اختر الفئة</option>
                                    <option value="البرمجة">البرمجة</option>
                                    <option value="الرياضيات">الرياضيات</option>
                                    <option value="الفيزياء">الفيزياء</option>
                                    <option value="الكيمياء">الكيمياء</option>
                                    <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                                    <option value="أخرى">أخرى</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">الموعد النهائي (اختياري)</label>
                                <input
                                    type="date"
                                    value={editFormData.deadline}
                                    onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    حفظ التغييرات
                                </button>
                                <button type="button" onClick={() => setEditingRequest(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Browse Requests */}
            {activeTab === 'browse' && (
                <div>
                    {loading ? (
                        <div className="spinner"></div>
                    ) : requests.length > 0 ? (
                        <div className="grid grid-2">
                            {requests.map((request) => {
                                const isMyRequest = user && (request.requester._id === user.id || request.requester._id === user._id);
                                return (
                                    <div key={request._id} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                                            <h3 style={{ flex: 1 }}>{request.title}</h3>
                                            <span className="badge badge-primary">{request.category}</span>
                                        </div>
                                        <p style={{ color: '#666', marginBottom: '10px' }}>{request.description}</p>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '3px 10px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                background: request.difficulty === 'easy' ? '#d1fae5' : request.difficulty === 'medium' ? '#fef3c7' : '#fee2e2',
                                                color: request.difficulty === 'easy' ? '#065f46' : request.difficulty === 'medium' ? '#92400e' : '#991b1b'
                                            }}>
                                                {request.difficulty === 'easy' ? 'سهل' : request.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                                            </span>
                                            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>🏆 {request.reward || 10} نقطة</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <span style={{ fontSize: '14px', color: '#666' }}>
                                                بواسطة: {request.requester.name}
                                            </span>
                                            {request.deadline && (
                                                <span style={{ fontSize: '14px', color: '#ef4444' }}>
                                                    <FaClock /> {new Date(request.deadline).toLocaleDateString('ar')}
                                                </span>
                                            )}
                                        </div>
                                        {!isMyRequest ? (
                                            <button
                                                onClick={() => setSelectedRequest(request._id)}
                                                className="btn btn-primary"
                                                style={{ width: '100%' }}
                                            >
                                                تقديم عرض للمساعدة
                                            </button>
                                        ) : (
                                            <div style={{
                                                padding: '10px',
                                                background: '#fef3c7',
                                                color: '#92400e',
                                                borderRadius: '8px',
                                                textAlign: 'center'
                                            }}>
                                                هذا طلبك - لا يمكنك تقديم عرض لنفسك
                                            </div>
                                        )}

                                        {selectedRequest === request._id && !isMyRequest && (
                                            <div style={{ marginTop: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                                                <h4 style={{ marginBottom: '15px' }}>عرضك للمساعدة</h4>
                                                <div className="form-group">
                                                    <textarea
                                                        placeholder="اكتب رسالتك..."
                                                        value={offerForm.message}
                                                        onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                                                        className="form-textarea"
                                                    />
                                                </div>
                                                <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: '8px', marginBottom: '12px', color: '#065f46', fontSize: '13px', fontWeight: '600' }}>
                                                    🏆 المكافأة عند الإكمال: <strong>{request.reward} نقطة</strong>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => handleSubmitOffer(request._id)} className="btn btn-success" style={{ flex: 1 }}>
                                                        إرسال العرض
                                                    </button>
                                                    <button onClick={() => setSelectedRequest(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                                                        إلغاء
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                );
                            })}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: '#666' }}>لا توجد طلبات مساعدة متاحة حالياً</p>
                        </div>
                    )}
                </div>
            )}

            {/* My Requests */}
            {activeTab === 'my-requests' && (
                <div>
                    {loading ? (
                        <div className="spinner"></div>
                    ) : myRequests.length > 0 ? (
                        <div>
                            {myRequests.map((request) => (
                                <div key={request._id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3>{request.title}</h3>
                                            <p style={{ color: '#666', marginTop: '10px' }}>{request.description}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            {request.status === 'open' && (
                                                <>
                                                    <button className="btn btn-secondary" onClick={() => openEditRequest(request)}>تعديل</button>
                                                    <button className="btn btn-danger" onClick={() => handleDeleteRequest(request._id)}>حذف</button>
                                                </>
                                            )}
                                            <span className={`badge ${request.status === 'open' ? 'badge-primary' :
                                                request.status === 'in-progress' ? 'badge-warning' :
                                                    request.status === 'completed' ? 'badge-success' : 'badge-danger'
                                                }`}>
                                                {request.status === 'open' ? 'مفتوح' :
                                                    request.status === 'in-progress' ? 'قيد التنفيذ' :
                                                        request.status === 'completed' ? 'مكتمل' : 'ملغي'}
                                            </span>
                                        </div>
                                    </div>

                                    {request.offers && request.offers.length > 0 && (
                                        <div style={{ marginTop: '20px' }}>
                                            <h4 style={{ marginBottom: '15px' }}>العروض المقدمة ({request.offers.length})</h4>
                                            {request.offers.map((offer) => (
                                                <div key={offer._id} style={{
                                                    padding: '15px',
                                                    background: '#f9fafb',
                                                    borderRadius: '8px',
                                                    marginBottom: '10px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                        <strong>{offer.helper.name}</strong>
                                                        <span className="badge badge-success">{offer.proposedReward} نقطة</span>
                                                    </div>
                                                    <p style={{ color: '#666', marginBottom: '10px' }}>{offer.message}</p>
                                                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                                        المهارات: {offer.helper.skills?.join(', ')}
                                                    </p>
                                                    {offer.status === 'pending' && request.status === 'open' && (
                                                        <button
                                                            onClick={() => handleAcceptOffer(request._id, offer._id)}
                                                            className="btn btn-success"
                                                        >
                                                            قبول العرض
                                                        </button>
                                                    )}
                                                    {offer.status === 'accepted' && (
                                                        <span className="badge badge-success">
                                                            <FaCheckCircle /> تم القبول
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {request.status === 'in-progress' && request.chatRoom && (
                                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                            <Link to={`/messages/${request.chatRoom}`} className="btn btn-primary" style={{ flex: 1 }}>
                                                الذهاب إلى المحادثة
                                            </Link>
                                            <button
                                                onClick={() => handleCompleteRequest(request._id)}
                                                className="btn btn-success"
                                                style={{ flex: 1 }}
                                            >
                                                تم الإكمال
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: '#666' }}>لم تقم بإنشاء أي طلبات بعد</p>
                            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary" style={{ marginTop: '20px' }}>
                                إنشاء طلب جديد
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HelpRequests;