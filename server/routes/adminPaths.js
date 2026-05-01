const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Route = require('../models/Route');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/authMiddleware');

// ADMIN LOGIN
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || user.role !== 'admin') {
            return res.status(401).json("Unauthorized: Admin access only.");
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json("Wrong password");

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.status(200).json({ token, user: { id: user._id, name: user.name, role: user.role, favorites: user.favorites || [] } });
    } catch (err) { 
        res.status(500).json({ message: err.message || "Admin Login failed" }); 
    }
});

// ADMIN METRICS
router.get('/metrics', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json("Forbidden: Admins only.");
        
        const totalUsers = await User.countDocuments();
        const totalSpots = await Route.countDocuments();
        const routes = await Route.find().select('category views');
        
        const categoryStats = { Urban: 0, Nature: 0, Food: 0, Historical: 0 };
        let totalViews = 0;
        
        routes.forEach(r => {
            if (categoryStats[r.category] !== undefined) categoryStats[r.category]++;
            totalViews += (r.views || 0);
        });

        res.json({
            totalUsers,
            totalSpots,
            totalViews,
            categoryStats
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET ALL USERS FOR MANAGEMENT
router.get('/users', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json("Forbidden: Admins only.");
        const users = await User.find({ role: 'user' }).select('name email points isBlocked createdAt').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// TOGGLE BLOCK USER
router.patch('/users/:id/block', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json("Forbidden: Admins only.");
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json("User not found");
        
        user.isBlocked = !user.isBlocked;
        await user.save();
        
        res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, isBlocked: user.isBlocked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
