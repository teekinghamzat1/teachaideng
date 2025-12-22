const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./src/middlewares/errorHandler');

dotenv.config();

const app = express();

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
        'https://teachaide.ai'
    ];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(helmet());
app.use(morgan('dev'));

// Routes (Placeholders for now)
app.get('/', (req, res) => {
    res.send('API is running...');
});

const { apiLimiter, strictLimiter } = require('./src/middlewares/rateLimiter');

// Rate Limiting
app.use(apiLimiter);

app.use('/api/auth', strictLimiter, require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
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

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;


const { seedDefaultCurriculum } = require('./src/controllers/curriculumController');

app.listen(PORT, async () => {
    await seedDefaultCurriculum(); // Ensure defaults exist

    console.log(`Server running on port ${PORT}`);
});
