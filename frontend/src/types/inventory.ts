export interface InventoryItem {
  id: number
  name: string
  description: string
  quantity: number
  price: number | string
  imagePath: string | null
  deleted?: boolean
}
