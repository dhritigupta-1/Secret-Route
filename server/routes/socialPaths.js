const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');
const Collection = require('../models/Collection');
const Route = require('../models/Route');

// --- FOLLOWING SYSTEM ---

// Follow/Unfollow User
router.post('/follow/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.id === req.params.id) return res.status(400).json({ message: "You cannot follow yourself" });
        
        const existingFollow = await Follow.findOne({ follower: req.user.id, following: req.params.id });
        if (existingFollow) {
            await Follow.deleteOne({ _id: existingFollow._id });
            return res.json({ message: "Unfollowed successfully", isFollowing: false });
        }

        const newFollow = new Follow({ follower: req.user.id, following: req.params.id });
        await newFollow.save();

        // Create Notification
        const notification = new Notification({
            recipient: req.params.id,
            sender: req.user.id,
            type: 'follow',
            message: "started following you"
        });
        await notification.save();

        res.json({ message: "Followed successfully", isFollowing: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Check if following
router.get('/is-following/:id', verifyToken, async (req, res) => {
    try {
        const follow = await Follow.findOne({ follower: req.user.id, following: req.params.id });
        res.json({ isFollowing: !!follow });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get personalized discovery feed (spots from followed users)
router.get('/feed', verifyToken, async (req, res) => {
    try {
        const following = await Follow.find({ follower: req.user.id }).select('following');
        const followingIds = following.map(f => f.following);
        
        const spots = await Route.find({ createdBy: { $in: followingIds } })
            .sort({ createdAt: -1 })
            .limit(20);
            
        res.json(spots);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- NOTIFICATIONS ---

// Get User Notifications
router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .populate('sender', 'name email')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Mark constant as read
router.patch('/notifications/read', verifyToken, async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user.id, read: false }, { read: true });
        res.json({ message: "Notifications marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- COLLECTIONS ---

// Create Collection
router.post('/collections', verifyToken, async (req, res) => {
    try {
        const newCollection = new Collection({
            ...req.body,
            createdBy: req.user.id
        });
        await newCollection.save();
        res.status(201).json(newCollection);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get User Collections
router.get('/collections/mine', verifyToken, async (req, res) => {
    try {
        const collections = await Collection.find({ createdBy: req.user.id }).populate('routes');
        res.json(collections);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add spot to collection
router.patch('/collections/:id/add', verifyToken, async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);
        if (!collection) return res.status(404).json({ message: "Collection not found" });
        if (collection.createdBy.toString() !== req.user.id.toString()) return res.status(403).json({ message: "Not authorized" });
        
        if (!collection.routes.includes(req.body.routeId)) {
            collection.routes.push(req.body.routeId);
            await collection.save();
        }
        res.json(collection);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
