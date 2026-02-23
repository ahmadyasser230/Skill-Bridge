const express = require('express');
const crypto = require('crypto');
const { sendVerificationCode, sendPasswordResetCode } = require('../middleware/Emailservice');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/Auth');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, studentId, university, major, skills } = req.body;

        // التحقق من شروط كلمة المرور
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ message: 'كلمة المرور لا تستوفي المتطلبات (8 أحرف، حرف كبير، حرف صغير، رقم، رمز خاص)' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
        if (existingUser) {
            return res.status(400).json({ message: 'البريد الإلكتروني أو الرقم الجامعي مستخدم بالفعل' });
        }

        // توليد كود تحقق مكون من 6 أرقام
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 دقائق

        // Create new user (غير مفعّل)
        const user = new User({
            name,
            email,
            password,
            studentId,
            university,
            major,
            skills: skills || [],
            isVerified: false,
            verificationCode,
            verificationCodeExpiry
        });

        await user.save();

        // إرسال كود التحقق بالإيميل
        try {
            await sendVerificationCode(email, name, verificationCode);
        } catch (emailErr) {
            console.error('❌ Email send error (register):', emailErr.message);
            // نحذف اليوزر ونرجع خطأ واضح بدل ما نتجاهله
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({ message: 'فشل إرسال إيميل التحقق، تحقق من إعدادات الإيميل في السيرفر' });
        }

        res.status(201).json({
            message: 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني وأدخل الكود لتفعيل حسابك.',
            requiresVerification: true,
            userId: user._id
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Verify email code
router.post('/verify-email', async (req, res) => {
    try {
        const { userId, code } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
        if (user.isVerified) return res.status(400).json({ message: 'الحساب مفعّل بالفعل' });

        // التحقق من الكود وصلاحيته
        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'الكود غير صحيح، تحقق وحاول مجدداً' });
        }
        if (new Date() > user.verificationCodeExpiry) {
            return res.status(400).json({ message: 'انتهت صلاحية الكود، اطلب كوداً جديداً' });
        }

        // تفعيل الحساب
        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpiry = null;
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'تم تفعيل حسابك بنجاح! مرحباً بك 🎉',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                university: user.university,
                major: user.major,
                skills: user.skills,
                points: user.points
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
        if (user.isVerified) return res.status(400).json({ message: 'الحساب مفعّل بالفعل' });

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendVerificationCode(user.email, user.name, verificationCode);

        res.json({ message: 'تم إرسال كود جديد على بريدك الإلكتروني' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }

        // التحقق إن الحساب مفعّل
        if (!user.isVerified) {
            return res.status(403).json({
                message: 'حسابك لم يتم تفعيله بعد. تحقق من بريدك الإلكتروني.',
                requiresVerification: true,
                userId: user._id
            });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                studentId: user.studentId,
                university: user.university,
                major: user.major,
                skills: user.skills,
                points: user.points
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });
        // Always include `id` field alongside `_id` for frontend compatibility
        const userObj = user.toObject();
        userObj.id = userObj._id.toString();
        res.json(userObj);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Verify Reset Code - التحقق من كود إعادة التعيين فقط (بدون تغيير الكلمة بعد)
router.post('/verify-reset-code', async (req, res) => {
    try {
        const { userId, code } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        // إذا ما في كود مخزّن أصلاً (مستخدم قديم أو انتهت الجلسة)
        if (!user.resetPasswordCode || !user.resetPasswordCodeExpiry) {
            return res.status(400).json({ message: 'لا يوجد كود نشط، اطلب كوداً جديداً' });
        }

        if (user.resetPasswordCode !== code) {
            return res.status(400).json({ message: 'الكود غير صحيح، تحقق وحاول مجدداً' });
        }
        if (new Date() > user.resetPasswordCodeExpiry) {
            return res.status(400).json({ message: 'انتهت صلاحية الكود، اطلب كوداً جديداً' });
        }

        res.json({ message: 'الكود صحيح' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Resend Reset Code - إعادة إرسال كود إعادة التعيين
router.post('/resend-reset-code', async (req, res) => {
    try {
        const { userId, email } = req.body;

        // نقبل إما userId أو email
        const user = userId
            ? await User.findById(userId)
            : await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordCode = resetCode;
        user.resetPasswordCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendPasswordResetCode(user.email, user.name, resetCode);

        res.json({ message: 'تم إرسال كود جديد على بريدك الإلكتروني', userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Forgot Password - إرسال كود إعادة التعيين
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'هذا البريد الإلكتروني غير مسجل في المنصة' });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordCode = resetCode;
        user.resetPasswordCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 دقائق
        await user.save();

        try {
            await sendPasswordResetCode(user.email, user.name, resetCode);
        } catch (emailErr) {
            console.error('❌ Email send error (reset):', emailErr.message);
            return res.status(500).json({ message: 'فشل إرسال إيميل إعادة التعيين، تحقق من إعدادات الإيميل في السيرفر' });
        }

        res.json({
            message: 'تم إرسال كود إعادة تعيين كلمة المرور على بريدك الإلكتروني',
            userId: user._id
        });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Reset Password - التحقق من الكود وتغيير الكلمة
router.post('/reset-password', async (req, res) => {
    try {
        const { userId, code, newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'المستخدم غير موجود' });

        if (!user.resetPasswordCode || !user.resetPasswordCodeExpiry) {
            return res.status(400).json({ message: 'لا يوجد كود نشط، اطلب كوداً جديداً' });
        }

        if (user.resetPasswordCode !== code) {
            return res.status(400).json({ message: 'الكود غير صحيح، تحقق وحاول مجدداً' });
        }
        if (new Date() > user.resetPasswordCodeExpiry) {
            return res.status(400).json({ message: 'انتهت صلاحية الكود، اطلب كوداً جديداً' });
        }

        user.password = newPassword;
        user.resetPasswordCode = null;
        user.resetPasswordCodeExpiry = null;
        await user.save();

        res.json({ message: 'تم تغيير كلمة المرور بنجاح! يمكنك تسجيل الدخول الآن 🎉' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

module.exports = router;