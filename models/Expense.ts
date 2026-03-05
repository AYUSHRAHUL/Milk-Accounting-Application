import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExpense extends Document {
    userId: string;
    date: string;
    category: string;
    description: string;
    amount: number;
    paymentMode: string;
    createdAt: Date;
}

const ExpenseSchema: Schema = new Schema(
    {
        userId: { type: String, required: true },
        date: { type: String, required: true },
        category: { type: String, required: true, enum: ['Feed', 'Transport', 'Maintenance', 'Salary', 'Supplies', 'Other'] },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        paymentMode: { type: String, required: true, enum: ['Cash', 'UPI', 'Credit', 'Bank Transfer'] },
    },
    {
        timestamps: true,
    }
);

export const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
