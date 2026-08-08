export interface InventoryItem {
  id: number
  name: string
  description: string
  quantity: number
  price: number | string
  category: string
  expectedDeliveryDate: string | null
  imagePath: string | null
  deleted?: boolean
}
