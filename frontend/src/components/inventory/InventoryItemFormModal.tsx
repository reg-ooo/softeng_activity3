import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type RefObject,
} from 'react'
import { ImageUp, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react'
import { createInventory } from '../../lib/inventoryApi'
import {
  INVENTORY_IMAGE_ACCEPT,
  formatFileSize,
  validateInventoryField,
  validateInventoryImage,
  validateInventoryValues,
  type InventoryFieldErrors,
  type InventoryFormValues,
  type InventoryScalarField,
} from '../../lib/inventoryValidation'
import type { InventoryItem } from '../../types/inventory'
import { Modal } from '../ui/Modal'

type InventoryItemFormModalProps = {
  mode: 'create' | 'edit'
  item?: InventoryItem
  open: boolean
  triggerRef?: RefObject<HTMLElement | null>
  onClose: () => void
  onSaved: (item: InventoryItem) => void
}

type TouchedFields = Record<InventoryScalarField, boolean>

const emptyValues: InventoryFormValues = {
  name: '',
  description: '',
  quantity: '',
  price: '',
}

const untouchedFields: TouchedFields = {
  name: false,
  description: false,
  quantity: false,
  price: false,
}

const scalarFields: InventoryScalarField[] = ['name', 'description', 'quantity', 'price']
const saveErrorMessage = 'We couldn\'t save this item. Please try again.'

export function InventoryItemFormModal({
  mode,
  item,
  open,
  triggerRef,
  onClose,
  onSaved,
}: InventoryItemFormModalProps) {
  const [values, setValues] = useState<InventoryFormValues>(emptyValues)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [touched, setTouched] = useState<TouchedFields>(untouchedFields)
  const [fieldErrors, setFieldErrors] = useState<InventoryFieldErrors>({})
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const previewUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLButtonElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const fieldRefs = useRef<Record<InventoryScalarField, HTMLInputElement | HTMLTextAreaElement | null>>({
    name: null,
    description: null,
    quantity: null,
    price: null,
  })
  const descriptionId = useId()
  const fieldIdPrefix = useId()
  const fileInputId = useId()
  const fileErrorId = useId()
  const submitErrorId = useId()

  function revokePreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }

  useEffect(() => {
    if (!open) {
      revokePreviewUrl()
      return
    }

    revokePreviewUrl()
    setPreviewUrl(null)
    setImageFile(null)
    setValues(
      mode === 'edit' && item
        ? {
            name: item.name,
            description: item.description,
            quantity: String(item.quantity),
            price: String(item.price),
          }
        : emptyValues,
    )
    setTouched(untouchedFields)
    setFieldErrors({})
    setFileError(null)
    setSubmitError(null)
    setIsSubmitting(false)
    setIsDragging(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [item, mode, open])

  useEffect(() => {
    return () => revokePreviewUrl()
  }, [])

  const isCreateMode = mode === 'create'
  const title = isCreateMode ? 'Add Item' : 'Edit Item'
  const helperCopy = isCreateMode
    ? 'Enter the details for the new inventory item.'
    : 'Update the details for this inventory item.'
  const hasKnownErrors = Object.values(fieldErrors).some(Boolean) || Boolean(fileError)

  function setFieldValue(field: InventoryScalarField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setSubmitError(null)

    if (touched[field]) {
      setFieldErrors((current) => ({
        ...current,
        [field]: validateInventoryField(field, value),
      }))
    }
  }

  function handleBlur(field: InventoryScalarField) {
    setTouched((current) => ({ ...current, [field]: true }))
    setFieldErrors((current) => ({
      ...current,
      [field]: validateInventoryField(field, values[field]),
    }))
  }

  function openFilePicker() {
    if (!fileInputRef.current || isSubmitting) {
      return
    }

    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  function selectImage(file: File) {
    const error = validateInventoryImage(file)
    setSubmitError(null)

    if (error) {
      setFileError(error)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    revokePreviewUrl()
    const nextPreviewUrl = URL.createObjectURL(file)
    previewUrlRef.current = nextPreviewUrl
    setPreviewUrl(nextPreviewUrl)
    setImageFile(file)
    setFileError(null)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      selectImage(file)
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (isSubmitting) {
      return
    }

    const file = event.dataTransfer.files[0]
    if (file) {
      selectImage(file)
    }
  }

  function removeImage() {
    revokePreviewUrl()
    setPreviewUrl(null)
    setImageFile(null)
    setFileError(null)
    setSubmitError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function requestClose() {
    if (!isSubmitting) {
      onClose()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    const nextErrors = validateInventoryValues(values)
    const nextFileError = imageFile ? validateInventoryImage(imageFile) : fileError ?? undefined
    setTouched({ name: true, description: true, quantity: true, price: true })
    setFieldErrors(nextErrors)
    setFileError(nextFileError ?? null)
    setSubmitError(null)

    const firstInvalidField = scalarFields.find((field) => nextErrors[field])
    if (firstInvalidField) {
      fieldRefs.current[firstInvalidField]?.focus()
      return
    }

    if (nextFileError) {
      dropzoneRef.current?.focus()
      return
    }

    if (!isCreateMode) {
      setSubmitError('Editing is not available yet.')
      return
    }

    const formData = new FormData()
    formData.append('name', values.name.trim())
    formData.append('description', values.description.trim())
    formData.append('quantity', values.quantity)
    formData.append('price', values.price)
    if (imageFile) {
      formData.append('image', imageFile)
    }

    setIsSubmitting(true)
    try {
      const createdItem = await createInventory(formData)
      onSaved(createdItem)
    } catch {
      setSubmitError(saveErrorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderError(field: InventoryScalarField) {
    const error = fieldErrors[field]
    return error ? (
      <p className="inventory-form__error" id={`${fieldIdPrefix}-${field}-error`}>
        {error}
      </p>
    ) : null
  }

  function errorDescriptionId(field: InventoryScalarField) {
    return fieldErrors[field] ? `${fieldIdPrefix}-${field}-error` : undefined
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={requestClose}
      describedBy={descriptionId}
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
      closeDisabled={isSubmitting}
      busy={isSubmitting}
      className="inventory-form-modal"
      returnFocusRef={triggerRef}
      initialFocusRef={nameInputRef}
    >
      <p className="inventory-form__description" id={descriptionId}>
        {helperCopy}
      </p>

      <form className="inventory-form" onSubmit={handleSubmit} aria-busy={isSubmitting} noValidate>
        <div className="inventory-form__body">
          <div className="form-field">
            <label htmlFor={`${fieldIdPrefix}-name`}>
              Name <span aria-hidden="true">*</span>
            </label>
            <input
              id={`${fieldIdPrefix}-name`}
              ref={(node) => {
                nameInputRef.current = node
                fieldRefs.current.name = node
              }}
              type="text"
              value={values.name}
              onChange={(event) => setFieldValue('name', event.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Enter item name"
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={errorDescriptionId('name')}
            />
            {renderError('name')}
          </div>

          <div className="form-field">
            <label htmlFor={`${fieldIdPrefix}-description`}>
              Description <span aria-hidden="true">*</span>
            </label>
            <textarea
              id={`${fieldIdPrefix}-description`}
              ref={(node) => { fieldRefs.current.description = node }}
              value={values.description}
              onChange={(event) => setFieldValue('description', event.target.value)}
              onBlur={() => handleBlur('description')}
              placeholder="Enter item description"
              rows={3}
              required
              disabled={isSubmitting}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={errorDescriptionId('description')}
            />
            {renderError('description')}
          </div>

          <div className="inventory-form__number-row">
            <div className="form-field">
              <label htmlFor={`${fieldIdPrefix}-quantity`}>
                Quantity <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${fieldIdPrefix}-quantity`}
                ref={(node) => { fieldRefs.current.quantity = node }}
                type="text"
                inputMode="numeric"
                value={values.quantity}
                onChange={(event) => setFieldValue('quantity', event.target.value)}
                onBlur={() => handleBlur('quantity')}
                placeholder="0"
                required
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.quantity)}
                aria-describedby={errorDescriptionId('quantity')}
              />
              {renderError('quantity')}
            </div>

            <div className="form-field">
              <label htmlFor={`${fieldIdPrefix}-price`}>
                Price <span aria-hidden="true">*</span>
              </label>
              <div className={`price-input${fieldErrors.price ? ' price-input--invalid' : ''}`}>
                <span className="price-input__prefix" aria-hidden="true">₱</span>
                <input
                  id={`${fieldIdPrefix}-price`}
                  ref={(node) => { fieldRefs.current.price = node }}
                  type="text"
                  inputMode="decimal"
                  value={values.price}
                  onChange={(event) => setFieldValue('price', event.target.value)}
                  onBlur={() => handleBlur('price')}
                  placeholder="0.00"
                  required
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.price)}
                  aria-describedby={errorDescriptionId('price')}
                />
              </div>
              {renderError('price')}
            </div>
          </div>

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
              onChange={handleFileChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(fileError)}
              aria-describedby={fileError ? fileErrorId : undefined}
            />
            <button
              className={`inventory-image-dropzone${isDragging ? ' inventory-image-dropzone--dragging' : ''}`}
              ref={dropzoneRef}
              type="button"
              onClick={openFilePicker}
              onDragEnter={(event) => {
                event.preventDefault()
                if (!isSubmitting) setIsDragging(true)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false)
              }}
              onDrop={handleDrop}
              disabled={isSubmitting}
              aria-invalid={Boolean(fileError)}
              aria-describedby={fileError ? fileErrorId : undefined}
            >
              <ImageUp aria-hidden="true" />
              <span>Choose an image or drag and drop</span>
              <small>PNG, JPG, WEBP or GIF up to 10MB</small>
            </button>
            {fileError ? (
              <div className="inventory-image-field__error-row">
                <p className="inventory-form__error" id={fileErrorId}>
                  {fileError}
                </p>
                <button type="button" onClick={() => setFileError(null)} disabled={isSubmitting} aria-label="Dismiss image error">
                  Dismiss
                </button>
              </div>
            ) : null}

            {imageFile && previewUrl ? (
              <div className="inventory-image-selection">
                <img src={previewUrl} alt={`Preview of ${values.name.trim() || imageFile.name}`} />
                <div className="inventory-image-selection__details">
                  <span title={imageFile.name}>{imageFile.name}</span>
                  <small>{formatFileSize(imageFile.size)}</small>
                </div>
                <div className="inventory-image-selection__actions">
                  <button type="button" onClick={openFilePicker} disabled={isSubmitting}>
                    <RefreshCw aria-hidden="true" />
                    Replace
                  </button>
                  <button className="inventory-image-selection__remove" type="button" onClick={removeImage} disabled={isSubmitting}>
                    <Trash2 aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {submitError ? (
            <p className="inventory-form__submit-error" id={submitErrorId} role="alert" aria-live="assertive">
              {submitError}
            </p>
          ) : null}
        </div>

        <div className="inventory-form__footer">
          <button className="button button--secondary" type="button" onClick={requestClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="button button--primary inventory-form__submit" type="submit" disabled={hasKnownErrors || isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="inventory-form__spinner" aria-hidden="true" />
                Saving…
              </>
            ) : isCreateMode ? (
              'Save Item'
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
