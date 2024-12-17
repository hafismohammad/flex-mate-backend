import { Schema, model } from 'mongoose';
import { ISpecialization } from '../interface/admin_interface';

const specializationSchema = new Schema<ISpecialization>({
  
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isListed: { type: Boolean, default: true },
});

const SpecializationModel = model<ISpecialization>('Specialization', specializationSchema);
export default SpecializationModel;
