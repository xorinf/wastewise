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
        // ponytail: coords optional - SVG map falls back to a readable list when absent.
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    ],
    // campusBounds = { north, south, east, west } in decimal degrees; null falls back to auto-fit.
    campusBounds: {
      north: { type: Number, default: null },
      south: { type: Number, default: null },
      east: { type: Number, default: null },
      west: { type: Number, default: null },
    },
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
