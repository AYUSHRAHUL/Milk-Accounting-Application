import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMilkProduction extends Document {
  userId: string;
  date: Date;
  totalMilk: number;
  separationMilk: number;
  sourceSeparation: {
    cow: number;
    buffalo: number;
    goat: number;
    other: number;
  };
  wholeMilk: number;
  skimMilk: number;
  creamMilk: number;
  mixedMilk: number;
  createdAt: Date;
  updatedAt: Date;
}

const MilkProductionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    totalMilk: { type: Number, required: true },
    separationMilk: { type: Number, required: true },
    sourceSeparation: {
      cow: { type: Number, default: 0 },
      buffalo: { type: Number, default: 0 },
      goat: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    wholeMilk: { type: Number, required: true },
    skimMilk: { type: Number, required: true },
    creamMilk: { type: Number, required: true },
    mixedMilk: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Indexes for performance
MilkProductionSchema.index({ userId: 1, date: -1 });

export const MilkProduction: Model<IMilkProduction> =
  mongoose.models.MilkProduction || mongoose.model<IMilkProduction>('MilkProduction', MilkProductionSchema);
