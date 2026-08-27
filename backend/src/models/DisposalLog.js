import mongoose from 'mongoose';

export const CATEGORY = {
  WET_ORGANIC: 'wet_organic',
  DRY_RECYCLABLE: 'dry_recyclable',
  HAZARDOUS_EWASTE: 'hazardous_ewaste',
  REJECT_OTHER: 'reject_other',
};

const DisposalLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    itemName: { type: String, required: true },
    category: { type: String, enum: Object.values(CATEGORY), required: true },
    binColor: { type: String, required: true },
    pointsEarned: { type: Number, default: 10 },
    estimatedKg: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },
    source: { type: String, enum: ['upload', 'quick_select', 'custom'], required: true },
  },
  { timestamps: true }
);

const DisposalLog = mongoose.model('DisposalLog', DisposalLogSchema);
export default DisposalLog;
