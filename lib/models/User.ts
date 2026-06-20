import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  wcaId?: string | null;
  name?: { firstName?: string; lastName?: string };
  dob?: string;
  gender?: string;
  city?: string;
  mobile?: string;
  email: string;
  password?: string;
  token?: string;
  role: string;
  country?: string;
  active: boolean;
  profilePicture?: string;
  socialMedia?: Record<string, string>;
  resetToken?: string;
  resetTokenExpiry?: Date;
  privacyPublic?: boolean;
  wcaVerified?: boolean;
  notifEmail?: boolean;
  notifPush?: boolean;
  theme?: 'dark' | 'light';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, unique: true, sparse: true },
    wcaId: { type: String, default: null },
    name: {
      firstName: { type: String },
      lastName: { type: String },
    },
    dob: { type: String },
    gender: { type: String },
    city: { type: String },
    mobile: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    token: { type: String, select: false },
    role: { type: String, default: 'user' },
    country: { type: String },
    active: { type: Boolean, default: true },
    profilePicture: { type: String },
    socialMedia: { type: Schema.Types.Mixed },
    resetToken: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
    privacyPublic: { type: Boolean, default: true },
    wcaVerified: { type: Boolean, default: false },
    notifEmail: { type: Boolean, default: true },
    notifPush: { type: Boolean, default: true },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
