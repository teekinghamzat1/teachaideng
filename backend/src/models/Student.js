const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Teacher who added the student
        required: true,
    },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    subject: { type: String, required: true },
    notes: { type: String },
}, {
    timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
