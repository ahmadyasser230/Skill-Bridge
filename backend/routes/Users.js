const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/Auth');

// Get user profile
router.get('/profile/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('enrolledCourses.courseId')
            .populate('createdCourses');

        if (!user) {
            return res.status(404).json({ message: 'المستخدم غير موجود' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, skills, projects, avatar } = req.body;

        // Basic validation for avatar size to avoid huge payloads (5MB)
        const maxAvatarBytes = 5 * 1024 * 1024;
        if (avatar && typeof avatar === 'string' && Buffer.byteLength(avatar, 'base64') > maxAvatarBytes) {
            return res.status(413).json({ message: 'حجم الصورة كبير جدًا (الحد 5MB). استخدم صورة أصغر.' });
        }

        const update = { name };
        if (skills !== undefined) update.skills = skills;
        if (projects !== undefined) update.projects = projects;
        if (avatar !== undefined) update.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            req.userId,
            update,
            { new: true }
        ).select('-password');

        res.json({ message: 'تم تحديث الملف الشخصي بنجاح', user });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Add project to user profile
router.post('/projects', authMiddleware, async (req, res) => {
    try {
        const { title, description, link } = req.body;

        const user = await User.findById(req.userId);
        user.projects.push({ title, description, link, date: new Date() });
        await user.save();

        res.json({ message: 'تم إضافة المشروع بنجاح', projects: user.projects });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Update a project
router.put('/projects/:projectId', authMiddleware, async (req, res) => {
    try {
        const { title, description, link } = req.body;
        const user = await User.findById(req.userId);
        const project = user.projects.id(req.params.projectId);
        if (!project) return res.status(404).json({ message: 'المشروع غير موجود' });

        if (title !== undefined) project.title = title;
        if (description !== undefined) project.description = description;
        if (link !== undefined) project.link = link;

        await user.save();
        res.json({ message: 'تم تحديث المشروع بنجاح', projects: user.projects });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Delete a project
router.delete('/projects/:projectId', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const project = user.projects.id(req.params.projectId);
        if (!project) return res.status(404).json({ message: 'المشروع غير موجود' });

        project.deleteOne();
        await user.save();
        res.json({ message: 'تم حذف المشروع بنجاح', projects: user.projects });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Get user dashboard data
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('-password')
            .populate('enrolledCourses.courseId')
            .populate('createdCourses');

        res.json({
            user: {
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                university: user.university,
                major: user.major,
                skills: user.skills,
                points: user.points,
                projects: user.projects
            },
            enrolledCourses: user.enrolledCourses,
            createdCourses: user.createdCourses
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

module.exports = router;