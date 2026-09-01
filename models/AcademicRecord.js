const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, required: true },
  subjects: [{
    name: { type: String, required: true },
    code: { type: String, required: true },
    credits: { type: Number, default: 3 },
    grade: { type: String, enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', ''], default: '' },
    marks: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 100 }
  }],
  gpa: { type: Number, default: 0 },
  totalCredits: { type: Number, default: 0 },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);
