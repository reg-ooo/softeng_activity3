export const INVENTORY_CATEGORIES = [
  'Peripherals',
  'Tools',
  'Electronics',
  'Office Supplies',
  'Furniture',
  'Other',
] as const

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number]

export const ALL_CATEGORIES_LABEL = 'All categories'
