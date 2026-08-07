import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleAlert, LoaderCircle, Plus, RotateCw } from 'lucide-react'
import { InventoryGrid } from './components/inventory/InventoryGrid'
import { InventoryItemFormModal } from './components/inventory/InventoryItemFormModal'
import { getApiErrorMessage, isApiRequestCanceled, listInventory } from './lib/inventoryApi'
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
    <section className="inventory-grid" aria-label="Loading inventory">
      {Array.from({ length: 8 }, (_, index) => (
        <div className="inventory-card inventory-card--skeleton" aria-hidden="true" key={index}>
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
  const modalTriggerRef = useRef<HTMLElement | null>(null)
  const addItemTriggerRef = useRef<HTMLButtonElement>(null)
  const listRequestRef = useRef<AbortController | null>(null)

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

  const rememberTrigger = useCallback(() => {
    modalTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
  }, [])

  const handleAdd = useCallback(() => {
    modalTriggerRef.current = addItemTriggerRef.current
    setSelectedItem(null)
    setEditingItem(null)
    setModalMode('add')
  }, [])

  const handleEdit = useCallback((item: InventoryItem) => {
    rememberTrigger()
    setSelectedItem(null)
    setEditingItem(item)
    setModalMode('edit')
  }, [rememberTrigger])

  const handleDelete = useCallback((item: InventoryItem) => {
    rememberTrigger()
    setEditingItem(null)
    setSelectedItem(item)
    setModalMode('delete')
  }, [rememberTrigger])

  const handleCloseModal = useCallback(() => {
    setModalMode(null)
    setSelectedItem(null)
    setEditingItem(null)
  }, [])

  const handleCreated = useCallback((item: InventoryItem) => {
    listRequestRef.current?.abort()
    listRequestRef.current = null
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
  }, [])

  const handleUpdated = useCallback((item: InventoryItem) => {
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
  }, [])

  return (
    <main
      className="page-shell"
      data-modal-mode={modalMode ?? undefined}
      data-selected-item-id={editingItem?.id ?? selectedItem?.id}
    >
      <header className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Manage your products and stock levels.</p>
        </div>
        <button ref={addItemTriggerRef} className="button button--primary page-header__action" type="button" onClick={handleAdd}>
          <Plus aria-hidden="true" />
          Add Item
        </button>
      </header>

      {listState.status === 'loading' ? (
        <>
          <div className="loading-status" role="status">
            <LoaderCircle aria-hidden="true" />
            <span>Loading inventory…</span>
          </div>
          <InventorySkeletons />
        </>
      ) : null}

      {listState.status === 'error' ? (
        <section className="state-panel" role="alert" aria-labelledby="error-state-title">
          <CircleAlert className="state-panel__icon state-panel__icon--error" aria-hidden="true" />
          <h2 id="error-state-title">Unable to retrieve inventory</h2>
          <p>{listState.message}</p>
          <button className="button button--secondary" type="button" onClick={() => setReloadToken((token) => token + 1)}>
            <RotateCw aria-hidden="true" />
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
          triggerRef={modalTriggerRef}
          onClose={handleCloseModal}
          onSaved={handleCreated}
        />
      ) : null}

      {modalMode === 'edit' && editingItem ? (
        <InventoryItemFormModal
          mode="edit"
          item={editingItem}
          open
          triggerRef={modalTriggerRef}
          onClose={handleCloseModal}
          onSaved={handleUpdated}
        />
      ) : null}
    </main>
  )
}

export default App
