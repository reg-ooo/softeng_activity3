import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { ImageUp, RefreshCw, Trash2 } from 'lucide-react'
import {
  INVENTORY_IMAGE_ACCEPT,
  formatFileSize,
  validateInventoryImage,
} from '../../lib/inventoryValidation'
import { getInventoryImageUrl } from '../../lib/inventoryApi'

export type InventoryImageState = 'keep' | 'replace' | 'remove' | 'none'

type InventoryImageFieldProps = {
  mode: 'create' | 'edit'
  state: InventoryImageState
  file: File | null
  currentImagePath?: string | null
  error: string | null
  disabled: boolean
  itemName: string
  onSelectionChange: (state: InventoryImageState, file: File | null) => void
  onErrorChange: (error: string | null) => void
}

function getImageFileName(imagePath: string): string | null {
  let pathWithoutQuery = imagePath.split(/[?#]/, 1)[0]

  try {
    pathWithoutQuery = new URL(imagePath).pathname
  } catch {
    // Relative upload paths are expected from the current API contract.
  }

  const encodedFileName = pathWithoutQuery.split(/[\\/]/).filter(Boolean).at(-1)
  if (!encodedFileName) {
    return null
  }

  try {
    return decodeURIComponent(encodedFileName)
  } catch {
    return encodedFileName
  }
}

export function InventoryImageField({
  mode,
  state,
  file,
  currentImagePath,
  error,
  disabled,
  itemName,
  onSelectionChange,
  onErrorChange,
}: InventoryImageFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [failedCurrentImageUrl, setFailedCurrentImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()
  const normalizedCurrentImagePath = currentImagePath?.trim() ?? ''
  const hasOriginalImage = mode === 'edit' && Boolean(normalizedCurrentImagePath)
  const currentImageUrl = hasOriginalImage
    ? getInventoryImageUrl(normalizedCurrentImagePath)
    : null
  const currentImageName = hasOriginalImage
    ? getImageFileName(normalizedCurrentImagePath)
    : null
  const showCurrentImage = state === 'keep' && hasOriginalImage
  const showReplacement = state === 'replace' && file && previewUrl
  const showDropzone = mode === 'create' || (!showCurrentImage && !showReplacement)

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

  useEffect(() => {
    setFailedCurrentImageUrl(null)
  }, [currentImageUrl])

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

    onSelectionChange('replace', nextFile)
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
    onSelectionChange(hasOriginalImage ? 'keep' : 'none', null)
    onErrorChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removeCurrentImage() {
    onSelectionChange('remove', null)
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
        className="inventory-file-input"
        id={fileInputId}
        ref={fileInputRef}
        type="file"
        accept={INVENTORY_IMAGE_ACCEPT}
        onClick={(event) => {
          event.currentTarget.value = ''
        }}
        onChange={handleFileChange}
        disabled={disabled}
      />
      {showDropzone ? (
        <button
          className={`inventory-image-dropzone${isDragging ? ' inventory-image-dropzone--dragging' : ''}${error ? ' inventory-image-dropzone--invalid' : ''}`}
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
        >
          <ImageUp />
          <span>Choose an image or drag and drop</span>
          <small>PNG, JPG, WEBP or GIF up to 10MB</small>
        </button>
      ) : null}
      {error ? (
        <div className="inventory-image-field__error-row">
          <p className="inventory-form__error">{error}</p>
          <button type="button" onClick={() => onErrorChange(null)} disabled={disabled}>
            Dismiss
          </button>
        </div>
      ) : null}

      {showCurrentImage ? (
        <div className="inventory-image-selection inventory-image-selection--current">
          {currentImageUrl && failedCurrentImageUrl !== currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={`Current image for ${itemName.trim() || 'inventory item'}`}
              onError={() => setFailedCurrentImageUrl(currentImageUrl)}
            />
          ) : (
            <div className="inventory-image-selection__placeholder">
              <ImageUp />
            </div>
          )}
          <div className="inventory-image-selection__details">
            <span title={currentImageName ?? undefined}>{currentImageName ?? 'Current image'}</span>
            {currentImageName ? <small>Current image</small> : null}
          </div>
          <div className="inventory-image-selection__actions">
            <button
              className="inventory-image-selection__replace"
              type="button"
              onClick={openFilePicker}
              disabled={disabled}
            >
              Replace image
            </button>
            <button
              className="inventory-image-selection__remove"
              type="button"
              onClick={removeCurrentImage}
              disabled={disabled}
            >
              Remove image
            </button>
          </div>
        </div>
      ) : null}

      {showReplacement ? (
        <div className="inventory-image-selection">
          <img src={previewUrl} alt={`Preview of ${itemName.trim() || file.name}`} />
          <div className="inventory-image-selection__details">
            <span title={file.name}>{file.name}</span>
            <small>{formatFileSize(file.size)}</small>
          </div>
          <div className="inventory-image-selection__actions">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={disabled}
            >
              <RefreshCw />
              Replace
            </button>
            <button
              className="inventory-image-selection__remove"
              type="button"
              onClick={removeFile}
              disabled={disabled}
            >
              <Trash2 />
              Remove
            </button>
          </div>
        </div>
      ) : null}

      {mode === 'edit' && hasOriginalImage ? (
        <p className="inventory-image-field__hint">
          Leave the current image unchanged, replace it, or remove it.
        </p>
      ) : null}
    </div>
  )
}
