import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleAlert, LoaderCircle, Plus, RotateCw, Search } from 'lucide-react'
import { DeleteConfirmationModal } from './components/inventory/DeleteConfirmationModal'
import { InventoryGrid } from './components/inventory/InventoryGrid'
import { InventoryItemFormModal } from './components/inventory/InventoryItemFormModal'
import {
  getApiErrorMessage,
  isApiRequestCanceled,
  listInventory,
  searchInventory,
  softDeleteInventory,
} from './lib/inventoryApi'
import { ALL_CATEGORIES_LABEL, INVENTORY_CATEGORIES } from './lib/inventoryConstants'
import type { InventoryItem } from './types/inventory'
import './App.css'

type CompleteLoadState = 'loading' | 'success' | 'error'

type SearchState =
  | { status: 'idle' | 'loading' | 'success' }
  | { status: 'error'; message: string }

type ModalMode = 'add' | 'edit' | 'delete'

const retrievalErrorMessage = 'We couldn\'t load your inventory. Please try again.'
const refreshErrorMessage = 'We couldn\'t refresh your inventory. Please try again.'
const searchErrorMessage = 'We couldn\'t search your inventory. Please try again.'

function App() {
  const [completeItems, setCompleteItems] = useState<InventoryItem[]>([])
  const [completeLoadState, setCompleteLoadState] = useState<CompleteLoadState>('loading')
  const [completeLoadError, setCompleteLoadError] = useState<string | null>(null)
  const [hasCompleteLoaded, setHasCompleteLoaded] = useState(false)
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([])
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const listRequestRef = useRef<AbortController | null>(null)
  const searchRequestRef = useRef<AbortController | null>(null)
  const searchTimerRef = useRef<number | null>(null)
  const searchRequestIdRef = useRef(0)
  const normalizedSearchTermRef = useRef('')
  const deletedItemIdsRef = useRef<Set<number>>(new Set())
  const deleteRequestRef = useRef(false)
  const hasCompleteLoadedRef = useRef(false)

  const normalizedSearchTerm = searchTerm.trim()
  normalizedSearchTermRef.current = normalizedSearchTerm
  hasCompleteLoadedRef.current = hasCompleteLoaded

  const filterDeletedItems = useCallback((items: InventoryItem[]) => {
    return items.filter((item) => !deletedItemIdsRef.current.has(item.id))
  }, [])

  const abortActiveListRequest = useCallback(() => {
    listRequestRef.current?.abort()
    listRequestRef.current = null
  }, [])

  const startSearchRequest = useCallback((query: string) => {
    if (!query) {
      return
    }

    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }

    searchRequestRef.current?.abort()

    const requestId = searchRequestIdRef.current + 1
    searchRequestIdRef.current = requestId
    const controller = new AbortController()
    searchRequestRef.current = controller
    setSearchState({ status: 'loading' })

    searchInventory(query, controller.signal)
      .then((items) => {
        if (
          controller.signal.aborted
          || requestId !== searchRequestIdRef.current
          || normalizedSearchTermRef.current !== query
        ) {
          return
        }

        setSearchResults(filterDeletedItems(items))
        setSearchState({ status: 'success' })
        if (searchRequestRef.current === controller) {
          searchRequestRef.current = null
        }
      })
      .catch((error: unknown) => {
        if (
          controller.signal.aborted
          || requestId !== searchRequestIdRef.current
          || normalizedSearchTermRef.current !== query
          || isApiRequestCanceled(error)
        ) {
          return
        }

        setSearchState({
          status: 'error',
          message: getApiErrorMessage(error, searchErrorMessage),
        })
        if (searchRequestRef.current === controller) {
          searchRequestRef.current = null
        }
      })
  }, [filterDeletedItems])

  useEffect(() => {
    const controller = new AbortController()
    let isCurrentRequest = true
    listRequestRef.current = controller
    setCompleteLoadState('loading')
    setCompleteLoadError(null)

    listInventory(controller.signal)
      .then((items) => {
        if (isCurrentRequest && !controller.signal.aborted) {
          setCompleteItems(filterDeletedItems(items))
          setHasCompleteLoaded(true)
          setCompleteLoadState('success')
          setCompleteLoadError(null)
        }
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest || controller.signal.aborted || isApiRequestCanceled(error)) {
          return
        }

        setCompleteLoadState('error')
        setCompleteLoadError(
          getApiErrorMessage(error, hasCompleteLoadedRef.current ? refreshErrorMessage : retrievalErrorMessage),
        )
      })

    return () => {
      isCurrentRequest = false
      controller.abort()
      if (listRequestRef.current === controller) {
        listRequestRef.current = null
      }
    }
  }, [filterDeletedItems, reloadToken])

  useEffect(() => {
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }

    searchRequestRef.current?.abort()
    searchRequestRef.current = null
    searchRequestIdRef.current += 1

    if (!normalizedSearchTerm) {
      setSearchResults([])
      setSearchState({ status: 'idle' })
      return
    }

    setSearchState({ status: 'loading' })
    searchTimerRef.current = window.setTimeout(() => {
      searchTimerRef.current = null
      startSearchRequest(normalizedSearchTerm)
    }, 250)

    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current)
        searchTimerRef.current = null
      }

      searchRequestRef.current?.abort()
      searchRequestRef.current = null
      searchRequestIdRef.current += 1
    }
  }, [normalizedSearchTerm, startSearchRequest])

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current)
      }
      searchRequestRef.current?.abort()
    }
  }, [])

  const handleRetrySearch = useCallback(() => {
    if (normalizedSearchTermRef.current) {
      startSearchRequest(normalizedSearchTermRef.current)
    }
  }, [startSearchRequest])

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

      deletedItemIdsRef.current.add(item.id)
      abortActiveListRequest()
      searchRequestRef.current?.abort()
      searchRequestRef.current = null
      searchRequestIdRef.current += 1
      setCompleteItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id))
      setSearchResults((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id))
      setSearchState((current) => (current.status === 'loading' ? { status: 'success' } : current))
      setModalMode(null)
      setSelectedItem(null)
    } catch {
      setDeleteError(`Unable to delete “${item.name}”. Please try again.`)
    } finally {
      deleteRequestRef.current = false
      setIsDeleting(false)
    }
  }, [abortActiveListRequest, isDeleting])

  const handleSaved = useCallback((item: InventoryItem) => {
    deletedItemIdsRef.current.delete(item.id)
    abortActiveListRequest()
    setReloadToken((token) => token + 1)

    if (normalizedSearchTermRef.current) {
      startSearchRequest(normalizedSearchTermRef.current)
    }

    setModalMode(null)
    setSelectedItem(null)
    setEditingItem(null)
  }, [abortActiveListRequest, startSearchRequest])

  const sourceItems = normalizedSearchTerm ? searchResults : completeItems
  const filteredItems = selectedCategory
    ? sourceItems.filter((item) => item.category === selectedCategory)
    : sourceItems
  const hasActiveFilters = Boolean(normalizedSearchTerm || selectedCategory)
  const isSearchLoading = searchState.status === 'loading'
  const showInitialLoading = !hasCompleteLoaded && completeLoadState === 'loading'
  const showInitialError = !hasCompleteLoaded && completeLoadState === 'error'
  const hasSearchSnapshot = searchState.status !== 'loading' || searchResults.length > 0
  const showResults = hasCompleteLoaded || (Boolean(normalizedSearchTerm) && hasSearchSnapshot)

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Manage your products and stock levels.</p>
        </div>
        <button className="button button--primary page-header__action" type="button" onClick={handleAdd}>
          <Plus aria-hidden="true" />
          Add Item
        </button>
      </header>

      <section className="inventory-controls" role="search" aria-label="Search and filter inventory" aria-busy={isSearchLoading}>
        <div className="form-field inventory-controls__field inventory-controls__search-field">
          <label htmlFor="inventory-search">Search inventory</label>
          <div className="inventory-controls__input-wrap">
            <Search className="inventory-controls__search-icon" aria-hidden="true" />
            <input
              id="inventory-search"
              type="search"
              value={searchTerm}
              onChange={(event) => {
                const nextSearchTerm = event.target.value
                setSearchTerm(nextSearchTerm)
                if (!nextSearchTerm.trim()) {
                  setSearchResults([])
                }
              }}
              placeholder="Search by name or description"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="form-field inventory-controls__field">
          <label htmlFor="inventory-category-filter">Category</label>
          <select
            id="inventory-category-filter"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="">{ALL_CATEGORIES_LABEL}</option>
            {INVENTORY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </section>

      {showInitialLoading ? (
        <section className="state-panel" role="status" aria-live="polite">
          <LoaderCircle className="state-panel__icon state-panel__icon--loading" aria-hidden="true" />
          <h2>Loading inventory</h2>
          <p>Retrieving your inventory items…</p>
        </section>
      ) : null}

      {showInitialError ? (
        <section className="state-panel" role="alert">
          <CircleAlert className="state-panel__icon state-panel__icon--error" aria-hidden="true" />
          <h2>Unable to retrieve inventory</h2>
          <p>{completeLoadError ?? retrievalErrorMessage}</p>
          <button className="button button--secondary" type="button" onClick={() => setReloadToken((token) => token + 1)}>
            <RotateCw aria-hidden="true" />
            Retry
          </button>
        </section>
      ) : null}

      {showResults ? (
        <div className="inventory-results" aria-busy={isSearchLoading}>
          {completeLoadState === 'loading' && hasCompleteLoaded ? (
            <div className="inventory-status" role="status" aria-live="polite">
              <LoaderCircle aria-hidden="true" />
              <span>Refreshing inventory…</span>
            </div>
          ) : null}

          {completeLoadState === 'error' && hasCompleteLoaded ? (
            <div className="inventory-status inventory-status--error" role="alert">
              <div className="inventory-status__message">
                <CircleAlert aria-hidden="true" />
                <span>{completeLoadError ?? refreshErrorMessage}</span>
              </div>
              <button className="button button--secondary" type="button" onClick={() => setReloadToken((token) => token + 1)}>
                <RotateCw aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : null}

          {searchState.status === 'error' ? (
            <div className="inventory-status inventory-status--error" role="alert">
              <div className="inventory-status__message">
                <CircleAlert aria-hidden="true" />
                <span>{searchState.message}</span>
              </div>
              <button className="button button--secondary" type="button" onClick={handleRetrySearch}>
                <RotateCw aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : null}

          {!isSearchLoading || searchResults.length > 0 ? (
            <InventoryGrid
              items={filteredItems}
              hasActiveFilters={hasActiveFilters}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : null}
        </div>
      ) : null}

      {modalMode === 'add' ? (
        <InventoryItemFormModal
          mode="create"
          open
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      ) : null}

      {modalMode === 'edit' && editingItem ? (
        <InventoryItemFormModal
          mode="edit"
          item={editingItem}
          open
          onClose={handleCloseModal}
          onSaved={handleSaved}
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
