import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleAlert, Plus, RotateCw } from 'lucide-react'
import { DeleteConfirmationModal } from './components/inventory/DeleteConfirmationModal'
import { InventoryGrid } from './components/inventory/InventoryGrid'
import { InventoryItemFormModal } from './components/inventory/InventoryItemFormModal'
import { getApiErrorMessage, isApiRequestCanceled, listInventory, softDeleteInventory } from './lib/inventoryApi'
import type { InventoryItem } from './types/inventory'
import './App.css'

type ListState =
  | { status: 'loading' }
  | { status: 'success'; items: InventoryItem[] }
  | { status: 'error'; message: string }

type ModalMode = 'add' | 'edit' | 'delete'

const retrievalErrorMessage = 'We couldn\'t load your inventory. Please try again.'

function InventorySkeletons() {
  return (
    <section className="inventory-grid">
      {Array.from({ length: 8 }, (_, index) => (
        <div className="inventory-card inventory-card--skeleton" key={index}>
          <div className="skeleton skeleton--image" />
          <div className="inventory-card__content">
            <div>
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line skeleton--line-short" />
            </div>
            <div className="inventory-card__footer">
              <div className="skeleton skeleton--summary" />
              <div className="inventory-card__actions">
                <div className="skeleton skeleton--button" />
                <div className="skeleton skeleton--button" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}

function App() {
  const [listState, setListState] = useState<ListState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const listRequestRef = useRef<AbortController | null>(null)
  const deleteRequestRef = useRef(false)

  const abortActiveListRequest = useCallback(() => {
    listRequestRef.current?.abort()
    listRequestRef.current = null
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let isCurrentRequest = true
    listRequestRef.current = controller

    setListState((current) => (current.status === 'success' ? current : { status: 'loading' }))

    listInventory(controller.signal)
      .then((items) => {
        if (isCurrentRequest && !controller.signal.aborted) {
          setListState({ status: 'success', items })
        }
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest || controller.signal.aborted || isApiRequestCanceled(error)) {
          return
        }

        setListState((current) =>
          current.status === 'success'
            ? current
            : {
                status: 'error',
                message: getApiErrorMessage(error, retrievalErrorMessage),
              },
        )
      })

    return () => {
      isCurrentRequest = false
      controller.abort()
      if (listRequestRef.current === controller) {
        listRequestRef.current = null
      }
    }
  }, [reloadToken])

  const handleAdd = useCallback(() => {
    setSelectedItem(null)
    setEditingItem(null)
    setModalMode('add')
  }, [])

  const handleEdit = useCallback((item: InventoryItem) => {
    setSelectedItem(null)
    setEditingItem(item)
    setModalMode('edit')
  }, [])

  const handleDelete = useCallback((item: InventoryItem) => {
    setEditingItem(null)
    setSelectedItem(item)
    setDeleteError(null)
    setIsDeleting(false)
    deleteRequestRef.current = false
    setModalMode('delete')
  }, [])

  const handleCloseModal = useCallback(() => {
    if (isDeleting) {
      return
    }

    setModalMode(null)
    setSelectedItem(null)
    setEditingItem(null)
    setDeleteError(null)
  }, [isDeleting])

  const handleConfirmedDelete = useCallback(async (item: InventoryItem) => {
    if (deleteRequestRef.current || isDeleting) {
      return
    }

    deleteRequestRef.current = true
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await softDeleteInventory(item.id)

      abortActiveListRequest()

      setListState((current) =>
        current.status === 'success'
          ? { status: 'success', items: current.items.filter((currentItem) => currentItem.id !== item.id) }
          : current,
      )
      setModalMode(null)
      setSelectedItem(null)
    } catch {
      setDeleteError(`Unable to delete “${item.name}”. Please try again.`)
    } finally {
      deleteRequestRef.current = false
      setIsDeleting(false)
    }
  }, [abortActiveListRequest, isDeleting])

  const handleCreated = useCallback((item: InventoryItem) => {
    abortActiveListRequest()
    setListState((current) =>
      current.status === 'success'
        ? {
            status: 'success',
            items: current.items.some((currentItem) => currentItem.id === item.id)
              ? current.items.map((currentItem) => (currentItem.id === item.id ? item : currentItem))
              : [...current.items, item],
          }
        : { status: 'success', items: [item] },
    )
    setReloadToken((token) => token + 1)
    setModalMode(null)
    setSelectedItem(null)
    setEditingItem(null)
  }, [abortActiveListRequest])

  const handleUpdated = useCallback((item: InventoryItem) => {
    abortActiveListRequest()
    setListState((current) =>
      current.status === 'success'
        ? {
            status: 'success',
            items: current.items.map((currentItem) => (currentItem.id === item.id ? item : currentItem)),
          }
        : current,
    )
    setModalMode(null)
    setSelectedItem(null)
    setEditingItem(null)
  }, [abortActiveListRequest])

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Manage your products and stock levels.</p>
        </div>
        <button className="button button--primary page-header__action" type="button" onClick={handleAdd}>
          <Plus />
          Add Item
        </button>
      </header>

      {listState.status === 'loading' ? (
        <>
          <InventorySkeletons />
        </>
      ) : null}

      {listState.status === 'error' ? (
        <section className="state-panel">
          <CircleAlert className="state-panel__icon state-panel__icon--error" />
          <h2>Unable to retrieve inventory</h2>
          <p>{listState.message}</p>
          <button className="button button--secondary" type="button" onClick={() => setReloadToken((token) => token + 1)}>
            <RotateCw />
            Retry
          </button>
        </section>
      ) : null}

      {listState.status === 'success' ? (
        <InventoryGrid items={listState.items} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />
      ) : null}

      {modalMode === 'add' ? (
        <InventoryItemFormModal
          mode="create"
          open
          onClose={handleCloseModal}
          onSaved={handleCreated}
        />
      ) : null}

      {modalMode === 'edit' && editingItem ? (
        <InventoryItemFormModal
          mode="edit"
          item={editingItem}
          open
          onClose={handleCloseModal}
          onSaved={handleUpdated}
        />
      ) : null}

      {modalMode === 'delete' ? (
        <DeleteConfirmationModal
          item={selectedItem}
          deleting={isDeleting}
          error={deleteError}
          onCancel={handleCloseModal}
          onConfirm={handleConfirmedDelete}
        />
      ) : null}
    </main>
  )
}

export default App
