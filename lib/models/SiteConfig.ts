import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteConfig extends Document {
  key: string;
  value: any;
  updatedAt: Date;
}

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'siteconfigs' }
);

export const SiteConfig = mongoose.models.SiteConfig ?? mongoose.model<ISiteConfig>('SiteConfig', SiteConfigSchema);

// Default rank tier thresholds (3x3 solve time in milliseconds, upper bound for each tier)
// e.g., Beginner: > 120s, sub-120 = Intermediate, etc.
export const DEFAULT_RANK_TIERS = [
  { name: 'Elite',        maxMs: 12000  },  // sub-12
  { name: 'Pro',          maxMs: 15000  },  // sub-15
  { name: 'Expert',       maxMs: 20000  },  // sub-20
  { name: 'Advanced',     maxMs: 30000  },  // sub-30
  { name: 'Intermediate', maxMs: 60000  },  // sub-60
  { name: 'Beginner',     maxMs: 999999 },  // everyone else
];
