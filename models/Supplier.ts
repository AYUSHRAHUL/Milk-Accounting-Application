import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISupplier extends Document {
    userId: string;
    name: string;
    phone: string;
    address: string;
    animalType: string[]; // Now an array of strings for multi-select
    bankDetails?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema: Schema = new Schema(
    {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        animalType: [{ type: String, required: true, enum: ['Cow', 'Buffalo', 'Goat', 'Other'] }],
        bankDetails: { type: String, required: false },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

export const Supplier: Model<ISupplier> =
    mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
