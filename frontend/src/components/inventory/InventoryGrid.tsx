import { PackageOpen, Plus } from 'lucide-react'
import type { InventoryItem } from '../../types/inventory'
import { InventoryCard } from './InventoryCard'

interface InventoryGridProps {
  items: InventoryItem[]
  onAdd: () => void
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

export function InventoryGrid({ items, onAdd, onEdit, onDelete }: InventoryGridProps) {
  if (items.length === 0) {
    return (
      <section className="state-panel" aria-labelledby="empty-state-title">
        <PackageOpen className="state-panel__icon" aria-hidden="true" />
        <h2 id="empty-state-title">No inventory items yet</h2>
        <p>Add your first product to start tracking stock.</p>
        <button className="button button--primary" type="button" onClick={onAdd}>
          <Plus aria-hidden="true" />
          Add Item
        </button>
      </section>
    )
  }

  return (
    <section className="inventory-grid" aria-label="Inventory items">
      {items.map((item) => (
        <InventoryCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </section>
  )
}
