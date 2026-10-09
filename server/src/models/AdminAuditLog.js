import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null, index: true },
    actorEmail: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, default: '' },
    entityId: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 500 },
    // Sanitised, non-sensitive context only.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { versionKey: false },
  }
);

adminAuditLogSchema.index({ createdAt: -1 });

export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
export default AdminAuditLog;
