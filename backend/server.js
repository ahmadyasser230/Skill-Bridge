require('dotenv').config();
console.log('✅ dotenv loaded');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const mongoURI = process.env.MONGODB_URI;
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
// Increase JSON body size to allow base64 avatar images from the client (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/Users');
const helpRequestRoutes = require('./routes/HelpRequests');
const courseRoutes = require('./routes/Courses');
const messageRoutes = require('./routes/Messages');
const notificationRoutes = require('./routes/Notifications');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/help-requests', helpRequestRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.io for real-time messaging
io.on('connection', (socket) => {
    console.log('مستخدم جديد متصل');

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
    });

    socket.on('send-message', (data) => {
        io.to(data.roomId).emit('receive-message', data);
    });

    socket.on('disconnect', () => {
        console.log('مستخدم قطع الاتصال');
    });
});

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'مرحباً بك في منصة طلاب غزة' });
});

// Central error handler (returns JSON with message; handles multer errors and payload size)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err && err.message ? err.message : err);

    // Payload too large from express.json/urlencoded
    if (err && (err.type === 'entity.too.large' || err.statusCode === 413 || err.status === 413)) {
        return res.status(413).json({ message: 'حجم البيانات المرسلة أكبر من الحد المسموح (جرب صورة أصغر أو استخدم رابط)' });
    }

    // Multer errors often have name 'MulterError'
    if (err && err.name === 'MulterError') {
        // Provide a friendlier message for file size limit
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'حجم الملف كبير جدًا (الحد المسموح 2 جيجابايت)' });
        }
        return res.status(400).json({ message: err.message });
    }

    if (err && err.message) {
        return res.status(500).json({ message: err.message });
    }
    res.status(500).json({ message: 'خطأ غير معروف على الخادم' });
});

server.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
