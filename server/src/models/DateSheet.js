import mongoose from 'mongoose';

const dateSheetItemSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSlot', required: true },
    // Immutable snapshot of the chosen slot for the authoritative record.
    courseCode: { type: String, required: true },
    courseTitle: { type: String, required: true },
    examDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, default: '' },
  },
  { _id: false }
);

const dateSheetSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true,
    },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    items: { type: [dateSheetItemSchema], default: [] },
    version: { type: Number, default: 1 },
    locked: { type: Boolean, default: true },
    savedAt: { type: Date, default: Date.now },
    changeHistory: {
      type: [
        {
          changedAt: { type: Date, default: Date.now },
          reason: { type: String, default: '' },
          previousItems: { type: [dateSheetItemSchema], default: [] },
          _id: false,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

export const DateSheet = mongoose.model('DateSheet', dateSheetSchema);
export default DateSheet;
