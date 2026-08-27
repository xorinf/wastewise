import mongoose from 'mongoose';

const CampusSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    bins: [
      {
        building: { type: String, required: true },
        floor: { type: String, required: true },
        binId: { type: String, required: true },
      },
    ],
    zoneStaff: [
      {
        building: { type: String, required: true },
        floor: { type: String, default: '' },
        staffUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Campus', CampusSchema);
