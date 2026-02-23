const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    deadline: {
        type: Date
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'completed', 'cancelled'],
        default: 'open'
    },
    offers: [{
        helper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: String,
        proposedReward: Number,
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    acceptedHelper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'easy'
    },
    reward: {
        type: Number,
        default: 10
    },
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRoom'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HelpRequest', helpRequestSchema);