import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  adminId?: string;
  adminName?: string;
  adminEmail?: string;
  action: string;       // e.g. 'competition.create', 'result.override', 'user.ban'
  target?: string;      // affected entity id (competitionId, userId, …)
  reason?: string;
  meta?: any;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: String },
    adminName: { type: String },
    adminEmail: { type: String },
    action: { type: String, required: true, index: true },
    target: { type: String },
    reason: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'auditlogs' },
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
