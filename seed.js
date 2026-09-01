require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Fee = require('./models/Fee');
const Schedule = require('./models/Schedule');
const AcademicRecord = require('./models/AcademicRecord');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student_erp');
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Fee.deleteMany({}),
    Schedule.deleteMany({}),
    AcademicRecord.deleteMany({})
  ]);

  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedFaculty = await bcrypt.hash('faculty123', 10);
  const hashedStudent = await bcrypt.hash('student123', 10);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@erp.edu',
    password: hashedAdmin,
    role: 'admin',
    department: 'Administration'
  });

  const faculty1 = await User.create({
    name: 'Dr. Sarah Johnson',
    email: 'faculty@erp.edu',
    password: hashedFaculty,
    role: 'faculty',
    department: 'Computer Science'
  });

  const faculty2 = await User.create({
    name: 'Prof. Michael Chen',
    email: 'mchen@erp.edu',
    password: hashedFaculty,
    role: 'faculty',
    department: 'Mathematics'
  });

  const student1 = await User.create({
    name: 'Alex Kumar',
    email: 'student@erp.edu',
    password: hashedStudent,
    role: 'student',
    studentId: 'STU2024001',
    department: 'Computer Science'
  });

  const student2 = await User.create({
    name: 'Priya Sharma',
    email: 'priya@erp.edu',
    password: hashedStudent,
    role: 'student',
    studentId: 'STU2024002',
    department: 'Computer Science'
  });

  await Fee.create([
    { student: student1._id, semester: 'Semester 1', amount: 45000, dueDate: new Date('2025-01-15'), status: 'paid', paidAt: new Date('2025-01-10'), transactionId: 'TXN20250110001', paymentMethod: 'upi' },
    { student: student1._id, semester: 'Semester 2', amount: 45000, dueDate: new Date('2025-07-15'), status: 'paid', paidAt: new Date('2025-07-01'), transactionId: 'TXN20250701001', paymentMethod: 'card' },
    { student: student1._id, semester: 'Semester 3', amount: 50000, dueDate: new Date('2026-01-15'), status: 'pending' },
    { student: student2._id, semester: 'Semester 1', amount: 45000, dueDate: new Date('2025-01-15'), status: 'paid', paidAt: new Date('2025-01-12'), transactionId: 'TXN20250112001', paymentMethod: 'netbanking' },
    { student: student2._id, semester: 'Semester 2', amount: 45000, dueDate: new Date('2025-07-15'), status: 'pending' }
  ]);

  await Schedule.create([
    { student: student1._id, faculty: faculty1._id, subject: 'Data Structures', date: new Date('2026-08-20'), startTime: '10:00', endTime: '11:00', status: 'confirmed', notes: 'Need help with binary trees' },
    { student: student1._id, faculty: faculty2._id, subject: 'Linear Algebra', date: new Date('2026-08-22'), startTime: '14:00', endTime: '15:00', status: 'pending', notes: 'Matrix operations revision' },
    { student: student2._id, faculty: faculty1._id, subject: 'Algorithms', date: new Date('2026-08-18'), startTime: '11:00', endTime: '12:00', status: 'completed', notes: 'Sorting algorithms discussion' }
  ]);

  await AcademicRecord.create([
    {
      student: student1._id,
      semester: 'Semester 1',
      subjects: [
        { name: 'Programming Fundamentals', code: 'CS101', credits: 4, grade: 'A', marks: 88, maxMarks: 100 },
        { name: 'Mathematics I', code: 'MA101', credits: 3, grade: 'B+', marks: 78, maxMarks: 100 },
        { name: 'Physics', code: 'PH101', credits: 3, grade: 'A', marks: 85, maxMarks: 100 }
      ],
      gpa: 8.57,
      totalCredits: 10,
      status: 'completed'
    },
    {
      student: student1._id,
      semester: 'Semester 2',
      subjects: [
        { name: 'Data Structures', code: 'CS201', credits: 4, grade: 'A+', marks: 92, maxMarks: 100 },
        { name: 'Database Systems', code: 'CS202', credits: 3, grade: 'A', marks: 87, maxMarks: 100 },
        { name: 'Discrete Mathematics', code: 'MA201', credits: 3, grade: 'B+', marks: 76, maxMarks: 100 }
      ],
      gpa: 8.86,
      totalCredits: 10,
      status: 'completed'
    },
    {
      student: student2._id,
      semester: 'Semester 1',
      subjects: [
        { name: 'Programming Fundamentals', code: 'CS101', credits: 4, grade: 'B+', marks: 79, maxMarks: 100 },
        { name: 'Mathematics I', code: 'MA101', credits: 3, grade: 'A', marks: 86, maxMarks: 100 },
        { name: 'Physics', code: 'PH101', credits: 3, grade: 'B', marks: 72, maxMarks: 100 }
      ],
      gpa: 7.86,
      totalCredits: 10,
      status: 'completed'
    }
  ]);

  console.log('\nSeed data created successfully!\n');
  console.log('Demo Accounts:');
  console.log('  Admin:   admin@erp.edu / admin123');
  console.log('  Faculty: faculty@erp.edu / faculty123');
  console.log('  Student: student@erp.edu / student123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
