import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  children?: ReactNode
  onClose: () => void
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  closeDisabled?: boolean
}

export function Modal({
  open,
  title,
  children,
  onClose,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  closeDisabled = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && closeOnEscape && !closeDisabled) {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [closeDisabled, closeOnEscape, onClose, open])

  if (!open) {
    return null
  }

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (!closeDisabled && closeOnBackdrop && event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={className ? `modal ${className}` : 'modal'}
      >
        <div className="modal__header">
          <h2>{title}</h2>
          {showCloseButton ? (
            <button className="icon-button" type="button" onClick={onClose} disabled={closeDisabled}>
              <X />
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
