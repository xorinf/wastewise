/**
 * Static category meta, mirrored from the backend's utils/lookup.js.
 * Kept in sync by hand; PRD says "static lookup table" so this is the same
 * data on both sides.
 */
export const CATEGORY = {
  WET_ORGANIC: 'wet_organic',
  DRY_RECYCLABLE: 'dry_recyclable',
  HAZARDOUS_EWASTE: 'hazardous_ewaste',
  REJECT_OTHER: 'reject_other',
};

export const BIN = {
  [CATEGORY.WET_ORGANIC]:     { color: 'Green', label: 'Wet Waste' },
  [CATEGORY.DRY_RECYCLABLE]:  { color: 'Blue',  label: 'Dry Recyclables' },
  [CATEGORY.HAZARDOUS_EWASTE]:{ color: 'Red',   label: 'Hazardous / E-waste' },
  [CATEGORY.REJECT_OTHER]:    { color: 'Black', label: 'General / Reject' },
};

export function fillLabel(status) {
  return { full: 'Full', nearly_full: 'Nearly Full', overflowing: 'Overflowing' }[status] || status;
}
export function requestLabel(type) {
  return {
    pickup: 'Pickup needed',
    new_bin: 'New bin',
    bin_cover: 'Bin cover',
    bags_liners: 'Bags / liners',
  }[type] || type;
}
export function statusLabel(status) {
  return { pending: 'Pending', assigned: 'Assigned', resolved: 'Resolved' }[status] || status;
}
