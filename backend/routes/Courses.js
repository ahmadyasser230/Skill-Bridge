const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Course = require('../models/Course');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/Auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');
fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
        cb(null, name);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept video files and images
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('نوع الملف غير مدعوم'), false);
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

// Create course
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, price, category, level, videos } = req.body;

        const course = new Course({
            title,
            description,
            instructor: req.userId,
            price,
            category,
            level,
            videos: videos || []
        });

        await course.save();

        // Add to user's created courses
        await User.findByIdAndUpdate(req.userId, {
            $push: { createdCourses: course._id }
        });

        res.status(201).json({ message: 'تم إنشاء الدورة بنجاح', course });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Get all courses (token optional — used to filter out own courses)
router.get('/', async (req, res) => {
    // Try to extract userId from token without blocking unauthenticated users
    try {
        const jwt = require('jsonwebtoken');
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
        }
    } catch (_) { }
    try {
        const { category, level, search } = req.query;
        let query = {};

        if (category) query.category = category;
        if (level) query.level = level;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // استثناء دورات المستخدم الحالي من التصفح العام
        if (req.query.excludeMine && req.userId) {
            query.instructor = { $ne: req.userId };
        }

        const courses = await Course.find(query)
            .populate('instructor', 'name university')
            .sort({ createdAt: -1 });

        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Get single course
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name university major skills')
            .populate('reviews.user', 'name');

        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }

        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Get courses created by current user
router.get('/mine/list', authMiddleware, async (req, res) => {
    try {
        const courses = await Course.find({ instructor: req.userId }).sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Enroll in course
router.post('/:id/enroll', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        const user = await User.findById(req.userId);

        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }

        // Check if already enrolled
        const alreadyEnrolled = user.enrolledCourses.some(
            ec => ec.courseId.toString() === course._id.toString()
        );

        if (alreadyEnrolled) {
            console.warn(`Enroll attempt: user ${user._id} already enrolled in course ${course._id}`);
            return res.status(400).json({ message: 'أنت مسجل بالفعل في هذه الدورة' });
        }

        // Check if user has enough points
        if (user.points < course.price) {
            console.warn(`Enroll attempt: user ${user._id} has ${user.points} points, course ${course._id} costs ${course.price}`);
            return res.status(400).json({ message: 'ليس لديك نقاط كافية لشراء هذه الدورة' });
        }

        // Deduct points from buyer
        user.points -= course.price;
        user.enrolledCourses.push({
            courseId: course._id,
            progress: 0
        });
        await user.save();

        // Add points to instructor
        const instructor = await User.findById(course.instructor);
        instructor.points += course.price;
        await instructor.save();

        // Update course
        course.enrolledStudents.push(req.userId);
        course.totalRevenue += course.price;
        await course.save();

        // Create notification for instructor
        const notification = new Notification({
            user: course.instructor,
            type: 'course',
            title: 'تسجيل طالب جديد',
            message: `قام ${user.name} بالتسجيل في دورتك: ${course.title}`,
            link: `/courses/${course._id}`,
            relatedId: course._id
        });
        await notification.save();

        res.json({ message: 'تم التسجيل في الدورة بنجاح', course });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Update course progress
router.put('/:id/progress', authMiddleware, async (req, res) => {
    try {
        const { progress } = req.body;
        const user = await User.findById(req.userId);

        const enrolledCourse = user.enrolledCourses.find(
            ec => ec.courseId.toString() === req.params.id
        );

        if (!enrolledCourse) {
            return res.status(404).json({ message: 'لم يتم العثور على الدورة' });
        }

        enrolledCourse.progress = progress;
        await user.save();

        res.json({ message: 'تم تحديث التقدم بنجاح', progress });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Add review
router.post('/:id/reviews', authMiddleware, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }

        // Check if already reviewed
        const existingReview = course.reviews.find(
            r => r.user.toString() === req.userId
        );

        if (existingReview) {
            return res.status(400).json({ message: 'لقد قمت بالفعل بتقييم هذه الدورة' });
        }

        course.reviews.push({
            user: req.userId,
            rating,
            comment
        });

        // Update average rating
        const totalRating = course.reviews.reduce((sum, r) => sum + r.rating, 0);
        course.rating = totalRating / course.reviews.length;

        await course.save();

        res.json({ message: 'تم إضافة التقييم بنجاح', course });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Add video to course (supports URL or file upload)
router.post('/:id/videos', authMiddleware, upload.single('video'), async (req, res) => {
    try {
        const { title, description, videoUrl } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'الدورة غير موجودة' });
        }

        if (course.instructor.toString() !== req.userId) {
            return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' });
        }

        // Validate title
        if (!title || title.trim() === '') {
            return res.status(400).json({ message: 'يجب إدخال عنوان للفيديو' });
        }

        // If file uploaded, validate its mimetype (defensive)
        if (req.file) {
            const mimetype = req.file.mimetype || '';
            if (!mimetype.startsWith('video/') && !mimetype.startsWith('image/')) {
                return res.status(400).json({ message: 'نوع الملف غير مدعوم' });
            }
        }

        let finalUrl = videoUrl;
        if (req.file) {
            finalUrl = `${req.protocol}://${req.get('host')}/uploads/videos/${req.file.filename}`;
        }

        course.videos.push({
            title: title.trim(),
            description: description || '',
            videoUrl: finalUrl,
            duration: req.body.duration || 0,
            order: course.videos.length + 1
        });

        await course.save();

        res.json({ message: 'تم إضافة الفيديو بنجاح', course });
    } catch (error) {
        console.error('Error adding video:', error);
        // Let the central error handler format response
        throw error;
    }
});

// Delete a video from a course (only instructor)
router.delete('/:id/videos/:videoId', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
        if (course.instructor.toString() !== req.userId) return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' });

        const video = course.videos.id(req.params.videoId);
        if (!video) return res.status(404).json({ message: 'الفيديو غير موجود' });

        // If uploaded file, delete from disk
        if (video.videoUrl && video.videoUrl.includes('/uploads/videos/')) {
            const fname = video.videoUrl.split('/uploads/videos/')[1];
            const fpath = path.join(uploadDir, fname);
            try {
                if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
            } catch (err) {
                console.warn('Failed to remove video file:', err.message);
            }
        }

        video.deleteOne();
        await course.save();

        res.json({ message: 'تم حذف الفيديو بنجاح', course });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Update video metadata (only instructor)
router.put('/:id/videos/:videoId', authMiddleware, async (req, res) => {
    try {
        const { title, description, order } = req.body;
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
        if (course.instructor.toString() !== req.userId) return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' });

        const video = course.videos.id(req.params.videoId);
        if (!video) return res.status(404).json({ message: 'الفيديو غير موجود' });

        if (title) video.title = title;
        if (description) video.description = description;
        if (order !== undefined) video.order = order;

        await course.save();

        res.json({ message: 'تم تحديث بيانات الفيديو', course });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Update a course (only instructor)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, description, price, category, level } = req.body;
        const course = await Course.findById(req.params.id);

        if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
        if (course.instructor.toString() !== req.userId) return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' });

        if (title) course.title = title;
        if (description) course.description = description;
        if (price !== undefined) course.price = price;
        if (category) course.category = category;
        if (level) course.level = level;

        await course.save();

        res.json({ message: 'تم تحديث الدورة بنجاح', course });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Delete a course (only instructor)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) return res.status(404).json({ message: 'الدورة غير موجودة' });
        if (course.instructor.toString() !== req.userId) return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' });

        // Remove reference from enrolled users
        await User.updateMany(
            { 'enrolledCourses.courseId': course._id },
            { $pull: { enrolledCourses: { courseId: course._id } } }
        );

        // Remove from creator's list
        await User.findByIdAndUpdate(course.instructor, { $pull: { createdCourses: course._id } });

        // Optionally remove uploaded files
        if (course.videos && course.videos.length > 0) {
            course.videos.forEach(v => {
                try {
                    if (v.videoUrl && v.videoUrl.includes('/uploads/videos/')) {
                        const fname = v.videoUrl.split('/uploads/videos/')[1];
                        const fpath = path.join(uploadDir, fname);
                        if (fs.existsSync(fpath)) fs.unlinkSync(fpath);
                    }
                } catch (err) {
                    console.warn('Failed to remove video file:', err.message);
                }
            });
        }

        await Course.findByIdAndDelete(course._id);

        res.json({ message: 'تم حذف الدورة بنجاح' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

module.exports = router;