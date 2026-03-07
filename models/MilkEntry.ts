import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IMilkEntry extends Document {
    userId: string;
    supplier: string;
    date: Date;
    shift: string;
    source: string;
    customSource?: string;
    fatType: string;
    snf?: number;
    clr?: number;
    quantity: number;
    costPerLiter: number;
    totalCost: number;
    createdAt: Date;
    updatedAt: Date;
}

const MilkEntrySchema: Schema = new Schema(
    {
        userId: { type: String, required: true },
        supplier: { type: String, required: true },
        date: { type: Date, required: true },
        shift: { type: String, required: true, enum: ['Morning', 'Evening'] },
        source: { type: String, required: true, enum: ['Cow', 'Buffalo', 'Goat', 'Other'] },
        customSource: { type: String },
        fatType: { type: String, required: true },
        snf: { type: Number },
        clr: { type: Number },
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
