import mongoose from 'mongoose';

export const FILL_STATUS = ['full', 'nearly_full', 'overflowing'];
export const REQUEST_TYPES = ['pickup', 'new_bin', 'bin_cover', 'bags_liners'];

const PickupRequestSchema = new mongoose.Schema(
  {
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    building: { type: String, required: true },
    floor: { type: String, required: true },
    binId: { type: String, required: true },
    fillStatus: { type: String, enum: FILL_STATUS, required: true },
    requestType: { type: String, enum: REQUEST_TYPES, required: true },
    quantity: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['pending', 'assigned', 'resolved'], default: 'pending' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('PickupRequest', PickupRequestSchema);
