require('dotenv').config();
const axios = require('axios');
const key = process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
const testModel = async (model) => {
  try {
    const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      contents: [{role: 'user', parts: [{text: 'Hello'}]}]
    });
    console.log(model, 'SUCCESS');
  } catch (err) {
    console.log(model, 'ERROR', err.response?.status, err.response?.data?.error?.message || err.message);
  }
};
(async () => {
  await testModel('gemini-2.5-pro');
  await testModel('gemini-2.5-flash');
  await testModel('gemini-1.5-pro');
  await testModel('gemini-1.5-flash');
})();
