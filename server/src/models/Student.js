import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ACCOUNT_STATUS, EMAIL_STATUS, ROLES } from '../config/constants.js';

const genderEnum = ['male', 'female', 'other'];

const studentSchema = new mongoose.Schema(
  {
    // ---- Personal information ----
    fullName: { type: String, required: true, trim: true, maxlength: 160, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[+]?[\d\s-]{7,20}$/, 'Phone number is not valid'],
    },
    cnic: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
      maxlength: 20,
    },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: genderEnum, required: true },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    photoUrl: { type: String, trim: true, default: '' },

    // ---- Parent / guardian information ----
    guardian: {
      name: { type: String, required: true, trim: true, maxlength: 160 },
      cnic: { type: String, required: true, trim: true, maxlength: 20 },
      occupation: { type: String, required: true, trim: true, maxlength: 120 },
      contactNumber: {
        type: String,
        required: true,
        trim: true,
        match: [/^[+]?[\d\s-]{7,20}$/, 'Guardian contact number is not valid'],
      },
      emergencyContact: {
        type: String,
        required: true,
        trim: true,
        match: [/^[+]?[\d\s-]{7,20}$/, 'Emergency contact number is not valid'],
      },
    },

    // ---- Academic information ----
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    program: { type: String, required: true, trim: true, maxlength: 120 },
    semester: { type: Number, required: true, min: 1, max: 16 },
    session: { type: String, required: true, trim: true, maxlength: 40 },
    previousQualification: { type: String, required: true, trim: true, maxlength: 160 },
    previousInstitute: { type: String, required: true, trim: true, maxlength: 200 },
    marks: { type: String, required: true, trim: true, maxlength: 60 },

    // ---- Account and workflow fields ----
    role: { type: String, enum: [ROLES.STUDENT], default: ROLES.STUDENT, immutable: true },
    passwordHash: { type: String, default: null, select: false },
    setupTokenHash: { type: String, default: null, select: false },
    setupTokenExpiresAt: { type: Date, default: null, select: false },
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpiresAt: { type: Date, default: null, select: false },
    passwordChangedAt: { type: Date, default: null },

    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.PENDING_SETUP,
      index: true,
    },
    emailStatus: {
      type: String,
      enum: Object.values(EMAIL_STATUS),
      default: EMAIL_STATUS.PENDING,
    },
    emailLastError: { type: String, default: '' },
    emailLastAttemptAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date, default: null },

    selectedBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
    branchSelectedAt: { type: Date, default: null },

    dateSheetLocked: { type: Boolean, default: false },

    // One-time entitlements granted by an approved change request.
    branchChangeEntitlement: { type: Boolean, default: false },
    dateSheetChangeEntitlement: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.setupTokenHash;
        delete ret.setupTokenExpiresAt;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpiresAt;
        return ret;
      },
    },
  }
);

studentSchema.index({ program: 1, semester: 1 });
studentSchema.index({ accountStatus: 1, isActive: 1 });

studentSchema.virtual('hasSelectedBranch').get(function hasSelectedBranch() {
  return Boolean(this.selectedBranch);
});

studentSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash);
};

studentSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

export const Student = mongoose.model('Student', studentSchema);
export default Student;
