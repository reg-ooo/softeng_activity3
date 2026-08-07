import { useId, useRef, type RefObject } from 'react'
import { LoaderCircle, Trash2 } from 'lucide-react'
import type { InventoryItem } from '../../types/inventory'
import { Modal } from '../ui/Modal'

type DeleteConfirmationModalProps = {
  item: InventoryItem | null
  deleting: boolean
  error: string | null
  triggerRef?: RefObject<HTMLElement | null>
  onCancel: () => void
  onConfirm: (item: InventoryItem) => void | Promise<void>
}

export function DeleteConfirmationModal({
  item,
  deleting,
  error,
  triggerRef,
  onCancel,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const descriptionId = useId()

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
      describedBy={descriptionId}
      closeOnBackdrop={!deleting}
      closeOnEscape={!deleting}
      showCloseButton={false}
      closeDisabled={deleting}
      busy={deleting}
      className="delete-confirmation-modal"
      returnFocusRef={triggerRef}
      initialFocusRef={cancelButtonRef}
    >
      <div className="delete-confirmation-modal__body">
        <div className="delete-confirmation-modal__icon" aria-hidden="true">
          <Trash2 />
        </div>
        <h2>Delete item?</h2>
        {item ? (
          <p className="delete-confirmation-modal__description" id={descriptionId}>
            Are you sure you want to delete “{item.name}”? This item will be removed from active inventory.
          </p>
        ) : null}
        {error ? (
          <p className="delete-confirmation-modal__error" role="alert" aria-live="assertive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="delete-confirmation-modal__footer">
        <button
          ref={cancelButtonRef}
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
              <LoaderCircle className="delete-confirmation-modal__spinner" aria-hidden="true" />
              Deleting item…
            </>
          ) : (
            <>
              <Trash2 aria-hidden="true" />
              Delete Item
            </>
          )}
        </button>
      </div>
    </Modal>
  )
}
