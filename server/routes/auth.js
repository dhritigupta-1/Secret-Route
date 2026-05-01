const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/authMiddleware');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            role: 'user',
            verificationToken
        });
        await newUser.save();

        const verifyUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
        await sendEmail({
            to: req.body.email,
            subject: "Verify Your Hidden Path Account",
            text: `Welcome! Please verify your account here: ${verifyUrl}`,
            html: `<h1>Welcome to Hidden Path!</h1><p>Please click the button below to verify your account and start discovering secret routes.</p><a href="${verifyUrl}" style="padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 8px;">Verify Account</a>`
        });

        res.status(201).json("User created! Please check your email to verify your account.");
    } catch (err) { 
        if (err.code === 11000) {
            return res.status(400).json({ message: "This email is already registered! Please login." });
        }
        res.status(500).json({ message: err.message || "Registration failed" }); 
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json("User not found");
        if (user.isBlocked) return res.status(403).json("This account has been suspended by an admin.");

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).json("Wrong password");

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = crypto.randomBytes(64).toString('hex');
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({ 
            token, 
            refreshToken,
            user: { id: user._id, name: user.name, role: user.role, favorites: user.favorites || [], isVerified: user.isVerified } 
        });
    } catch (err) { 
        res.status(500).json({ message: err.message || "Login failed" }); 
    }
});

// LEADERBOARD
router.get('/leaderboard', async (req, res) => {
    try {
        const topUsers = await User.find({ role: { $ne: 'admin' } }).sort({ points: -1 }).limit(10).select('name points badges role createdAt');
        res.json(topUsers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE PROFILE
router.patch('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user.id, { bio: req.body.bio }, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// VERIFY EMAIL
router.get('/verify-email/:token', async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });
        if (!user) return res.status(400).json("Invalid or expired verification token.");
        
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        res.json("Email verified successfully! You can now access all features.");
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json("No user found with that email.");

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        await sendEmail({
            to: user.email,
            subject: "Password Reset Request",
            text: `You requested a password reset. Click here: ${resetUrl}`,
            html: `<p>You requested a password reset. Click below to continue:</p><a href="${resetUrl}">Reset Password</a>`
        });

        res.json("Password reset link sent to your email.");
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// RESET PASSWORD
router.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({ 
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) return res.status(400).json("Invalid or expired reset token.");

        const hashedPw = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPw;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json("Password reset successfully! You can now log in.");
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// REFRESH TOKEN
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json("Refresh Token Required");

    try {
        const user = await User.findOne({ refreshToken });
        if (!user) return res.status(403).json("Invalid Refresh Token");

        const newToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({ token: newToken });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;