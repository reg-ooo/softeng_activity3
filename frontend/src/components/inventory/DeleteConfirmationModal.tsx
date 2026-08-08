import { LoaderCircle, Trash2 } from 'lucide-react'
import type { InventoryItem } from '../../types/inventory'
import { Modal } from '../ui/Modal'

type DeleteConfirmationModalProps = {
  item: InventoryItem | null
  deleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: (item: InventoryItem) => void | Promise<void>
}

export function DeleteConfirmationModal({
  item,
  deleting,
  error,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  function requestClose() {
    if (!deleting) {
      onCancel()
    }
  }

  async function confirmDeletion() {
    if (!item || deleting) {
      return
    }

    await onConfirm(item)
  }

  return (
    <Modal
      open={Boolean(item)}
      title="Delete item?"
      onClose={requestClose}
      closeOnBackdrop={!deleting}
      closeOnEscape={!deleting}
      showCloseButton={false}
      closeDisabled={deleting}
      className="delete-confirmation-modal"
    >
      <div className="delete-confirmation-modal__body">
        <div className="delete-confirmation-modal__icon">
          <Trash2 />
        </div>
        {item ? (
          <p className="delete-confirmation-modal__description">
            Are you sure you want to delete “{item.name}”? This item will be removed from active inventory.
          </p>
        ) : null}
        {error ? (
          <p className="delete-confirmation-modal__error">{error}</p>
        ) : null}
      </div>

      <div className="delete-confirmation-modal__footer">
        <button
          className="button button--secondary"
          type="button"
          onClick={requestClose}
          disabled={deleting}
        >
          Cancel
        </button>
        <button
          className="button button--danger-solid delete-confirmation-modal__confirm"
          type="button"
          onClick={confirmDeletion}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <LoaderCircle />
              Deleting item…
            </>
          ) : (
            <>
              <Trash2 />
              Delete Item
            </>
          )}
        </button>
      </div>
    </Modal>
  )
}
