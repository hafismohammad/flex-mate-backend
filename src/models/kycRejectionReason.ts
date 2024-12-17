import mongoose, { Schema, Document } from 'mongoose';

interface IKycRejectionReason extends Document {
  trainerId: string;
  reason: string;
  date: Date;
}

const KycRejectionReasonSchema: Schema = new Schema({
  trainerId: { type: String, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const KycRejectionReasonModel = mongoose.model<IKycRejectionReason>(
  'KycRejectionReason',
  KycRejectionReasonSchema
);

export default KycRejectionReasonModel;
