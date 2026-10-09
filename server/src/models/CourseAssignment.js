import mongoose from 'mongoose';

const courseAssignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// A student can be assigned a given course at most once.
courseAssignmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const CourseAssignment = mongoose.model('CourseAssignment', courseAssignmentSchema);
export default CourseAssignment;
