const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./src/middlewares/errorHandler');

dotenv.config();

const app = express();

// Trust proxy for Nginx
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:3000',
        'https://teachaide.ai',
        'https://www.teachaide.ai',
        'http://teachaide.ai',
        'http://www.teachaide.ai',
        'https://teachaide.ng',
        'https://www.teachaide.ng',
        'http://teachaide.ng',
        'http://www.teachaide.ng',
        'https://teachaide-ai.vercel.app'
    ];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const normalizedOrigin = origin.toLowerCase();
        const isAllowed = allowedOrigins.some(o => o.toLowerCase() === normalizedOrigin) ||
            normalizedOrigin.endsWith('.vercel.app') ||
            normalizedOrigin.endsWith('.teachaide.ng') ||
            normalizedOrigin.endsWith('.teachaide.ai');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.error(`[CORS_REJECTED] Origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));

// Routes (Placeholders for now)
app.get('/sitemap.xml', (req, res) => {
    res.redirect('/api/sitemap.xml');
});

// Health check to verify API routing without DB
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        version: '1.2.0-comprehensive-lesson-fix',
        deployedAt: new Date().toISOString(), // This will update every time the server restarts
        buildTimestamp: new Date().toISOString(), // Static marker of THIS code version
        env: {
            nodeEnv: process.env.NODE_ENV,
            hasDbUrl: !!process.env.DATABASE_URL,
            isVercel: !!process.env.VERCEL
        }
    });
});

const { apiLimiter, strictLimiter } = require('./src/middlewares/rateLimiter');

// Rate Limiting
app.use(apiLimiter);

app.use('/api/auth', strictLimiter, require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/school-admin', require('./src/routes/schoolAdminRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/notes', require('./src/routes/lessonNoteRoutes'));
app.use('/api/assessments', require('./src/routes/assessmentRoutes'));
app.use('/api/students', require('./src/routes/studentRoutes'));
app.use('/api/timetable', require('./src/routes/timetableRoutes'));
app.use('/api/settings', require('./src/routes/settingsRoutes'));
app.use('/api/curriculum', require('./src/routes/curriculumRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/payment', require('./src/routes/paymentRoutes'));
app.use('/api/school', require('./src/routes/schoolRoutes'));
app.use('/api/cache', require('./src/routes/cacheRoutes'));
app.use('/api/generate', strictLimiter, require('./src/routes/generationRoutes'));
app.use('/api/tokens', require('./src/routes/tokensRoutes'));
app.use('/api/testimonials', require('./src/routes/testimonialRoutes'));
app.use('/api/branding', require('./src/routes/branding'));
app.use('/api/usage', require('./src/routes/usage'));
app.use('/api/blog', require('./src/routes/blogRoutes'));
app.use('/api/sitemap.xml', require('./src/routes/sitemapRoutes'));
app.use('/api/support', require('./src/routes/supportRoutes'));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;


const { seedDefaultCurriculum } = require('./src/controllers/curriculumController');

// For local development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, async () => {
        try {
            await seedDefaultCurriculum(); // Ensure defaults exist
        } catch (seedError) {
            console.error('Seeding failed:', seedError.message);
        }

        console.log(`Server running on port ${PORT}`);
    }).timeout = 300000;
}

// Export for Vercel serverless functions
module.exports = app;
