import { CATEGORY } from '../models/DisposalLog.js';

/**
 * Single source of truth for category-to-bin mapping, item lookup, and
 * "kg per item" used for the estimated kg diverted stat.
 */
export const BIN_TABLE = {
  [CATEGORY.WET_ORGANIC]:     { color: 'Green', label: 'Wet Waste',         reason: 'food scraps decompose naturally and become compost' },
  [CATEGORY.DRY_RECYCLABLE]:  { color: 'Blue',  label: 'Dry Recyclables',   reason: 'it is a clean recyclable that can be reprocessed' },
  [CATEGORY.HAZARDOUS_EWASTE]:{ color: 'Red',   label: 'Hazardous / E-waste', reason: 'it contains chemicals or metals that must be disposed of safely' },
  [CATEGORY.REJECT_OTHER]:    { color: 'Black', label: 'General / Reject',  reason: 'it does not belong in the recycling or organic streams' },
};

export const KG_PER_ITEM = {
  [CATEGORY.WET_ORGANIC]:      0.15,
  [CATEGORY.DRY_RECYCLABLE]:   0.05,
  [CATEGORY.HAZARDOUS_EWASTE]: 0.30,
  [CATEGORY.REJECT_OTHER]:     0.10,
};

export const QUICK_SELECT = [
  { name: 'Apple core',     category: CATEGORY.WET_ORGANIC },
  { name: 'Banana peel',    category: CATEGORY.WET_ORGANIC },
  { name: 'Tea bag',        category: CATEGORY.WET_ORGANIC },
  { name: 'Food scraps',    category: CATEGORY.WET_ORGANIC },
  { name: 'Plastic bottle', category: CATEGORY.DRY_RECYCLABLE },
  { name: 'Newspaper',      category: CATEGORY.DRY_RECYCLABLE },
  { name: 'Cardboard box',  category: CATEGORY.DRY_RECYCLABLE },
  { name: 'Aluminum can',   category: CATEGORY.DRY_RECYCLABLE },
  { name: 'Battery',        category: CATEGORY.HAZARDOUS_EWASTE },
  { name: 'Broken bulb',    category: CATEGORY.HAZARDOUS_EWASTE },
  { name: 'Used paint',     category: CATEGORY.HAZARDOUS_EWASTE },
  { name: 'Chip packet',    category: CATEGORY.REJECT_OTHER },
  { name: 'Tissue paper',   category: CATEGORY.REJECT_OTHER },
  { name: 'Diapers',        category: CATEGORY.REJECT_OTHER },
];

export function lookupByName(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  return QUICK_SELECT.find(i => i.name.toLowerCase() === key) || null;
}
export function binFor(category) { return BIN_TABLE[category] || null; }
export function kgFor(category) { return KG_PER_ITEM[category] ?? 0; }
