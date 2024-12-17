import { Schema, model, Types } from 'mongoose';
import { ITrainer } from '../interface/trainer_interface';

const trainerSchema = new Schema<ITrainer>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: Number, required: true },
  password: { type: String, required: true },
  specializations: [{ type: Schema.Types.ObjectId, ref: 'Specialization' }],
  dob: { type: String, required: false },
  profileImage: { type: String, required: false },
  gender: { type: String, enum: ['male', 'female', 'other', ''], required: false },
  yearsOfExperience: { type: Number, required: false }, 
  language: { type: String, required: false },
  about: { type: String, required: false },
  dailySessionLimit: { type: Number, default: 5 },
  kycStatus: { type: String, enum: ['pending', 'approved', 'submitted', 'rejected'], default: 'pending' },
  isBlocked: { type: Boolean, default: false },
}, { timestamps: true });

const TrainerModel = model<ITrainer>('Trainer', trainerSchema);  
export default TrainerModel;
