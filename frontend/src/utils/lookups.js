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

/** Tiny visual key for the 4 bin colors. Same palette as the user's campus bins. */
export const BIN_KEY = [
  { category: CATEGORY.WET_ORGANIC,     color: '#16a34a', textColor: 'Green',  label: 'Wet waste',         hint: 'food scraps, peels, tea bags' },
  { category: CATEGORY.DRY_RECYCLABLE,  color: '#2563eb', textColor: 'Blue',   label: 'Dry recyclable',   hint: 'plastic, paper, cardboard, metal, glass' },
  { category: CATEGORY.HAZARDOUS_EWASTE,color: '#dc2626', textColor: 'Red',    label: 'Hazardous / E-waste', hint: 'batteries, bulbs, paint, electronics' },
  { category: CATEGORY.REJECT_OTHER,    color: '#111827', textColor: 'Black',  label: 'General / Reject', hint: 'multi-layer packaging, tissue, diapers' },
];
