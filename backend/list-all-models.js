const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const getApiKey = () => {
    const key = process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!key) throw new Error('Google Gemini API key not configured in .env');
    return key;
};

async function listAllModels() {
    try {
        const apiKey = getApiKey();
        const v = 'v1beta';
        const res = await axios.get(`https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`);
        console.log(`\n--- ALL Models (${v}) ---`);
        res.data.models?.forEach(m => {
            console.log(`- ${m.name}`);
        });
    } catch (error) {
        console.error('Script Error:', error.response?.data?.error?.message || error.message);
    }
}

listAllModels();
