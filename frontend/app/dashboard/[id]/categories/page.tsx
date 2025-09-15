"use client"
import { useState } from 'react'
import { useResourceList } from '@/hooks/resource'
import { api } from '@/lib/api'

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
  const [confirmId, setConfirmId] = useState<number | null>(null)

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

  return (
    <div className="categories-page-container">
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

      {categories.loading || !categories.data ? (
        <p>Loading categories...</p>
      ) : categories.data.length === 0 ? (
        <div className="no-categories-message">No categories yet.</div>
      ) : (
        <div className="categories-list-wrapper">
          <ul className="categories-list">
            {categories.data.map((c) => (
              <li key={c.id} className="category-item">
                <div className="info">
                  <span>{c.name}</span>
                  {c.description ? <div className="muted">{c.description}</div> : null}
                </div>
                {confirmId === c.id ? (
                  <div className="confirm-inline">
                    <span>Delete this category?</span>
                    <button type="button" className="btn" onClick={() => setConfirmId(null)}>Cancel</button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={async () => { await deleteCategory(c.id); setConfirmId(null) }}
                    >Delete</button>
                  </div>
                ) : (
                  <div className="actions">
                    <button type="button" onClick={() => setConfirmId(c.id)}>
                      <img src="/img/trash-01-l.svg" alt="" className="nav-icon" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
