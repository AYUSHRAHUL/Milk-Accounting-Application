import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProductProduction extends Document {
  userId: string;
  date: Date;
  productName: string; // Ghee, Paneer, Curd, Butter, Khoa, etc.
  quantityProduced: number;
  unit: string;
  milkUsed: {
    wholeMilk: number;
    skimMilk: number;
    creamMilk: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductProductionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    productName: { type: String, required: true },
    quantityProduced: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    milkUsed: {
      wholeMilk: { type: Number, default: 0 },
      skimMilk: { type: Number, default: 0 },
      creamMilk: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const ProductProduction: Model<IProductProduction> =
  mongoose.models.ProductProduction || mongoose.model<IProductProduction>('ProductProduction', ProductProductionSchema);
