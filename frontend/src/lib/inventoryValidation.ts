import { INVENTORY_CATEGORIES } from './inventoryConstants'

export { INVENTORY_CATEGORIES } from './inventoryConstants'

export const MAX_INVENTORY_IMAGE_SIZE = 10 * 1024 * 1024

export const INVENTORY_IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif'

const allowedImageMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

const allowedImageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])
const quantityPattern = /^(?:0|[1-9]\d*)$/
const pricePattern = /^(?:[1-9]\d*(?:\.\d+)?|0?\.\d+)$/
const deliveryDatePattern = /^\d{4}-\d{2}-\d{2}$/

const inventoryCategorySet = new Set<string>(INVENTORY_CATEGORIES)

export type InventoryScalarField =
  | 'name'
  | 'description'
  | 'quantity'
  | 'price'
  | 'category'
  | 'expectedDeliveryDate'

export type InventoryFormValues = Record<InventoryScalarField, string>

export type InventoryFieldErrors = Partial<Record<InventoryScalarField, string>>

export function getLocalDateInputValue(date = new Date()): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isValidCalendarDate(value: string): boolean {
  if (!deliveryDatePattern.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  if (month < 1 || month > 12 || day < 1) {
    return false
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  return day <= daysInMonth
}

export function isValidInventoryDeliveryDate(
  value: string,
  today = getLocalDateInputValue(),
): boolean {
  return isValidCalendarDate(value) && value >= today
}

export function validateInventoryField(field: InventoryScalarField, value: string): string | undefined {
  if (field === 'name') {
    return value.trim() ? undefined : 'Enter an item name.'
  }

  if (field === 'description') {
    return value.trim() ? undefined : 'Enter an item description.'
  }

  if (field === 'quantity') {
    return quantityPattern.test(value) ? undefined : 'Enter a whole number zero or greater.'
  }

  if (field === 'price') {
    const numericPrice = Number(value)
    return pricePattern.test(value) && Number.isFinite(numericPrice) && numericPrice > 0
      ? undefined
      : 'Enter a price greater than zero.'
  }

  if (field === 'category') {
    return inventoryCategorySet.has(value) ? undefined : 'Select a category.'
  }

  return isValidInventoryDeliveryDate(value)
    ? undefined
    : 'Choose a delivery date that is today or later.'
}

export function validateInventoryValues(values: InventoryFormValues): InventoryFieldErrors {
  const errors: InventoryFieldErrors = {}

  for (const field of Object.keys(values) as InventoryScalarField[]) {
    const error = validateInventoryField(field, values[field])
    if (error) {
      errors[field] = error
    }
  }

  return errors
}

export function validateInventoryImage(file: File): string | undefined {
  if (file.size > MAX_INVENTORY_IMAGE_SIZE) {
    return 'Choose an image that is 10 MB or smaller.'
  }

  const normalizedType = file.type.toLowerCase()
  const hasAllowedMimeType = allowedImageMimeTypes.has(normalizedType)
  const canUseExtensionFallback = normalizedType === '' || normalizedType === 'application/octet-stream'
  const extension = file.name.toLowerCase().match(/\.([^.]+)$/)?.[1] ?? ''

  if (!hasAllowedMimeType && !(canUseExtensionFallback && allowedImageExtensions.has(extension))) {
    return 'Choose a PNG, JPG, JPEG, WEBP, or GIF image.'
  }

  return undefined
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kilobytes = bytes / 1024
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(kilobytes >= 10 ? 0 : 1)} KB`
  }

  const megabytes = kilobytes / 1024
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`
}
