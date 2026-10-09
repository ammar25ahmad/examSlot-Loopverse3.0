// Business-rule integration tests for the ExamSlot API.
//
// These run against a dedicated `examslot_test` database and exercise the
// server-enforced invariants (CSRF, auth/rbac, branch selection, assignment
// limits, date-sheet locking + conflict detection, seat capacity, and the
// single-pending-request / entitlement workflow).
//
// Env vars are set BEFORE importing the app so that config/env.js + dotenv
// pick up the test database (dotenv never overrides an existing value).

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/examslot_test';

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';

const mongoose = (await import('mongoose')).default;
const { default: request } = await import('supertest');
const { default: app } = await import('../src/app.js');
const { connectDatabase, disconnectDatabase } = await import('../src/config/db.js');
const { Admin } = await import('../src/models/Admin.js');
const { Student } = await import('../src/models/Student.js');
const { Branch } = await import('../src/models/Branch.js');
const { Course } = await import('../src/models/Course.js');
const { ExamSlot } = await import('../src/models/ExamSlot.js');
const { CourseAssignment } = await import('../src/models/CourseAssignment.js');
const { ChangeRequest } = await import('../src/models/ChangeRequest.js');
const { ACCOUNT_STATUS } = await import('../src/config/constants.js');

const ADMIN_PASSWORD = 'Admin@Test12345';
const STUDENT_PASSWORD = 'Student@Test12345';

const state = {};

async function makeStudent(email, registrationNumber) {
  return Student.create({
    fullName: 'Test Student',
    email,
    phone: '+92 300 1234567',
    cnic: '42101-1234567-1',
    dateOfBirth: new Date('2002-05-15'),
    gender: 'female',
    address: '123 Test Street, Karachi',
    guardian: {
      name: 'Test Guardian',
      cnic: '42101-7654321-1',
      occupation: 'Engineer',
      contactNumber: '+92 300 7654321',
      emergencyContact: '+92 300 1112222',
    },
    registrationNumber,
    program: 'BS Computer Science',
    semester: 5,
    session: '2023-2027',
    previousQualification: 'Intermediate',
    previousInstitute: 'Test College',
    marks: '85%',
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    passwordHash: await Student.hashPassword(STUDENT_PASSWORD),
  });
}

async function login(email, password, expectedRole) {
  const agent = request.agent(app);
  const res = await agent
    .post('/api/auth/login')
    .send({ email, password, expectedRole });
  return { agent, res, csrf: res.body?.data?.csrfToken };
}

function authed(agent, csrf) {
  return {
    post: (url) => agent.post(url).set('x-csrf-token', csrf || ''),
    patch: (url) => agent.patch(url).set('x-csrf-token', csrf || ''),
    put: (url) => agent.put(url).set('x-csrf-token', csrf || ''),
    get: (url) => agent.get(url),
  };
}

beforeAll(async () => {
  await connectDatabase();
  await mongoose.connection.dropDatabase();

  state.admin = await Admin.create({
    name: 'Test Admin',
    email: 'admin@test.local',
    passwordHash: await Admin.hashPassword(ADMIN_PASSWORD),
  });

  state.branch = await Branch.create({
    name: 'Test Branch',
    code: 'TST',
    city: 'Karachi',
    address: '1 Test Road',
    contactNumber: '+92 21 111 222 333',
    seatCapacity: 60,
  });

  const courseDefs = [
    ['CS101', 'Intro to Computing'],
    ['CS102', 'Programming Fundamentals'],
    ['CS103', 'Data Structures'],
    ['CS104', 'Discrete Mathematics'],
  ];
  state.courses = [];
  for (const [code, title] of courseDefs) {
    state.courses.push(
      await Course.create({
        code,
        title,
        creditHours: 3,
        department: 'Computer Science',
      })
    );
  }
  const [c1, c2, c3, c4] = state.courses;

  const mk = (course, examDate, startTime, endTime) =>
    ExamSlot.create({ course: course._id, examDate, startTime, endTime });

  state.slots = {
    c1: await mk(c1, '2026-11-01', '09:00', '12:00'),
    // c2 offers a conflicting slot AND a clean alternative.
    c2Conflict: await mk(c2, '2026-11-01', '09:00', '12:00'),
    c2Alt: await mk(c2, '2026-11-02', '09:00', '12:00'),
    c3: await mk(c3, '2026-11-03', '09:00', '12:00'),
    c4: await mk(c4, '2026-11-04', '09:00', '12:00'),
  };

  state.student = await makeStudent('student@test.local', 'TST-0001');

  for (const course of state.courses) {
    await CourseAssignment.create({ student: state.student._id, course: course._id });
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await disconnectDatabase();
});

describe('ExamSlot business rules', () => {
  test('health endpoint responds ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });

  test('protected admin route rejects anonymous requests (401)', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  test('login rejects an incorrect password (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.local', password: 'wrong-password', expectedRole: 'admin' });
    expect(res.status).toBe(401);
  });

  test('student cannot access admin-only routes (403)', async () => {
    const { agent } = await login('student@test.local', STUDENT_PASSWORD, 'student');
    const res = await agent.get('/api/admin/dashboard');
    expect(res.status).toBe(403);
  });

  test('CSRF is enforced on state-changing requests (403)', async () => {
    const { agent } = await login('student@test.local', STUDENT_PASSWORD, 'student');
    const res = await agent
      .post('/api/student/select-branch')
      .send({ branchId: String(state.branch._id) });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_FAILED');
  });

  test('branch can be selected only once', async () => {
    const { agent, csrf } = await login('student@test.local', STUDENT_PASSWORD, 'student');
    const api = authed(agent, csrf);

    const first = await api
      .post('/api/student/select-branch')
      .send({ branchId: String(state.branch._id) });
    expect([200, 201]).toContain(first.status);

    const second = await api
      .post('/api/student/select-branch')
      .send({ branchId: String(state.branch._id) });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('BRANCH_ALREADY_SELECTED');
  });

  test('assignment count is constrained to 4–6 courses', async () => {
    const { agent, csrf } = await login('admin@test.local', ADMIN_PASSWORD, 'admin');
    const api = authed(agent, csrf);
    const url = `/api/assignments/student/${state.student._id}`;

    const tooFew = await api.put(url).send({ courseIds: state.courses.slice(0, 3).map((c) => String(c._id)) });
    expect(tooFew.status).toBe(422);

    const ok = await api.put(url).send({ courseIds: state.courses.map((c) => String(c._id)) });
    expect([200, 201]).toContain(ok.status);
  });

  test('date sheet with an overlapping schedule is rejected (TIME_CONFLICT)', async () => {
    const { agent, csrf } = await login('student@test.local', STUDENT_PASSWORD, 'student');
    const api = authed(agent, csrf);
    const [c1, c2, c3, c4] = state.courses;

    const res = await api.post('/api/student/date-sheet').send({
      selections: [
        { course: String(c1._id), slot: String(state.slots.c1._id) },
        { course: String(c2._id), slot: String(state.slots.c2Conflict._id) },
        { course: String(c3._id), slot: String(state.slots.c3._id) },
        { course: String(c4._id), slot: String(state.slots.c4._id) },
      ],
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('TIME_CONFLICT');
  });

  test('a valid date sheet is saved and locked', async () => {
    const { agent, csrf } = await login('student@test.local', STUDENT_PASSWORD, 'student');
    const api = authed(agent, csrf);
    const [c1, c2, c3, c4] = state.courses;

    const res = await api.post('/api/student/date-sheet').send({
      selections: [
        { course: String(c1._id), slot: String(state.slots.c1._id) },
        { course: String(c2._id), slot: String(state.slots.c2Alt._id) },
        { course: String(c3._id), slot: String(state.slots.c3._id) },
        { course: String(c4._id), slot: String(state.slots.c4._id) },
      ],
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.data.locked).toBe(true);
    expect(res.body.data.totalExams).toBe(4);
  });

  test('a locked date sheet cannot be saved again without an entitlement', async () => {
    const { agent, csrf } = await login('student@test.local', STUDENT_PASSWORD, 'student');
    const api = authed(agent, csrf);
    const [c1, c2, c3, c4] = state.courses;

    const res = await api.post('/api/student/date-sheet').send({
      selections: [
        { course: String(c1._id), slot: String(state.slots.c1._id) },
        { course: String(c2._id), slot: String(state.slots.c2Alt._id) },
        { course: String(c3._id), slot: String(state.slots.c3._id) },
        { course: String(c4._id), slot: String(state.slots.c4._id) },
      ],
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DATE_SHEET_LOCKED');
  });

  test('seat capacity is enforced atomically at the model level', async () => {
    const c5 = await Course.create({
      code: 'CS105',
      title: 'Operating Systems',
      creditHours: 3,
      department: 'Computer Science',
    });
    const slot = await ExamSlot.create({
      course: c5._id,
      examDate: '2026-11-05',
      startTime: '09:00',
      endTime: '12:00',
      capacity: { [String(state.branch._id)]: 1 },
    });

    const first = await ExamSlot.reserveSeat(slot._id, state.branch._id, 1);
    expect(first).toBeTruthy();

    const second = await ExamSlot.reserveSeat(slot._id, state.branch._id, 1);
    expect(second).toBeNull();

    const released = await ExamSlot.releaseSeat(slot._id, state.branch._id);
    expect(released.booked.get(String(state.branch._id))).toBe(0);
  });

  test('only one PENDING request per (student, type) is allowed', async () => {
    const { agent, csrf } = await login('student@test.local', STUDENT_PASSWORD, 'student');
    const api = authed(agent, csrf);

    const first = await api
      .post('/api/student/requests')
      .send({ type: 'DATE_SHEET_CHANGE', reason: 'Medical emergency requires a new schedule.' });
    expect([200, 201]).toContain(first.status);
    state.requestId = first.body.data?._id;

    const second = await api
      .post('/api/student/requests')
      .send({ type: 'DATE_SHEET_CHANGE', reason: 'Trying to submit a duplicate request.' });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('PENDING_REQUEST_EXISTS');
  });

  test('approving a request grants a one-time entitlement', async () => {
    const { agent, csrf } = await login('admin@test.local', ADMIN_PASSWORD, 'admin');
    const api = authed(agent, csrf);

    const review = await api
      .patch(`/api/admin/requests/${state.requestId}/review`)
      .send({ status: 'APPROVED', adminRemark: 'Approved for medical reasons.' });
    expect(review.status).toBe(200);
    expect(review.body.data.entitlementGranted).toBe('dateSheetChangeEntitlement');

    const studentLogin = await login('student@test.local', STUDENT_PASSWORD, 'student');
    const builder = await studentLogin.agent.get('/api/student/date-sheet/builder');
    expect(builder.status).toBe(200);
    expect(builder.body.data.canEdit).toBe(true);
    expect(builder.body.data.locked).toBe(true);
  });

  test('a request cannot be reviewed twice', async () => {
    const { agent, csrf } = await login('admin@test.local', ADMIN_PASSWORD, 'admin');
    const api = authed(agent, csrf);

    const res = await api
      .patch(`/api/admin/requests/${state.requestId}/review`)
      .send({ status: 'REJECTED', adminRemark: 'Re-review attempt.' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_REVIEWED');
  });

  test('the pending-request unique index exists in the database', async () => {
    const indexes = await ChangeRequest.collection.indexes();
    expect(indexes.some((i) => i.partialFilterExpression?.status === 'PENDING')).toBe(true);
  });
});
