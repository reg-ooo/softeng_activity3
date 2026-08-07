export const MAX_INVENTORY_IMAGE_SIZE = 10 * 1024 * 1024

export const INVENTORY_IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif'

const allowedImageMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

const allowedImageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif'])
const quantityPattern = /^[1-9]\d*$/
const pricePattern = /^(?:\d+(?:\.\d+)?|\.\d+)$/

export type InventoryScalarField = 'name' | 'description' | 'quantity' | 'price'

export type InventoryFormValues = Record<InventoryScalarField, string>

export type InventoryFieldErrors = Partial<Record<InventoryScalarField, string>>

export function validateInventoryField(field: InventoryScalarField, value: string): string | undefined {
  if (field === 'name') {
    return value.trim() ? undefined : 'Enter an item name.'
  }

  if (field === 'description') {
    return value.trim() ? undefined : 'Enter an item description.'
  }

  if (field === 'quantity') {
    return quantityPattern.test(value) ? undefined : 'Enter a positive whole number.'
  }

  const numericPrice = Number(value)
  return pricePattern.test(value) && Number.isFinite(numericPrice) && numericPrice > 0
    ? undefined
    : 'Enter a price greater than zero.'
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
