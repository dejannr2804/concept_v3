"use client"
import { useMemo, useState } from 'react'
import { useResourceList } from '@/hooks/resource'
import { api } from '@/lib/api'
import Modal from '@/components/Modal'
import DashboardLoadingPlaceholder from '@/components/DashboardLoadingPlaceholder'

type Category = {
  id: number
  name: string
  slug: string
  description?: string
}

export default function CategoriesPage({ params }: { params: { id: string } }) {
  const { id } = params
  const categories = useResourceList<Category>(`shops/${id}/categories`)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selected, setSelected] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      categories.notify.error('Name is required')
      return
    }
    const body: any = { name }
    if (description.trim()) body.description = description.trim()
    try {
      await api.post(`shops/${id}/categories`, body)
      categories.notify.success('Category created')
      setName('')
      setDescription('')
      categories.refresh()
    } catch (e: any) {
      categories.notify.error(e?.message || 'Failed to create category')
    }
  }

  async function deleteCategory(catId: number) {
    try {
      await api.delete(`shops/${id}/categories/${catId}`)
      categories.notify.success('Category deleted')
      categories.refresh()
    } catch (e: any) {
      categories.notify.error(e?.message || 'Failed to delete category')
    }
  }

  function openEdit(cat: Category) {
    setSelected(cat)
    setEditName(cat.name)
    setEditDescription(cat.description || '')
    setEditOpen(true)
  }

  async function saveEdit() {
    if (!selected) return
    if (!editName.trim()) {
      categories.notify.error('Name is required')
      return
    }
    try {
      setEditing(true)
      await api.patch(`shops/${id}/categories/${selected.id}`, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      })
      categories.notify.success('Category updated')
      setEditOpen(false)
      setSelected(null)
      categories.refresh()
    } catch (e: any) {
      categories.notify.error(e?.message || 'Failed to update category')
    } finally {
      setEditing(false)
    }
  }

  async function confirmDelete() {
    if (!selected) return
    try {
      setDeleting(true)
      await deleteCategory(selected.id)
      setEditOpen(false)
      setSelected(null)
    } finally {
      setDeleting(false)
    }
  }

  const initials = useMemo(() => {
    const map: Record<number, string> = {}
    categories.data?.forEach((c) => {
      const ch = (c.name || '').trim().charAt(0).toUpperCase()
      map[c.id] = ch || '?'
    })
    return map
  }, [categories.data])

  if (categories.loading || !categories.data) {
    return <DashboardLoadingPlaceholder />
  }

  return (
    <div className="categories-page-container dlp-fadeIn">
      <div className="top-line">
        <h1 className="heading">Categories</h1>
      </div>

      <div className="filters">
        <form className="filter create" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="New category name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="create-btn">
            <img src="/img/plus-l.svg" alt="" className="nav-icon" />
            <span>Create</span>
          </button>
        </form>
      </div>

      {categories.data.length === 0 ? (
        <div className="no-categories-message">No categories yet.</div>
      ) : (
        <div className="categories-grid-wrapper">
          <div className="categories-grid">
            {categories.data.map((c) => (
              <div key={c.id} className="category-card">
                <div className="category-card-header">
                  <div className="category-avatar" aria-hidden="true">{initials[c.id]}</div>
                  <div className="category-title">
                    <div className="category-name">{c.name}</div>
                    <div className="category-desc">{c.description?.trim() ? c.description : 'No description'}</div>
                  </div>
                </div>
                <div className="category-actions">
                  <button type="button" className="ss-button ss-button--sm" onClick={() => openEdit(c)}>
                    <img src="/img/settings-01-l.svg" alt="" className="nav-icon" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => { if (!editing && !deleting) { setEditOpen(false); setSelected(null) } }}>
        <div className="ss-modal" role="document">
          <div className="ss-modalTitle">
            <img src="/img/settings-01.svg" alt="" className="ss-modalIcon" />
            <span>Edit category</span>
          </div>
          <div className="ss-modalField">
            <div className="ss-label">Name</div>
            <input
              className="ss-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Category name"
              disabled={editing || deleting}
            />
          </div>
          <div className="ss-modalField">
            <div className="ss-label">Description</div>
            <textarea
              className="ss-input"
              style={{ minHeight: 90, borderRadius: 12 }}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Optional description"
              disabled={editing || deleting}
            />
          </div>
          <div className="ss-modalActions">
            <button className="ss-button ss-button--danger" onClick={confirmDelete} disabled={editing || deleting}>
              <img src="/img/trash-01-l.svg" alt="" className="nav-icon" />
              <span>{deleting ? 'Deleting...' : 'Delete'}</span>
            </button>
            <button className="ss-button" onClick={() => setEditOpen(false)} disabled={editing || deleting}>Cancel</button>
            <button className="ss-button" onClick={saveEdit} disabled={editing || deleting}>
              <span>{editing ? 'Saving...' : 'Save changes'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
