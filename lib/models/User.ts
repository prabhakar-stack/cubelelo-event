import mongoose, { Document, Model, Schema } from 'mongoose';

export type UserRole = 'ATHLETE' | 'ADMIN' | 'DELEGATE';

export interface IUser extends Document {
  // NextAuth compat fields
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;

  // Cubelelo profile
  clId: string;           // e.g. "CL0001"
  displayName?: string;
  wcaId?: string;         // e.g. "2014DESH01"
  wcaVerified: boolean;
  role: UserRole;
  state?: string;
  city?: string;

  // Stats (denormalised for fast reads)
  totalSolves: number;
  activeSince: Date;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    emailVerified: { type: Date },
    image: { type: String },

    clId: { type: String, unique: true, sparse: true },
    displayName: { type: String },
    wcaId: { type: String, unique: true, sparse: true },
    wcaVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['ATHLETE', 'ADMIN', 'DELEGATE'], default: 'ATHLETE' },
    state: { type: String },
    city: { type: String },

    totalSolves: { type: Number, default: 0 },
    activeSince: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-assign CL ID before first save
UserSchema.pre('save', async function (next) {
  if (this.isNew && !this.clId) {
    const count = await (this.constructor as Model<IUser>).countDocuments();
    this.clId = `CL${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
