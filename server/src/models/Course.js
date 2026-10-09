import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200, index: true },
    creditHours: {
      type: Number,
      required: true,
      min: [1, 'Credit hours must be at least 1'],
      max: [12, 'Credit hours are unreasonably large'],
    },
    department: { type: String, required: true, trim: true, maxlength: 120, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

courseSchema.index({ code: 'text', title: 'text' });

export const Course = mongoose.model('Course', courseSchema);
export default Course;
