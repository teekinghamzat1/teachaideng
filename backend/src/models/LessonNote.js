const mongoose = require('mongoose');

const presentationStepSchema = new mongoose.Schema({
    step: String,
    teacherActivity: String,
    pupilActivity: String,
});

const lessonNoteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    topic: { type: String, required: true },
    subtopic: { type: String, required: true },
    classLevel: { type: String, required: true },
    subject: { type: String, required: true },
    duration: { type: String, required: true },
    date: { type: Date },
    references: [String],
    objectives: [String],
    instructionalMaterials: [String],
    previousKnowledge: String,
    introduction: String,
    lessonContent: String,
    presentation: [presentationStepSchema],
    evaluation: [String],
    assignment: String,
    conclusion: String,
    status: {
        type: String,
        enum: ['Approved', 'Flagged', 'Pending'],
        default: 'Approved',
    },
}, {
    timestamps: true,
});

const LessonNote = mongoose.model('LessonNote', lessonNoteSchema);

module.exports = LessonNote;
