import { ImageOff, PackageOpen, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { getInventoryImageUrl } from '../../lib/inventoryApi'
import type { InventoryItem } from '../../types/inventory'

interface InventoryGridProps {
  items: InventoryItem[]
  onAdd: () => void
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

export function InventoryGrid({ items, onAdd, onEdit, onDelete }: InventoryGridProps) {
  if (items.length === 0) {
    return (
      <section className="state-panel">
        <PackageOpen className="state-panel__icon" />
        <h2>No inventory items yet</h2>
        <p>Add your first product to start tracking stock.</p>
        <button className="button button--primary" type="button" onClick={onAdd}>
          <Plus />
          Add Item
        </button>
      </section>
    )
  }

  return (
    <section className="inventory-table-panel" aria-label="Inventory items">
      <div className="inventory-table-scroll">
        <table className="inventory-table" aria-label="Inventory items">
          <colgroup>
            <col className="inventory-table__column-product" />
            <col className="inventory-table__column-description" />
            <col className="inventory-table__column-price" />
            <col className="inventory-table__column-quantity" />
            <col className="inventory-table__column-actions" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Description</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <InventoryTableRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatPrice(price: InventoryItem['price']): string {
  const numericPrice = typeof price === 'number' ? price : Number(price)
  return Number.isFinite(numericPrice) ? pesoFormatter.format(numericPrice) : 'Price unavailable'
}

interface InventoryTableRowProps {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

function InventoryTableRow({ item, onEdit, onDelete }: InventoryTableRowProps) {
  const imageUrl = getInventoryImageUrl(item.imagePath)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const hasImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <tr>
      <td>
        <div className="inventory-table__product">
          <div className="inventory-table__image-frame">
            {hasImage ? (
              <img
                className="inventory-table__image"
                src={imageUrl ?? undefined}
                alt={`${item.name} product image`}
                loading="lazy"
                onError={() => setFailedImageUrl(imageUrl)}
              />
            ) : (
              <div className="inventory-table__image-placeholder" role="img" aria-label="No product image">
                <ImageOff aria-hidden="true" />
              </div>
            )}
          </div>
          <span className="inventory-table__name">{item.name}</span>
        </div>
      </td>
      <td>
        <span className="inventory-table__description" title={item.description}>
          {item.description}
        </span>
      </td>
      <td>
        <span className="inventory-table__price">{formatPrice(item.price)}</span>
      </td>
      <td>
        <span className="inventory-table__quantity">{item.quantity} in stock</span>
      </td>
      <td>
        <div className="inventory-table__actions">
          <button
            className="button button--secondary"
            type="button"
            data-inventory-action="edit"
            data-inventory-item-id={item.id}
            onClick={() => onEdit(item)}
          >
            <Pencil aria-hidden="true" />
            Edit
          </button>
          <button
            className="button button--danger"
            type="button"
            data-inventory-action="delete"
            data-inventory-item-id={item.id}
            onClick={() => onDelete(item)}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}
