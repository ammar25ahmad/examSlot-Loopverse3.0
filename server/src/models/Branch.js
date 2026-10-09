import mongoose from 'mongoose';
import { BRANCH_SEAT_TOTAL } from '../config/constants.js';

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
      index: true,
    },
    city: { type: String, required: true, trim: true, maxlength: 100, index: true },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^[+]?[\d\s-]{7,20}$/, 'Contact number is not valid'],
    },
    seatCapacity: {
      type: Number,
      required: true,
      default: BRANCH_SEAT_TOTAL,
      min: [1, 'Seat capacity must be at least 1'],
      max: [10000, 'Seat capacity is unreasonably large'],
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

branchSchema.virtual('displayName').get(function displayName() {
  return `${this.name} (${this.code})`;
});

export const Branch = mongoose.model('Branch', branchSchema);
export default Branch;
