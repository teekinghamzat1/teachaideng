const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

const getApiKey = () => {
    const key = process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!key) throw new Error('Google Gemini API key not configured in .env');
    return key;
};

async function listModels() {
    try {
        const apiKey = getApiKey();
        console.log('Using API Key (last 4):', apiKey.slice(-4));

        // Try both v1 and v1beta
        const versions = ['v1', 'v1beta'];

        for (const v of versions) {
            console.log(`\n--- Checking API Version: ${v} ---`);
            try {
                const res = await axios.get(`https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`);
                console.log(`Success! Total models found: ${res.data.models?.length || 0}`);

                const flashModels = res.data.models?.filter(m => m.name.toLowerCase().includes('flash'));
                console.log('Flash models available:');
                flashModels.forEach(m => {
                    console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
                });
            } catch (err) {
                console.error(`Error with ${v}:`, err.response?.data?.error?.message || err.message);
            }
        }
    } catch (error) {
        console.error('Script Error:', error.message);
    }
}

listModels();
