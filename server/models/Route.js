const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "No description provided." }, // Changed from required: true
    category: { type: String, enum: ['Nature', 'Urban', 'Food', 'Historical'], default: 'Urban' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    image: { type: String },
    views: { type: Number, default: 0 },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String },
        text: { type: String, required: true },
        parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route.comments', default: null },
        createdAt: { type: Date, default: Date.now }
    }],
    ratings: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, required: true, min: 1, max: 5 }
    }],
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    creatorName: { type: String } 
});

RouteSchema.index({ location: '2dsphere' });

RouteSchema.virtual('ratingScore').get(function() {
    if (!this.ratings || this.ratings.length === 0) return 0;
    const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / this.ratings.length).toFixed(1));
});

RouteSchema.set('toJSON', { virtuals: true });
RouteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Route', RouteSchema);