const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.post('/recommend', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ message: "Prompt is required" });

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: "Server is missing GEMINI_API_KEY configuration." });
        }

        // Fetch all routes to give as context to AI
        const allRoutes = await Route.find({}).select('_id title description category ratingScore');
        
        if (allRoutes.length === 0) {
            return res.json({ 
                text: "I don't see any locations in the database yet! Try adding some spots first. 📍", 
                spots: [] 
            });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        const systemInstruction = `You are the "Secret Path Concierge," a friendly and expert global travel guide. 
        Your goal is to help users explore locations and have a delightful conversation.
        
        DATA (User's Local Database):
        ${JSON.stringify(allRoutes)}
        
        INSTRUCTIONS:
        1. LOCAL: If the user asks for recommendations that match the local DATA, return their _id values in the "recommendedIds" array.
        2. GLOBAL (REQUIRED!): You MUST ALWAYS generate 1 to 3 amazing, real-world locations from ANYWHERE IN THE WORLD that perfectly match the user's vibe! Add these to the "generatedSpots" array as objects with { "title": "...", "description": "...", "category": "Urban", "lat": 12.3456, "lng": -78.9012 }. Make sure the lat/lng coordinates are highly accurate for the real-world place.
        3. ITINERARY: If the user asks to plan a trip, tour, or multi-stop itinerary, set the JSON field "isItinerary" to true and ensure your spots are ordered chronologically.
        4. Respond warmly to general chat, and explain why you recommended these specific global and local spots.
        5. You MUST ALWAYS return a JSON object exactly like this:
           {
             "text": "A conversational string explaining your choices.",
             "recommendedIds": ["id1", "id2"],
             "generatedSpots": [{"title": "...", "description": "...", "category": "Nature", "lat": 1.1, "lng": 2.2}],
             "isItinerary": false
           }
        
        Output ONLY the JSON object. Do not wrap in markdown.`;

        let result;
        const modelNames = [
            "gemini-2.5-flash", 
            "gemini-2.0-flash", 
            "gemini-1.5-flash", 
            "gemini-pro"
        ];
        let lastError;

        for (const modelName of modelNames) {
            try {
                console.log(`Attempting AI generation with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(`System Guide: ${systemInstruction}\nUser Message: "${prompt}"`);
                if (result) break;
            } catch (err) {
                console.error(`Model ${modelName} failed:`, err.message);
                lastError = err;
                continue;
            }
        }

        if (!result) throw lastError;

        const responseText = result.response.text();
        
        // Robust JSON extraction
        let aiResult = { text: "I had trouble processing that, but let me try again!", recommendedIds: [] };
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                aiResult = JSON.parse(jsonMatch[0]);
            } else {
                aiResult.text = responseText;
            }
        } catch (e) {
            console.error("AI Parse Error. Raw:", responseText);
        }
        
        // Fetch full spot objects if any were recommended
        let combinedSpots = [];
        if (aiResult.recommendedIds && Array.isArray(aiResult.recommendedIds)) {
            const validIds = aiResult.recommendedIds.filter(id => id && id.length > 20);
            const matchedSpots = await Route.find({ _id: { $in: validIds.slice(0, 4) } });
            combinedSpots = [...combinedSpots, ...matchedSpots];
        }

        if (aiResult.generatedSpots && Array.isArray(aiResult.generatedSpots)) {
            const genSpots = aiResult.generatedSpots.slice(0, 4).map(spot => ({
                ...spot,
                _id: 'gen_' + Math.random().toString(36).substr(2, 9),
                isGenerated: true
            }));
            combinedSpots = [...combinedSpots, ...genSpots];
        }
        
        res.json({
            text: aiResult.text || "I found some spots you might enjoy!",
            spots: combinedSpots,
            isItinerary: aiResult.isItinerary || false
        });

    } catch (error) {
        console.error("AI Recommendation Error:", error);
        res.status(500).json({ message: error.message || "Internal AI Error" });
    }
});

router.post('/describe', async (req, res) => {
    try {
        const { title, category, lat, lng } = req.body;
        if (!title || !category) return res.status(400).json({ message: "Title and Category required" });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        let result;
        const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
        let lastError;

        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(`Act as an expert travel copywriter. 
                Write a single, captivating 2-sentence description for a hidden spot called "${title}".
                It is a "${category}" location at coordinates: lat ${lat}, lng ${lng}.
                Make it sound appealing, slightly mysterious, and engaging. Do not use Markdown formatting.`);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) throw lastError;
        res.json({ description: result.response.text().trim() });
    } catch (error) {
        console.error("AI Describe Error:", error);
        res.status(500).json({ message: "Internal AI Error" });
    }
});

router.post('/translate', async (req, res) => {
    try {
        const { text, targetLanguage = 'English' } = req.body;
        if (!text) return res.status(400).json({ message: "Text to translate is required" });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        let result;
        const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
        let lastError;

        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(`Translate the following text into ${targetLanguage}. Maintain the original tone and enthusiasm. Output ONLY the translated text.
                
                Text to translate:
                "${text}"`);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) throw lastError;
        res.json({ translatedText: result.response.text().trim() });
    } catch (error) {
        console.error("AI Translate Error:", error);
        res.status(500).json({ message: "Internal AI Error" });
    }
});

router.post('/personalize', async (req, res) => {
    try {
        const { favorites } = req.body;
        if (!favorites || !Array.isArray(favorites) || favorites.length === 0) {
            return res.json({ spots: [] });
        }

        const favoriteSpots = await Route.find({ _id: { $in: favorites } }).select('title category');
        const allRoutes = await Route.find({ _id: { $nin: favorites } }).select('_id title description category');

        if (allRoutes.length === 0) return res.json({ spots: [] });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        let result;
        const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
        let lastError;

        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(`You are an expert travel recommendation engine.
                The user has favorited the following spots: ${JSON.stringify(favoriteSpots)}.
                Based on these preferences, select up to 3 best matching spots from the available database: ${JSON.stringify(allRoutes)}.
                Return ONLY a JSON array of the recommended _id strings. Do not wrap in markdown or include any other text.`);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) throw lastError;
        let responseText = result.response.text();
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        let recommendedIds = [];
        if (jsonMatch) {
            recommendedIds = JSON.parse(jsonMatch[0]);
        }

        const recommendedSpots = await Route.find({ _id: { $in: recommendedIds } });
        res.json({ spots: recommendedSpots });

    } catch (error) {
        console.error("AI Personalize Error:", error);
        res.status(500).json({ message: "Internal AI Error" });
    }
});

module.exports = router;
