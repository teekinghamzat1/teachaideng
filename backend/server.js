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
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes (Placeholders for now)
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.use('/api/auth', require('./src/routes/authRoutes'));
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
app.use('/api/settings', require('./src/routes/settingsRoutes'));
app.use('/api/curriculum', require('./src/routes/curriculumRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/payment', require('./src/routes/paymentRoutes'));
app.use('/api/school', require('./src/routes/schoolRoutes'));
app.use('/api/cache', require('./src/routes/cacheRoutes'));
app.use('/api/generate', require('./src/routes/generationRoutes'));
app.use('/api/tokens', require('./src/routes/tokensRoutes'));
app.use('/api/testimonials', require('./src/routes/testimonialRoutes'));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;


const { seedDefaultCurriculum } = require('./src/controllers/curriculumController');
const { startMonthlyReset } = require('./src/cron/monthlyReset');

app.listen(PORT, async () => {
    await seedDefaultCurriculum(); // Ensure defaults exist
        try {
            startMonthlyReset();
        } catch (e) {
            console.warn('Monthly reset not started', e.message || e);
        }
    console.log(`Server running on port ${PORT}`);
});
