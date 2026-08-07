import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from 'react'
import { ImageUp, RefreshCw, Trash2 } from 'lucide-react'
import {
  INVENTORY_IMAGE_ACCEPT,
  formatFileSize,
  validateInventoryImage,
} from '../../lib/inventoryValidation'

type InventoryImageFieldProps = {
  file: File | null
  error: string | null
  disabled: boolean
  itemName: string
  controlRef?: RefObject<HTMLButtonElement | null>
  onFileChange: (file: File | null) => void
  onErrorChange: (error: string | null) => void
}

export function InventoryImageField({
  file,
  error,
  disabled,
  itemName,
  controlRef,
  onFileChange,
  onErrorChange,
}: InventoryImageFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()
  const fileErrorId = useId()

  useLayoutEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(nextPreviewUrl)
    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [file])

  useEffect(() => {
    if (disabled) {
      setIsDragging(false)
    }
  }, [disabled])

  function assignControlRef(node: HTMLButtonElement | null) {
    if (controlRef) {
      controlRef.current = node
    }
  }

  function openFilePicker() {
    if (!fileInputRef.current || disabled) {
      return
    }

    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  function selectFile(nextFile: File) {
    const validationError = validateInventoryImage(nextFile)
    if (validationError) {
      onErrorChange(validationError)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    onFileChange(nextFile)
    onErrorChange(null)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0]
    if (nextFile) {
      selectFile(nextFile)
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) {
      return
    }

    const nextFile = event.dataTransfer.files[0]
    if (nextFile) {
      selectFile(nextFile)
    }
  }

  function removeFile() {
    onFileChange(null)
    onErrorChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="inventory-image-field">
      <div className="inventory-image-field__label">
        <label htmlFor={fileInputId}>Product image</label>
        <span>Optional</span>
      </div>
      <input
        className="visually-hidden-file-input"
        id={fileInputId}
        ref={fileInputRef}
        type="file"
        tabIndex={-1}
        accept={INVENTORY_IMAGE_ACCEPT}
        onClick={(event) => {
          event.currentTarget.value = ''
        }}
        onChange={handleFileChange}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? fileErrorId : undefined}
      />
      <button
        className={`inventory-image-dropzone${isDragging ? ' inventory-image-dropzone--dragging' : ''}`}
        ref={assignControlRef}
        type="button"
        onClick={openFilePicker}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) {
            setIsDragging(true)
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false)
          }
        }}
        onDrop={handleDrop}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? fileErrorId : undefined}
      >
        <ImageUp aria-hidden="true" />
        <span>Choose an image or drag and drop</span>
        <small>PNG, JPG, WEBP or GIF up to 10MB</small>
      </button>
      {error ? (
        <div className="inventory-image-field__error-row">
          <p className="inventory-form__error" id={fileErrorId}>
            {error}
          </p>
          <button type="button" onClick={() => onErrorChange(null)} disabled={disabled} aria-label="Dismiss image error">
            Dismiss
          </button>
        </div>
      ) : null}

      {file && previewUrl ? (
        <div className="inventory-image-selection">
          <img src={previewUrl} alt={`Preview of ${itemName.trim() || file.name}`} />
          <div className="inventory-image-selection__details">
            <span title={file.name}>{file.name}</span>
            <small>{formatFileSize(file.size)}</small>
          </div>
          <div className="inventory-image-selection__actions">
            <button type="button" onClick={openFilePicker} disabled={disabled}>
              <RefreshCw aria-hidden="true" />
              Replace
            </button>
            <button className="inventory-image-selection__remove" type="button" onClick={removeFile} disabled={disabled}>
              <Trash2 aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
