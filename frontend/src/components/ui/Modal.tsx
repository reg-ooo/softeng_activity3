import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  children?: ReactNode
  onClose: () => void
  initialFocusRef?: RefObject<HTMLElement | null>
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  describedBy?: string
  className?: string
  busy?: boolean
  closeDisabled?: boolean
  returnFocusRef?: RefObject<HTMLElement | null>
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function restoreFocus(returnFocusRef: RefObject<HTMLElement | null> | undefined, fallback: HTMLElement | null) {
  ;(returnFocusRef?.current ?? fallback)?.focus()
}

export function Modal({
  open,
  title,
  children,
  onClose,
  initialFocusRef,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  describedBy,
  className,
  busy = false,
  closeDisabled = false,
  returnFocusRef,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const closeOnEscapeRef = useRef(closeOnEscape)
  const closeDisabledRef = useRef(closeDisabled)
  onCloseRef.current = onClose
  closeOnEscapeRef.current = closeOnEscape
  closeDisabledRef.current = closeDisabled

  useEffect(() => {
    if (!open) {
      return
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const dialog = dialogRef.current
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      const firstFocusable = dialog?.querySelector<HTMLElement>(focusableSelector)
      ;(initialFocusRef?.current ?? firstFocusable ?? dialog)?.focus()
    })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && closeOnEscapeRef.current && !closeDisabledRef.current) {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialog) {
        return
      }

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement

      if (!dialog.contains(activeElement)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      restoreFocus(returnFocusRef, previouslyFocused)
    }
  }, [initialFocusRef, open, returnFocusRef])

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-busy={busy || undefined}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 id={titleId}>{title}</h2>
          {showCloseButton ? (
            <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog" disabled={closeDisabled}>
              <X aria-hidden="true" />
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
