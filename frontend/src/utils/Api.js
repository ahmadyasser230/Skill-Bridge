import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const getCurrentUser = () => api.get('/auth/me');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// Users
export const getUserProfile = (userId) => api.get(`/users/profile/${userId}`);
export const updateProfile = (data) => api.put('/users/profile', data);
export const addProject = (data) => api.post('/users/projects', data);
export const updateProject = (projectId, data) => api.put(`/users/projects/${projectId}`, data);
export const deleteProject = (projectId) => api.delete(`/users/projects/${projectId}`);
export const getDashboard = () => api.get('/users/dashboard');

// Help Requests
export const createHelpRequest = (data) => api.post('/help-requests', data);
export const getHelpRequests = () => api.get('/help-requests');
export const getMyRequests = () => api.get('/help-requests/my-requests');
export const submitOffer = (requestId, data) => api.post(`/help-requests/${requestId}/offers`, data);
export const acceptOffer = (requestId, offerId) => api.post(`/help-requests/${requestId}/offers/${offerId}/accept`);
export const completeRequest = (requestId) => api.post(`/help-requests/${requestId}/complete`);

// Courses
export const createCourse = (data) => api.post('/courses', data);
export const getCourses = (params) => api.get('/courses', { params: { excludeMine: true, ...params } });
export const getCourse = (courseId) => api.get(`/courses/${courseId}`);
export const getMyCourses = () => api.get('/courses/mine/list');
export const enrollInCourse = (courseId) => api.post(`/courses/${courseId}/enroll`);
export const updateCourseProgress = (courseId, progress) => api.put(`/courses/${courseId}/progress`, { progress });
export const addReview = (courseId, data) => api.post(`/courses/${courseId}/reviews`, data);
export const addVideo = (courseId, data) => {
    // Support sending either JSON or FormData (file upload)
    if (data && typeof data.get === 'function') {
        return api.post(`/courses/${courseId}/videos`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post(`/courses/${courseId}/videos`, data);
};

export const deleteVideo = (courseId, videoId) => api.delete(`/courses/${courseId}/videos/${videoId}`);
export const updateVideo = (courseId, videoId, data) => api.put(`/courses/${courseId}/videos/${videoId}`, data);


// Course management (owner)
export const updateCourse = (courseId, data) => api.put(`/courses/${courseId}`, data);
export const deleteCourse = (courseId) => api.delete(`/courses/${courseId}`);

// Help request management
export const updateHelpRequest = (requestId, data) => api.put(`/help-requests/${requestId}`, data);
export const deleteHelpRequest = (requestId) => api.delete(`/help-requests/${requestId}`);


// Messages
export const getChatRooms = () => api.get('/messages');
export const getChatRoom = (roomId) => api.get(`/messages/${roomId}`);
export const sendMessage = (roomId, content) => api.post(`/messages/${roomId}/messages`, { content });

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markAsRead = (notificationId) => api.put(`/notifications/${notificationId}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');
export const deleteNotification = (notificationId) => api.delete(`/notifications/${notificationId}`);
export const getUnreadCount = () => api.get('/notifications/unread-count');

export const updateProfileAvatar = async (formData) => {
    // في الوضع الحقيقي، هنا يتم الرفع للسيرفر
    // حالياً سنحولها لـ Base64 ونحفظها في LocalStorage
    const file = formData.get('avatar');
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            localStorage.setItem('userAvatar', reader.result);
            resolve({ success: true, avatarUrl: reader.result });
        };
        reader.readAsDataURL(file);
    });
};

export default api;