import mongoose from 'mongoose';

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

const examSlotSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    examDate: {
      type: String,
      required: true,
      match: [dateRe, 'examDate must be in YYYY-MM-DD format'],
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [timeRe, 'startTime must be in HH:mm format'],
    },
    endTime: {
      type: String,
      default: '',
      validate: {
        validator(v) {
          return v === '' || v === null || timeRe.test(v);
        },
        message: 'endTime must be in HH:mm format',
      },
    },
    // Optional per-branch capacity overrides, keyed by branch id.
    capacity: { type: Map, of: Number, default: () => new Map() },
    // Booked seats per branch, keyed by branch id. Managed atomically.
    booked: { type: Map, of: Number, default: () => new Map() },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// Prevent duplicate slots for the same course + date + start + end.
examSlotSchema.index(
  { course: 1, examDate: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

examSlotSchema.methods.capacityFor = function capacityFor(branchId, defaultCapacity) {
  const key = String(branchId);
  const override = this.capacity?.get?.(key);
  return Number.isFinite(override) ? override : defaultCapacity;
};

examSlotSchema.methods.availableFor = function availableFor(branchId, defaultCapacity) {
  const cap = this.capacityFor(branchId, defaultCapacity);
  const used = this.booked?.get?.(String(branchId)) || 0;
  return Math.max(0, cap - used);
};

/**
 * Atomically reserves one seat for `branchId` on a slot, enforcing capacity.
 * Returns the updated slot, or null when the slot is full / unavailable.
 * Safe against concurrent bookings: MongoDB serialises the conditional update.
 */
examSlotSchema.statics.reserveSeat = function reserveSeat(slotId, branchId, capacity) {
  const key = String(branchId);
  return this.findOneAndUpdate(
    {
      _id: slotId,
      isActive: true,
      $expr: { $lt: [{ $ifNull: [`$booked.${key}`, 0] }, capacity] },
    },
    { $inc: { [`booked.${key}`]: 1 } },
    { new: true }
  );
};

/** Atomically releases one previously reserved seat (never below zero). */
examSlotSchema.statics.releaseSeat = function releaseSeat(slotId, branchId) {
  const key = String(branchId);
  return this.findOneAndUpdate(
    { _id: slotId, [`booked.${key}`]: { $gt: 0 } },
    { $inc: { [`booked.${key}`]: -1 } },
    { new: true }
  );
};

export const ExamSlot = mongoose.model('ExamSlot', examSlotSchema);
export default ExamSlot;
