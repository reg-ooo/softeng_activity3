import {
  useEffect,
  useId,
  useState,
  type FormEvent,
} from 'react'
import { LoaderCircle } from 'lucide-react'
import { createInventory, updateInventory } from '../../lib/inventoryApi'
import {
  getLocalDateInputValue,
  INVENTORY_CATEGORIES,
  validateInventoryImage,
  validateInventoryValues,
  type InventoryFieldErrors,
  type InventoryFormValues,
  type InventoryScalarField,
} from '../../lib/inventoryValidation'
import type { InventoryItem } from '../../types/inventory'
import { Modal } from '../ui/Modal'
import {
  InventoryImageField,
  type InventoryImageState,
} from './InventoryImageField'

type InventoryItemFormModalProps = {
  mode: 'create' | 'edit'
  item?: InventoryItem
  open: boolean
  onClose: () => void
  onSaved: (item: InventoryItem) => void
}

const emptyValues: InventoryFormValues = {
  name: '',
  description: '',
  quantity: '',
  price: '',
  category: '',
  expectedDeliveryDate: '',
}

const scalarFields: InventoryScalarField[] = [
  'name',
  'description',
  'quantity',
  'price',
  'category',
  'expectedDeliveryDate',
]
const saveErrorMessage = 'We couldn\'t save this item. Please try again.'
const quantityInputPattern = /^(?:|0|[1-9]\d*)$/
const priceInputPattern = /^(?:|0?(?:\.\d*)?|[1-9]\d*(?:\.\d*)?)$/

export function InventoryItemFormModal({
  mode,
  item,
  open,
  onClose,
  onSaved,
}: InventoryItemFormModalProps) {
  const [values, setValues] = useState<InventoryFormValues>(emptyValues)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageState, setImageState] = useState<InventoryImageState>('none')
  const [fieldErrors, setFieldErrors] = useState<InventoryFieldErrors>({})
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fieldIdPrefix = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const hasCurrentImage = mode === 'edit' && Boolean(item?.imagePath?.trim())
    setImageFile(null)
    setImageState(hasCurrentImage ? 'keep' : 'none')
    setValues(
      mode === 'edit' && item
        ? {
            name: item.name,
            description: item.description,
            quantity: String(item.quantity),
            price: String(item.price),
            category: item.category,
            expectedDeliveryDate: item.expectedDeliveryDate,
          }
        : emptyValues,
    )
    setFieldErrors({})
    setFileError(null)
    setSubmitError(null)
    setIsSubmitting(false)
  }, [item, mode, open])

  const isCreateMode = mode === 'create'
  const title = isCreateMode ? 'Add Item' : 'Edit Item'
  const helperCopy = isCreateMode
    ? 'Enter the details for the new inventory item.'
    : 'Update the details for this inventory item.'
  const minDeliveryDate = getLocalDateInputValue()
  const hasKnownErrors = Object.values(fieldErrors).some(Boolean) || Boolean(fileError)

  function setFieldValue(field: InventoryScalarField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setSubmitError(null)

    setFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
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
    setFieldErrors(nextErrors)
    setFileError(nextFileError ?? null)
    setSubmitError(null)

    if (scalarFields.some((field) => nextErrors[field])) {
      return
    }

    if (nextFileError) {
      return
    }

    if (!isCreateMode && !item) {
      setSubmitError(saveErrorMessage)
      return
    }

    const formData = new FormData()
    formData.append('name', values.name.trim())
    formData.append('description', values.description.trim())
    formData.append('quantity', values.quantity)
    formData.append('price', values.price)
    formData.append('category', values.category)
    formData.append('expectedDeliveryDate', values.expectedDeliveryDate)
    if (isCreateMode && imageFile) {
      formData.append('image', imageFile)
    }

    if (!isCreateMode && item) {
      if (imageState === 'keep') {
        formData.append('imagePath', item.imagePath ?? '')
        formData.append('deletedImage', 'false')
      } else if (imageState === 'replace') {
        formData.append('imagePath', '')
        formData.append('deletedImage', 'false')
        if (imageFile) {
          formData.append('image', imageFile)
        }
      } else if (imageState === 'remove') {
        formData.append('deletedImage', 'true')
      } else {
        formData.append('imagePath', '')
        formData.append('deletedImage', 'false')
      }
    }

    setIsSubmitting(true)
    try {
      const savedItem = isCreateMode
        ? await createInventory(formData)
        : await updateInventory(item!.id, formData)
      onSaved(savedItem)
    } catch {
      setSubmitError(saveErrorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  function renderError(field: InventoryScalarField) {
    const error = fieldErrors[field]
    return error ? <p className="inventory-form__error">{error}</p> : null
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={requestClose}
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
      closeDisabled={isSubmitting}
      className="inventory-form-modal"
    >
      <p className="inventory-form__description">
        {helperCopy}
      </p>

      <form className="inventory-form" onSubmit={handleSubmit} noValidate>
        <div className="inventory-form__body">
          <div className="form-field">
            <label htmlFor={`${fieldIdPrefix}-name`}>
              Name <span>*</span>
            </label>
            <input
              id={`${fieldIdPrefix}-name`}
              type="text"
              className={fieldErrors.name ? 'field-invalid' : undefined}
              value={values.name}
              onChange={(event) => setFieldValue('name', event.target.value)}
              placeholder="Enter item name"
              required
              disabled={isSubmitting}
            />
            {renderError('name')}
          </div>

          <div className="form-field">
            <label htmlFor={`${fieldIdPrefix}-description`}>
              Description <span>*</span>
            </label>
            <textarea
              id={`${fieldIdPrefix}-description`}
              value={values.description}
              className={fieldErrors.description ? 'field-invalid' : undefined}
              onChange={(event) => setFieldValue('description', event.target.value)}
              placeholder="Enter item description"
              rows={3}
              required
              disabled={isSubmitting}
            />
            {renderError('description')}
          </div>

          <div className="inventory-form__details-row">
            <div className="form-field">
              <label htmlFor={`${fieldIdPrefix}-category`}>
                Category <span>*</span>
              </label>
              <select
                id={`${fieldIdPrefix}-category`}
                className={fieldErrors.category ? 'field-invalid' : undefined}
                value={values.category}
                onChange={(event) => setFieldValue('category', event.target.value)}
                required
                disabled={isSubmitting}
              >
                <option value="">Select a category</option>
                {INVENTORY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {renderError('category')}
            </div>

            <div className="form-field">
              <label htmlFor={`${fieldIdPrefix}-expected-delivery-date`}>
                Expected delivery date <span>*</span>
              </label>
              <input
                id={`${fieldIdPrefix}-expected-delivery-date`}
                type="date"
                className={fieldErrors.expectedDeliveryDate ? 'field-invalid' : undefined}
                value={values.expectedDeliveryDate}
                min={minDeliveryDate}
                onChange={(event) => setFieldValue('expectedDeliveryDate', event.target.value)}
                required
                disabled={isSubmitting}
              />
              {renderError('expectedDeliveryDate')}
            </div>
          </div>

          <div className="inventory-form__number-row">
            <div className="form-field">
              <label htmlFor={`${fieldIdPrefix}-quantity`}>
                Quantity <span>*</span>
              </label>
              <input
                id={`${fieldIdPrefix}-quantity`}
                type="number"
                inputMode="numeric"
                value={values.quantity}
                className={fieldErrors.quantity ? 'field-invalid' : undefined}
                onChange={(event) => {
                  if (quantityInputPattern.test(event.target.value)) {
                    setFieldValue('quantity', event.target.value)
                  }
                }}
                placeholder="0"
                required
                disabled={isSubmitting}
              />
              {renderError('quantity')}
            </div>

            <div className="form-field">
              <label htmlFor={`${fieldIdPrefix}-price`}>
                Price <span>*</span>
              </label>
              <div className={`price-input${fieldErrors.price ? ' price-input--invalid' : ''}`}>
                <span className="price-input__prefix">₱</span>
                <input
                  id={`${fieldIdPrefix}-price`}
                  type="number"
                  inputMode="decimal"
                  value={values.price}
                  onChange={(event) => {
                    if (priceInputPattern.test(event.target.value)) {
                      setFieldValue('price', event.target.value)
                    }
                  }}
                  placeholder="0.00"
                  required
                  disabled={isSubmitting}
                />
              </div>
              {renderError('price')}
            </div>
          </div>

          <InventoryImageField
            mode={mode}
            state={imageState}
            file={imageFile}
            currentImagePath={mode === 'edit' ? item?.imagePath : null}
            error={fileError}
            disabled={isSubmitting}
            itemName={values.name}
            onSelectionChange={(nextState, nextFile) => {
              setImageState(nextState)
              setImageFile(nextFile)
              setSubmitError(null)
            }}
            onErrorChange={(nextError) => {
              setFileError(nextError)
              setSubmitError(null)
            }}
          />

          {submitError ? <p className="inventory-form__submit-error">{submitError}</p> : null}
        </div>

        <div className="inventory-form__footer">
          <button className="button button--secondary" type="button" onClick={requestClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="button button--primary inventory-form__submit" type="submit" disabled={hasKnownErrors || isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle />
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
