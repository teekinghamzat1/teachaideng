module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-me',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
};
