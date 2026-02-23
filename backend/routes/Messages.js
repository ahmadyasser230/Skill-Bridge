const express = require('express');
const router = express.Router();
const { ChatRoom } = require('../models/Message');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/Auth');

// Get user's chat rooms
router.get('/', authMiddleware, async (req, res) => {
    try {
        const chatRooms = await ChatRoom.find({
            participants: req.userId
        })
            .populate('participants', 'name university')
            .populate('helpRequest', 'title')
            .sort({ lastMessage: -1 });

        res.json(chatRooms);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Get single chat room with messages
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const chatRoom = await ChatRoom.findById(req.params.id)
            .populate('participants', 'name university')
            .populate('helpRequest', 'title description')
            .populate('messages.sender', 'name');

        if (!chatRoom) {
            return res.status(404).json({ message: 'غرفة المحادثة غير موجودة' });
        }

        // Check if user is participant
        if (!chatRoom.participants.some(p => p._id.toString() === req.userId)) {
            return res.status(403).json({ message: 'غير مصرح لك بالوصول لهذه المحادثة' });
        }

        // Mark messages as read
        chatRoom.messages.forEach(msg => {
            const senderId = msg.sender._id ? msg.sender._id.toString() : msg.sender.toString();
            if (senderId !== req.userId) {
                msg.read = true;
            }
        });
        await chatRoom.save();

        res.json(chatRoom);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

// Send message
router.post('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || content.trim() === '') {
            return res.status(400).json({ message: 'المحتوى فارغ' });
        }

        const chatRoom = await ChatRoom.findById(req.params.id)
            .populate('participants', 'name');

        if (!chatRoom) {
            return res.status(404).json({ message: 'غرفة المحادثة غير موجودة' });
        }

        // Check if user is participant
        const isParticipant = chatRoom.participants.some(p => p._id.toString() === req.userId);
        if (!isParticipant) {
            return res.status(403).json({ message: 'غير مصرح لك بإرسال رسائل في هذه المحادثة' });
        }

        const message = {
            sender: req.userId,
            content,
            timestamp: new Date()
        };

        chatRoom.messages.push(message);
        chatRoom.lastMessage = new Date();
        await chatRoom.save();

        // Create notification for other participant (if exists)
        const otherParticipant = chatRoom.participants.find(
            p => p._id.toString() !== req.userId
        );

        const senderInfo = chatRoom.participants.find(p => p._id.toString() === req.userId) || { name: 'مستخدم' };

        if (otherParticipant) {
            const notification = new Notification({
                user: otherParticipant._id,
                type: 'message',
                title: 'رسالة جديدة',
                message: `لديك رسالة جديدة من ${senderInfo.name}`,
                link: `/messages/${chatRoom._id}`,
                relatedId: chatRoom._id
            });
            await notification.save();
        }

        res.json({ message: 'تم إرسال الرسالة بنجاح', chatMessage: message });
    } catch (error) {
        console.error('Error in POST /:id/messages', error);
        res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
    }
});

module.exports = router;