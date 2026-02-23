const express = require('express');
const router = express.Router();
const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');
const { ChatRoom } = require('../models/Message');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/Auth');

// Create help request
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, category, deadline, difficulty } = req.body;

        // حساب المكافأة تلقائياً حسب مستوى الصعوبة
        const rewardMap = { easy: 10, medium: 15, hard: 20 };
        const reward = rewardMap[difficulty] || 10;

        const helpRequest = new HelpRequest({
            requester: req.userId,
            title,
            description,
            category,
            deadline,
            difficulty: difficulty || 'easy',
            reward
        });

        await helpRequest.save();

        res.status(201).json({ message: 'تم إنشاء طلب المساعدة بنجاح', helpRequest });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Get all open help requests
router.get('/', authMiddleware, async (req, res) => {
    try {
        const helpRequests = await HelpRequest.find({ status: 'open' })
            .populate('requester', 'name university major')
            .sort({ createdAt: -1 });

        res.json(helpRequests);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Get user's help requests
router.get('/my-requests', authMiddleware, async (req, res) => {
    try {
        const helpRequests = await HelpRequest.find({ requester: req.userId })
            .populate('offers.helper', 'name university major skills')
            .populate('acceptedHelper', 'name university major')
            .sort({ createdAt: -1 });

        res.json(helpRequests);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Submit offer to help
router.post('/:id/offers', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        const helpRequest = await HelpRequest.findById(req.params.id);

        if (!helpRequest) {
            return res.status(404).json({ message: 'طلب المساعدة غير موجود' });
        }

        if (helpRequest.status !== 'open') {
            return res.status(400).json({ message: 'هذا الطلب لم يعد مفتوحاً' });
        }

        // Prevent requester from submitting an offer to their own request
        if (helpRequest.requester.toString() === req.userId) {
            return res.status(400).json({ message: 'لا يمكنك تقديم عرض على طلبك الخاص' });
        }

        helpRequest.offers.push({
            helper: req.userId,
            message,
            proposedReward: helpRequest.reward  // المكافأة محددة من مستوى الصعوبة
        });

        await helpRequest.save();

        // Create notification for requester
        const notification = new Notification({
            user: helpRequest.requester,
            type: 'offer',
            title: 'عرض مساعدة جديد',
            message: `قدم أحد الطلاب عرضاً للمساعدة في: ${helpRequest.title}`,
            link: `/help-requests/${helpRequest._id}`,
            relatedId: helpRequest._id
        });
        await notification.save();

        res.json({ message: 'تم تقديم العرض بنجاح', helpRequest });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Accept offer
router.post('/:requestId/offers/:offerId/accept', authMiddleware, async (req, res) => {
    try {
        const helpRequest = await HelpRequest.findById(req.params.requestId);

        if (!helpRequest) {
            return res.status(404).json({ message: 'طلب المساعدة غير موجود' });
        }

        if (helpRequest.requester.toString() !== req.userId) {
            return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' });
        }

        const offer = helpRequest.offers.id(req.params.offerId);
        if (!offer) {
            return res.status(404).json({ message: 'العرض غير موجود' });
        }

        offer.status = 'accepted';
        helpRequest.acceptedHelper = offer.helper;
        helpRequest.status = 'in-progress';
        // المكافأة محددة مسبقاً حسب مستوى الصعوبة عند إنشاء الطلب

        // Create chat room
        const chatRoom = new ChatRoom({
            participants: [helpRequest.requester, offer.helper],
            helpRequest: helpRequest._id
        });
        await chatRoom.save();

        helpRequest.chatRoom = chatRoom._id;
        await helpRequest.save();

        // Create notification for helper
        const notification = new Notification({
            user: offer.helper,
            type: 'offer',
            title: 'تم قبول عرضك',
            message: `تم قبول عرضك للمساعدة في: ${helpRequest.title}`,
            link: `/messages/${chatRoom._id}`,
            relatedId: chatRoom._id
        });
        await notification.save();

        res.json({ message: 'تم قبول العرض وإنشاء محادثة', chatRoomId: chatRoom._id });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Update a help request (only requester, must be open)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { title, description, category, deadline } = req.body;
        const helpRequest = await HelpRequest.findById(req.params.id);

        if (!helpRequest) return res.status(404).json({ message: 'طلب المساعدة غير موجود' });
        if (helpRequest.requester.toString() !== req.userId) return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' });
        if (helpRequest.status !== 'open') return res.status(400).json({ message: 'لا يمكن تعديل هذا الطلب في حالته الحالية' });

        if (title) helpRequest.title = title;
        if (description) helpRequest.description = description;
        if (category) helpRequest.category = category;
        if (deadline) helpRequest.deadline = deadline;

        await helpRequest.save();

        res.json({ message: 'تم تحديث الطلب بنجاح', helpRequest });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Delete a help request (only requester, only if open or not in-progress)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const helpRequest = await HelpRequest.findById(req.params.id);

        if (!helpRequest) return res.status(404).json({ message: 'طلب المساعدة غير موجود' });
        if (helpRequest.requester.toString() !== req.userId) return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' });
        if (helpRequest.status === 'in-progress') return res.status(400).json({ message: 'لا يمكن حذف طلب قيد التنفيذ' });

        await HelpRequest.findByIdAndDelete(helpRequest._id);

        res.json({ message: 'تم حذف طلب المساعدة بنجاح' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Complete help request and award points
router.post('/:id/complete', authMiddleware, async (req, res) => {
    try {
        const helpRequest = await HelpRequest.findById(req.params.id);

        if (!helpRequest) {
            return res.status(404).json({ message: 'طلب المساعدة غير موجود' });
        }

        if (helpRequest.requester.toString() !== req.userId) {
            return res.status(403).json({ message: 'غير مصرح لك بهذا الإجراء' });
        }

        helpRequest.status = 'completed';
        await helpRequest.save();

        // Award points to helper
        const helper = await User.findById(helpRequest.acceptedHelper);
        helper.points += helpRequest.reward;
        await helper.save();

        // Create notification for helper
        const notification = new Notification({
            user: helpRequest.acceptedHelper,
            type: 'general',
            title: 'تم إكمال طلب المساعدة',
            message: `تم منحك ${helpRequest.reward} نقطة لمساعدتك في: ${helpRequest.title}`,
            relatedId: helpRequest._id
        });
        await notification.save();

        res.json({ message: 'تم إكمال طلب المساعدة ومنح النقاط', helpRequest });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

module.exports = router;