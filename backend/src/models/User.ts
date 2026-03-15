import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  password?: string;
  role: 'admin' | 'user';
  modules: string[];
  adminId?: string;
  createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: false },
    password: { type: String, required: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    modules: [{ type: String }],
    adminId: { type: String, required: false },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

