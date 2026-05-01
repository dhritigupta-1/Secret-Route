const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');
const verifyToken = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.post('/add', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.isVerified) {
            return res.status(403).json({ message: "Account not verified. Please check your email to verify your account before adding spots." });
        }
    if (req.body.image) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const imageResponse = await fetch(req.body.image);
            if (imageResponse.ok) {
                const arrayBuffer = await imageResponse.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
                
                let result;
                const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
                for (const modelName of modelNames) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName });
                        result = await model.generateContent([
                            "Is this image safe for work and appropriate for a public travel community app? Reply exactly with YES or NO.",
                            { inlineData: { data: buffer.toString('base64'), mimeType } }
                        ]);
                        if (result) break;
                    } catch (e) {
                        continue;
                    }
                }
                
                if (result) {
                    const answer = result.response.text().trim().toUpperCase();
                    if (answer.includes("NO")) {
                        return res.status(400).json({ message: "Image upload rejected by AI moderation (NSFW or inappropriate)." });
                    }
                }
            }
        } catch (moderationError) {
            console.error("AI Moderation Error:", moderationError);
            // Non-blocking: If AI is down, we still allow the upload.
        }
    }

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    const newRoute = new Route({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng),
        location: {
            type: 'Point',
            coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
        },
        image: req.body.image,
        createdBy: req.user.id,
        creatorName: req.body.userName || 'Secret Explorer'
    });

    try {
        const savedRoute = await newRoute.save();
        await User.findByIdAndUpdate(req.user.id, { $inc: { points: 50 } }); // +50 points for creating a spot
        if (req.io) req.io.emit('new_spot', savedRoute); // Global WebSocket broadcast
        res.status(201).json(savedRoute);
    } catch (err) {
        // 2. Log the specific validation error
        console.error("Database Save Error:", err.message); 
        res.status(400).json({ message: err.message });
    }
});

// GET spots within 10km (Geospatial)
router.get('/nearby', async (req, res) => {
    try {
        const { lng, lat, distance = 10000 } = req.query; // defaults to 10km
        if (!lng || !lat) return res.status(400).json({ message: "Coordinates missing" });
        
        const routes = await Route.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(distance)
                }
            }
        });
        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Don't forget the GET route below it
router.get('/', async (req, res) => {
    try {
        const routes = await Route.find();
        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET user's routes
router.get('/mine', verifyToken, async (req, res) => {
    try {
        const routes = await Route.find({ createdBy: req.user.id });
        res.json(routes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE a route
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Route.findByIdAndDelete(req.params.id);
        res.json({ message: "Discovery deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// TOGGLE FAVORITE
router.post('/:id/favorite', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        
        const routeId = req.params.id;
        const route = await Route.findById(routeId);
        
        if (user.favorites.includes(routeId)) {
            user.favorites.pull(routeId);
            if (route) await User.findByIdAndUpdate(route.createdBy, { $inc: { points: -10 } }); // -10 points when un-favorited
        } else {
            user.favorites.push(routeId);
            if (route) await User.findByIdAndUpdate(route.createdBy, { $inc: { points: 10 } }); // +10 points to creator when favorited
        }
        await user.save();
        res.json(user.favorites);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADD COMMENT
router.post('/:id/comment', verifyToken, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ message: "Spot not found" });
        route.comments.push({
            user: req.user.id,
            userName: req.body.userName || "Unknown",
            text: req.body.text,
            parentId: req.body.parentId || null
        });
        await route.save();

        // Create notification for spot owner
        if (route.createdBy.toString() !== req.user.id.toString()) {
            const notification = new Notification({
                recipient: route.createdBy,
                sender: req.user.id,
                type: 'comment',
                routeId: route._id,
                message: `commented on your discovery: "${route.title}"`
            });
            await notification.save();
        }

        // Create notification for parent comment owner if this is a reply
        if (req.body.parentId) {
            const parentComment = route.comments.id(req.body.parentId);
            if (parentComment && parentComment.user.toString() !== req.user.id.toString()) {
                const replyNotif = new Notification({
                    recipient: parentComment.user,
                    sender: req.user.id,
                    type: 'comment',
                    routeId: route._id,
                    message: "replied to your comment"
                });
                await replyNotif.save();
            }
        }
        
        // Award points, but only if they are not commenting on their own post
        if (route.createdBy.toString() !== req.user.id.toString()) {
             await User.findByIdAndUpdate(req.user.id, { $inc: { points: 5 } }); // +5 points for engaging
        }

        if (req.io) req.io.emit('new_spot', route); // Trigger UX refetch
        res.json(route);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE COMMENT
router.delete('/:id/comment/:commentId', verifyToken, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ message: "Spot not found" });
        
        const comment = route.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });
        
        if (comment.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this comment" });
        }
        
        route.comments.pull(req.params.commentId);
        await route.save();
        if (req.io) req.io.emit('new_spot', route);
        res.json(route);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// UPDATE COMMENT
router.patch('/:id/comment/:commentId', verifyToken, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ message: "Spot not found" });
        
        const comment = route.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });
        
        if (comment.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "Not authorized to edit this comment" });
        }
        
        comment.text = req.body.text;
        await route.save();
        if (req.io) req.io.emit('new_spot', route);
        res.json(route);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// RATE SPOT
router.post('/:id/rate', verifyToken, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ message: "Spot not found" });
        
        const existingIndex = route.ratings.findIndex(r => r.user && r.user.toString() === req.user.id);
        if (existingIndex >= 0) {
            route.ratings[existingIndex].rating = req.body.rating;
        } else {
            route.ratings.push({ user: req.user.id, rating: req.body.rating });
        }
        await route.save();
        if (req.io) req.io.emit('new_spot', route);
        res.json(route);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUBLIC USER PROFILE API
router.get('/user/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        
        const followerCount = await Follow.countDocuments({ following: req.params.userId });
        const followingCount = await Follow.countDocuments({ follower: req.params.userId });
        
        const spots = await Route.find({ createdBy: req.params.userId }).sort({ createdAt: -1 });
        res.json({ 
            user: { ...user.toObject(), followerCount, followingCount }, 
            spots 
        });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// TRACK VIEWS
router.post('/:id/view', async (req, res) => {
    try {
        const route = await Route.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
        res.json({ views: route?.views || 0 });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;