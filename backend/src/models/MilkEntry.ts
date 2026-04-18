import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMilkEntry extends Document {
  userId: string;
  supplier: string;
  supplierId?: string;
  date: Date;
  shift: string;
  source: string;
  customSource?: string;
  fatType: string;
  snf?: number;
  clr?: number;
  lr?: number;
  temp?: number;
  ts?: number;
  quantity: number;
  costPerLiter: number;
  totalCost: number;
  mbrt?: string;
  mbrtTime?: string;
  cob?: string;
  protein?: number;
  lactose?: number;
  ash?: number;
  addedWater?: number;
  tsMachine?: number;
  tsDiff?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MilkEntrySchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    supplier: { type: String, required: true },
    supplierId: { type: String },
    date: { type: Date, required: true },
    shift: { type: String, required: true, enum: ['Morning', 'Evening'] },
    source: { type: String, required: true, enum: ['Cow', 'Buffalo', 'Goat', 'Other'] },
    customSource: { type: String },
    fatType: { type: String, required: false },
    snf: { type: Number },
    clr: { type: Number },
    lr: { type: Number },
    temp: { type: Number },
    ts: { type: Number },
    quantity: { type: Number, required: true },
    costPerLiter: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    mbrt: { type: String },
    mbrtTime: { type: String },
    cob: { type: String },
    protein: { type: Number },
    lactose: { type: Number },
    ash: { type: Number },
    addedWater: { type: Number },
    tsMachine: { type: Number },
    tsDiff: { type: Number },
  },
  { timestamps: true }
);

// Indexes for performance
MilkEntrySchema.index({ userId: 1, date: -1 });
MilkEntrySchema.index({ supplierId: 1 });

export const MilkEntry: Model<IMilkEntry> =
  mongoose.models.MilkEntry || mongoose.model<IMilkEntry>('MilkEntry', MilkEntrySchema);

