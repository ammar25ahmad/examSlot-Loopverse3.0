import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { TZ, intervalsOverlap, resolveInterval } from '../utils/time.js';
import { ACCOUNT_STATUS, EMAIL_STATUS, AUDIT_ACTION } from '../config/constants.js';
import Admin from '../models/Admin.js';
import Branch from '../models/Branch.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import CourseAssignment from '../models/CourseAssignment.js';
import ExamSlot from '../models/ExamSlot.js';
import DateSheet from '../models/DateSheet.js';
import ChangeRequest from '../models/ChangeRequest.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import { saveDateSheet } from '../services/dateSheetService.js';
import { generateToken, hashToken } from '../utils/tokens.js';

function futureDate(days) {
  return formatInTimeZone(addDays(new Date(), days), TZ, 'yyyy-MM-dd');
}

const BRANCHES = [
  {
    name: 'Karachi Main Campus',
    code: 'KHI',
    city: 'Karachi',
    address: '12 University Avenue, Gulshan-e-Iqbal, Karachi',
    contactNumber: '+92-21-111-222-333',
    seatCapacity: 80,
  },
  {
    name: 'Lahore Campus',
    code: 'LHR',
    city: 'Lahore',
    address: '45 Knowledge Road, Johar Town, Lahore',
    contactNumber: '+92-42-111-444-555',
    seatCapacity: 70,
  },
  {
    name: 'Islamabad Campus',
    code: 'ISB',
    city: 'Islamabad',
    address: '8 Education Street, H-9, Islamabad',
    contactNumber: '+92-51-111-666-777',
    seatCapacity: 60,
  },
];

const COURSES = [
  { code: 'CS101', title: 'Introduction to Computing', creditHours: 3, department: 'Computer Science' },
  { code: 'CS201', title: 'Data Structures & Algorithms', creditHours: 4, department: 'Computer Science' },
  { code: 'CS301', title: 'Database Systems', creditHours: 3, department: 'Computer Science' },
  { code: 'CS401', title: 'Operating Systems', creditHours: 3, department: 'Computer Science' },
  { code: 'MTH101', title: 'Calculus & Analytical Geometry', creditHours: 3, department: 'Mathematics' },
  { code: 'MTH202', title: 'Discrete Mathematics', creditHours: 3, department: 'Mathematics' },
  { code: 'ENG101', title: 'Functional English', creditHours: 2, department: 'Humanities' },
  { code: 'PHY101', title: 'Applied Physics', creditHours: 3, department: 'Physics' },
];

const STUDENTS = [
  {
    registrationNumber: 'VU-2024-0001',
    fullName: 'Ayesha Khan',
    email: 'ayesha.khan@example.com',
    phone: '+92-300-1111111',
    cnic: '42101-1111111-1',
    dateOfBirth: '2003-04-12',
    gender: 'female',
    address: 'House 5, Block B, Gulshan, Karachi',
    guardian: {
      name: 'Imran Khan',
      cnic: '42101-2222222-2',
      occupation: 'Engineer',
      contactNumber: '+92-301-2222222',
      emergencyContact: '+92-302-3333333',
    },
    program: 'BS Computer Science',
    semester: 4,
    session: 'Fall 2024',
    previousQualification: 'Intermediate (Pre-Engineering)',
    previousInstitute: 'Government College Karachi',
    marks: '82%',
    courseCodes: ['CS101', 'CS201', 'CS301', 'MTH101', 'ENG101'],
    branchCode: 'KHI',
    makeDateSheet: false,
  },
  {
    registrationNumber: 'VU-2024-0002',
    fullName: 'Bilal Ahmed',
    email: 'bilal.ahmed@example.com',
    phone: '+92-300-2222222',
    cnic: '35202-3333333-3',
    dateOfBirth: '2002-09-23',
    gender: 'male',
    address: 'Flat 9C, Model Town, Lahore',
    guardian: {
      name: 'Ahmed Raza',
      cnic: '35202-4444444-4',
      occupation: 'Businessman',
      contactNumber: '+92-303-4444444',
      emergencyContact: '+92-304-5555555',
    },
    program: 'BS Computer Science',
    semester: 6,
    session: 'Fall 2024',
    previousQualification: 'Intermediate (ICS)',
    previousInstitute: 'Punjab College Lahore',
    marks: '76%',
    courseCodes: ['CS201', 'CS301', 'CS401', 'MTH202', 'PHY101', 'ENG101'],
    branchCode: 'LHR',
    makeDateSheet: true,
  },
  {
    registrationNumber: 'VU-2024-0003',
    fullName: 'Sana Malik',
    email: 'sana.malik@example.com',
    phone: '+92-300-3333333',
    cnic: '61101-5555555-5',
    dateOfBirth: '2004-01-05',
    gender: 'female',
    address: 'House 22, F-11, Islamabad',
    guardian: {
      name: 'Tariq Malik',
      cnic: '61101-6666666-6',
      occupation: 'Doctor',
      contactNumber: '+92-305-6666666',
      emergencyContact: '+92-306-7777777',
    },
    program: 'BS Software Engineering',
    semester: 2,
    session: 'Spring 2025',
    previousQualification: 'Intermediate (Pre-Medical)',
    previousInstitute: 'Islamabad Model College',
    marks: '88%',
    courseCodes: ['CS101', 'MTH101', 'ENG101', 'PHY101'],
    branchCode: null,
    makeDateSheet: false,
  },
  {
    registrationNumber: 'VU-2024-0004',
    fullName: 'Hamza Siddiqui',
    email: 'hamza.siddiqui@example.com',
    phone: '+92-300-4444444',
    cnic: '42101-7777777-7',
    dateOfBirth: '2003-07-19',
    gender: 'male',
    address: 'House 3, DHA Phase 6, Karachi',
    guardian: {
      name: 'Siddiq Siddiqui',
      cnic: '42101-8888888-8',
      occupation: 'Accountant',
      contactNumber: '+92-307-8888888',
      emergencyContact: '+92-308-9999999',
    },
    program: 'BS Computer Science',
    semester: 4,
    session: 'Fall 2024',
    previousQualification: 'Intermediate (Pre-Engineering)',
    previousInstitute: 'Nixor College Karachi',
    marks: '79%',
    courseCodes: ['CS101', 'CS301', 'MTH101', 'MTH202', 'ENG101'],
    branchCode: null,
    pendingSetup: true,
    makeDateSheet: false,
  },
  {
    registrationNumber: 'VU-2024-0005',
    fullName: 'Zainab Riaz',
    email: 'zainab.riaz@example.com',
    phone: '+92-300-5555555',
    cnic: '35202-9999999-9',
    dateOfBirth: '2003-11-30',
    gender: 'female',
    address: 'House 14, Bahria Town, Lahore',
    guardian: {
      name: 'Riaz Hussain',
      cnic: '35202-1010101-0',
      occupation: 'Teacher',
      contactNumber: '+92-309-1010101',
      emergencyContact: '+92-310-2020202',
    },
    program: 'BS Computer Science',
    semester: 6,
    session: 'Fall 2024',
    previousQualification: 'Intermediate (ICS)',
    previousInstitute: 'KIPS College Lahore',
    marks: '71%',
    courseCodes: ['CS201', 'MTH202', 'PHY101'], // intentionally incomplete (3 courses)
    branchCode: 'LHR',
    makeDateSheet: false,
  },
];

async function seedEmailsForPending(student) {
  const token = generateToken();
  await Student.updateOne(
    { _id: student._id },
    {
      $set: {
        setupTokenHash: hashToken(token),
        setupTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        accountStatus: ACCOUNT_STATUS.PENDING_SETUP,
        emailStatus: env.isEmailConfigured ? EMAIL_STATUS.PENDING : EMAIL_STATUS.DISABLED,
      },
    }
  );
  return `${env.CLIENT_URL}/set-password?token=${token}`;
}

async function run() {
  await connectDatabase();
  logger.warn('Seed resets demo data (dropping the ExamSlot database).');
  await mongoose.connection.dropDatabase();
  logger.info('Seeding ExamSlot demo data…');

  // ---- Administrator ----
  const adminPasswordHash = await Admin.hashPassword(env.ADMIN_PASSWORD);
  const admin = await Admin.findOneAndUpdate(
    { email: env.ADMIN_EMAIL.toLowerCase() },
    { $set: { name: env.ADMIN_NAME, passwordHash: adminPasswordHash, role: 'admin' } },
    { upsert: true, new: true }
  );

  // ---- Branches ----
  const branches = {};
  for (const b of BRANCHES) {
    const doc = await Branch.findOneAndUpdate(
      { code: b.code },
      { $set: { ...b, isActive: true } },
      { upsert: true, new: true }
    );
    branches[b.code] = doc;
  }

  // ---- Courses ----
  const courses = {};
  for (const c of COURSES) {
    const doc = await Course.findOneAndUpdate(
      { code: c.code },
      { $set: { ...c, isActive: true } },
      { upsert: true, new: true }
    );
    courses[c.code] = doc;
  }

  // ---- Exam slots ----
  // Each course gets 3 alternatives. The day offset is staggered by course so
  // that courses in different groups never share a date, while courses within
  // the same group have distinct date alternatives. This yields realistic,
  // conflict-free schedules for demo students.
  const slotPlan = [
    { offset: 10, startTime: '09:00', endTime: '12:00' },
    { offset: 15, startTime: '13:00', endTime: '16:00' },
    { offset: 20, startTime: '09:00', endTime: '12:00' },
  ];
  const courseList = Object.values(courses);
  let slotCount = 0;
  for (let ci = 0; ci < courseList.length; ci += 1) {
    const course = courseList[ci];
    for (const p of slotPlan) {
      const examDate = futureDate(p.offset + (ci % 3));
      await ExamSlot.findOneAndUpdate(
        { course: course._id, examDate, startTime: p.startTime, endTime: p.endTime },
        {
          $setOnInsert: {
            course: course._id,
            examDate,
            startTime: p.startTime,
            endTime: p.endTime,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
      slotCount += 1;
    }
  }

  // ---- Students + assignments ----
  const studentPasswordHash = await Student.hashPassword(env.DEMO_STUDENT_PASSWORD);
  const pendingLinks = [];

  for (const s of STUDENTS) {
    const update = {
      fullName: s.fullName,
      email: s.email,
      phone: s.phone,
      cnic: s.cnic,
      dateOfBirth: new Date(s.dateOfBirth),
      gender: s.gender,
      address: s.address,
      guardian: s.guardian,
      program: s.program,
      semester: s.semester,
      session: s.session,
      previousQualification: s.previousQualification,
      previousInstitute: s.previousInstitute,
      marks: s.marks,
      role: 'student',
      isActive: true,
    };
    if (s.pendingSetup) {
      update.passwordHash = null;
      update.accountStatus = ACCOUNT_STATUS.PENDING_SETUP;
      update.selectedBranch = s.branchCode ? branches[s.branchCode]._id : null;
      update.branchSelectedAt = s.branchCode ? new Date() : null;
    } else {
      update.passwordHash = studentPasswordHash;
      update.accountStatus = ACCOUNT_STATUS.ACTIVE;
      update.selectedBranch = s.branchCode ? branches[s.branchCode]._id : null;
      update.branchSelectedAt = s.branchCode ? new Date() : null;
    }

    const student = await Student.findOneAndUpdate(
      { registrationNumber: s.registrationNumber },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Assignments (idempotent, setOnInsert avoids duplicates).
    for (const code of s.courseCodes) {
      await CourseAssignment.updateOne(
        { student: student._id, course: courses[code]._id },
        { $setOnInsert: { student: student._id, course: courses[code]._id } },
        { upsert: true }
      );
    }

    if (s.pendingSetup) {
      const link = await seedEmailsForPending(student);
      pendingLinks.push({ student, link });
      continue;
    }

    // Optionally seed one already-saved (locked) date sheet for demo.
    if (s.makeDateSheet && s.branchCode) {
      const existing = await DateSheet.findOne({ student: student._id });
      if (!existing) {
        const fresh = await Student.findById(student._id);
        const chosen = [];
        for (const code of s.courseCodes) {
          const courseId = courses[code]._id;
          const candidates = await ExamSlot.find({ course: courseId, isActive: true }).sort({
            examDate: 1,
            startTime: 1,
          });
          for (const slot of candidates) {
            const { start, end } = resolveInterval(slot.examDate, slot.startTime, slot.endTime);
            const clash = chosen.some((c) => intervalsOverlap(c.start, c.end, start, end));
            if (!clash) {
              chosen.push({ slot, start, end });
              break;
            }
          }
        }
        const selections = chosen.map((c) => ({ course: c.slot.course, slot: c.slot._id }));
        try {
          await saveDateSheet(fresh, selections);
          logger.info(`Seeded locked date sheet for ${s.registrationNumber} (${selections.length} exams)`);
        } catch (err) {
          logger.warn(`Could not seed date sheet for ${s.registrationNumber}: ${err.message}`);
        }
      }
    }
  }

  // ---- A demo change request (idempotent) ----
  const zainab = await Student.findOne({ registrationNumber: 'VU-2024-0005' });
  if (zainab) {
    const existingReq = await ChangeRequest.findOne({ student: zainab._id, type: 'DATE_SHEET_CHANGE' });
    if (!existingReq) {
      await ChangeRequest.create({
        student: zainab._id,
        type: 'DATE_SHEET_CHANGE',
        reason: 'I would like to request a change to my examination schedule due to a medical appointment.',
        status: 'PENDING',
      });
    }
  }

  await AdminAuditLog.updateOne(
    { action: AUDIT_ACTION.ADMIN_LOGIN, entityType: 'Seed' },
    { $setOnInsert: { actor: admin._id, actorEmail: admin.email, action: AUDIT_ACTION.ADMIN_LOGIN, entityType: 'Seed', description: 'Demo data seeded' } },
    { upsert: true }
  );

  logger.info('Seed complete.');
  // eslint-disable-next-line no-console
  console.log('\n================ ExamSlot demo credentials ================');
  console.log(`Admin:   ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
  console.log(`Student: bilal.ahmed@example.com / ${env.DEMO_STUDENT_PASSWORD} (has a saved, locked date sheet)`);
  console.log(`Student: ayesha.khan@example.com / ${env.DEMO_STUDENT_PASSWORD}`);
  console.log(`Student: zainab.riaz@example.com / ${env.DEMO_STUDENT_PASSWORD} (incomplete assignments + pending request)`);
  if (pendingLinks.length) {
    console.log('\nPending account setup (student must set a password):');
    for (const { student, link } of pendingLinks) {
      console.log(`  ${student.email}: ${link}`);
    }
  }
  console.log(`\nBranches: ${BRANCHES.length} | Courses: ${COURSES.length} | Slots: ${slotCount} | Students: ${STUDENTS.length}`);
  console.log('===========================================================\n');
}

run()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (err) => {
    logger.error('Seed failed:', err?.stack || err);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  });
