import mongoose from 'mongoose';
import { REQUEST_STATUS, REQUEST_TYPE } from '../config/constants.js';

const changeRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(REQUEST_TYPE),
      required: true,
      index: true,
    },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
      index: true,
    },
    adminRemark: { type: String, default: '', trim: true, maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    reviewedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// At most one PENDING request per (student, type). Database-enforced.
changeRequestSchema.index(
  { student: 1, type: 1 },
  { unique: true, partialFilterExpression: { status: REQUEST_STATUS.PENDING } }
);

changeRequestSchema.index({ status: 1, type: 1, createdAt: -1 });

export const ChangeRequest = mongoose.model('ChangeRequest', changeRequestSchema);
export default ChangeRequest;
