import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProductionEntry extends Document {
    userId: string;
    date: Date;
    productType: string;
    source: string;
    fatType: string;
    milkUsedLiters: number;
    quantityProduced: number;
    createdAt: Date;
    updatedAt: Date;
}

const ProductionEntrySchema: Schema = new Schema(
    {
        userId: { type: String, required: true },
        date: { type: Date, required: true },
        productType: { type: String, required: true, enum: ['Paneer', 'Ghee', 'Butter', 'Curd', 'Other'] },
        source: { type: String, required: true, enum: ['Cow', 'Buffalo', 'Goat', 'Other'] },
        fatType: { type: String, required: true, enum: ['Whole', 'Reduced', 'Low-fat', 'Skim'] },
        milkUsedLiters: { type: Number, required: true },
        quantityProduced: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

export const ProductionEntry: Model<IProductionEntry> =
    mongoose.models.ProductionEntry || mongoose.model<IProductionEntry>('ProductionEntry', ProductionEntrySchema);
