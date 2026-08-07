import { useState } from 'react'
import { ImageOff, Pencil, Trash2 } from 'lucide-react'
import { getInventoryImageUrl } from '../../lib/inventoryApi'
import type { InventoryItem } from '../../types/inventory'

interface InventoryCardProps {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
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

export function InventoryCard({ item, onEdit, onDelete }: InventoryCardProps) {
  const imageUrl = getInventoryImageUrl(item.imagePath)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const hasImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <article className="inventory-card">
      <div className="inventory-card__media">
        {hasImage ? (
          <img
            className="inventory-card__image"
            src={imageUrl ?? undefined}
            alt={`${item.name} product image`}
            onError={() => setFailedImageUrl(imageUrl)}
          />
        ) : (
          <div className="inventory-card__image-placeholder" role="img" aria-label={`No image available for ${item.name}`}>
            <ImageOff aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="inventory-card__content">
        <div>
          <h2 className="inventory-card__name">{item.name}</h2>
          <p className="inventory-card__description" title={item.description}>
            {item.description}
          </p>
        </div>

        <div className="inventory-card__footer">
          <div className="inventory-card__summary">
            <span className="inventory-card__price">{formatPrice(item.price)}</span>
            <span className="inventory-card__stock">{item.quantity} in stock</span>
          </div>

          <div className="inventory-card__actions">
            <button className="button button--secondary" type="button" onClick={() => onEdit(item)}>
              <Pencil aria-hidden="true" />
              Edit
            </button>
            <button className="button button--danger" type="button" onClick={() => onDelete(item)}>
              <Trash2 aria-hidden="true" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
