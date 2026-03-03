import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISaleEntry extends Document {
    userId: string;
    date: string;
    customerName?: string;
    productType: string;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    paymentMode: string;
    createdAt: Date;
}

const SaleEntrySchema: Schema = new Schema(
    {
        userId: { type: String, required: true },
        date: { type: String, required: true },
        customerName: { type: String, required: false },
        productType: { type: String, required: true, enum: ['Paneer', 'Ghee', 'Butter', 'Curd', 'Other'] },
        quantity: { type: Number, required: true },
        pricePerUnit: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        paymentMode: { type: String, required: true, enum: ['Cash', 'UPI', 'Credit'] },
    },
    {
        timestamps: true,
    }
);

export const SaleEntry: Model<ISaleEntry> =
    mongoose.models.SaleEntry || mongoose.model<ISaleEntry>('SaleEntry', SaleEntrySchema);
