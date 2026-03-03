import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMilkEntry extends Document {
    userId: string;
    date: Date;
    source: string;
    customSource?: string;
    fatType: string;
    quantity: number;
    costPerLiter: number;
    totalCost: number;
    createdAt: Date;
    updatedAt: Date;
}

const MilkEntrySchema: Schema = new Schema(
    {
        userId: { type: String, required: true }, // We assume a user is making the entry
        date: { type: Date, required: true },
        source: { type: String, required: true, enum: ['Cow', 'Buffalo', 'Goat', 'Other'] },
        customSource: { type: String },
        fatType: { type: String, required: true, enum: ['Whole', 'Reduced', 'Low-fat', 'Skim'] },
        quantity: { type: Number, required: true },
        costPerLiter: { type: Number, required: true },
        totalCost: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

export const MilkEntry: Model<IMilkEntry> =
    mongoose.models.MilkEntry || mongoose.model<IMilkEntry>('MilkEntry', MilkEntrySchema);
