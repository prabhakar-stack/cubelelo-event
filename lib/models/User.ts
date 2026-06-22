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
  emailVerified?: boolean;
  verifyToken?: string;
  verifyTokenExpiry?: Date;
  migrationEmailSentAt?: Date;
  privacyPublic?: boolean;
  wcaVerified?: boolean;
  notifEmail?: boolean;
  notifPush?: boolean;
  theme?: 'dark' | 'light';
  // ─── Gamification & economy ───
  pointsBalance?: number;
  streak?: { current: number; longest: number; lastSolvedDate?: string; freezesUsed?: number };
  streakFreezes?: number;
  premiumUntil?: Date | null;
  profileCompletion?: { percent: number; rewardedAt?: Date | null };
  keybindings?: Record<string, string>;
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
    emailVerified: { type: Boolean, default: false },
    verifyToken: { type: String, select: false },
    verifyTokenExpiry: { type: Date, select: false },
    migrationEmailSentAt: { type: Date },
    privacyPublic: { type: Boolean, default: true },
    wcaVerified: { type: Boolean, default: false },
    notifEmail: { type: Boolean, default: true },
    notifPush: { type: Boolean, default: true },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    // ─── Gamification & economy ───
    pointsBalance: { type: Number, default: 0 },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastSolvedDate: { type: String },
      freezesUsed: { type: Number, default: 0 },
    },
    streakFreezes: { type: Number, default: 0 },
    premiumUntil: { type: Date, default: null },
    profileCompletion: {
      percent: { type: Number, default: 0 },
      rewardedAt: { type: Date, default: null },
    },
    keybindings: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
