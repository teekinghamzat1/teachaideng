const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['MCQ', 'TrueFalse', 'ShortAnswer'],
        required: true,
    },
    question: { type: String, required: true },
    options: [String], // For MCQ
    correctAnswer: { type: String, required: true },
});

const assessmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    topic: { type: String, required: true },
    classLevel: { type: String, required: true },
    subject: { type: String, required: true },
    questions: [questionSchema],
    status: {
        type: String,
        enum: ['Approved', 'Flagged', 'Pending'],
        default: 'Approved',
    },
}, {
    timestamps: true,
});

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
