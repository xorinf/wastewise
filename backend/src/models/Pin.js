import mongoose from 'mongoose';

export const PIN_KIND = ['hazard', 'broken_bin', 'no_signage', 'request_supplies', 'other'];
export const PIN_STATUS = ['open', 'resolved'];

const PinSchema = new mongoose.Schema(
  {
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    lat:      { type: Number, required: true },
    lng:      { type: Number, required: true },
    kind:     { type: String, enum: PIN_KIND, required: true },
    note:     { type: String, default: '', maxlength: 280 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:   { type: String, enum: PIN_STATUS, default: 'open' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PinSchema.index({ campusId: 1, status: 1 });
PinSchema.index({ campusId: 1, lat: 1, lng: 1 });

export default mongoose.model('Pin', PinSchema);
