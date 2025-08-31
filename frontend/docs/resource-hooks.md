# Resource Hooks (Updater/Creator)

Reusable, UI‑agnostic logic for creating and updating resources. You fully control layout and components; the hooks handle communication (POST/PATCH/DELETE), dirty tracking, and notifications.

## Files
- Hooks: `frontend/hooks/resource.ts`
  - `useResourceUpdater`
  - `useResourceField`
  - `useResourceCreator`
  - `useResourceList`
- Notifications provider is already mounted in `app/layout.tsx`.

## `useResourceUpdater`
Update an existing resource; optionally load it first, track changed fields, PATCH only what changed, and DELETE.

Import:
```ts
import { useResourceUpdater } from '@/hooks/resource'
```

Signature:
```ts
const u = useResourceUpdater(resourcePath, {
  load?: boolean,                // default true; GET the resource
  initialData?: Record<string, any> | null, // used when load=false
  extract?: (raw: any) => any,   // map server response if wrapped
})
```

Returns:
- `data`: Record<string, any> — current local state of the resource
- `loading`: boolean — fetching initial data
- `saving`: boolean — saving
- `deleting`: boolean — deleting
- `error`: string | null — load error (if any)
- `setField(name, value)`: void — set local field
- `save(keys?)`: Promise<{ ok: boolean }>
  - Sends only dirty fields; if `keys` is provided, restricts to those keys
- `deleteResource()`: Promise<{ ok: boolean }>

Example (Manage Shop):
```tsx
const u = useResourceUpdater(`shops/${shopId}`)
<input value={u.data.name || ''} onChange={(e) => u.setField('name', e.target.value)} />
<button onClick={() => u.save(['name'])}>Save</button>
<button onClick={() => u.deleteResource()}>Delete Shop</button>
```

Example (Profile without GET):
```tsx
const u = useResourceUpdater('auth/me', {
  load: false,
  initialData: { first_name: user.first_name, last_name: user.last_name },
  extract: (raw) => raw?.user || raw,
})
<button onClick={() => u.save(['first_name','last_name'])}>Save changes</button>
```

## `useResourceField`
Single‑field updater with optional debounce and optimistic updates. Useful for autosave inputs.

Import:
```ts
import { useResourceField } from '@/hooks/resource'
```

Signature:
```ts
const f = useResourceField(resourcePath, fieldName, initialValue, {
  debounceMs?: number,    // default 0 (no debounce)
  optimistic?: boolean,   // default true
  validate?: (v: any) => string | null,
})
```

Returns:
- `value`, `saving`, `error`
- `setValue(v, autosave?)`, `save()`

Example (debounced autosave):
```tsx
const name = useResourceField(`shops/${id}`, 'name', initialName, { debounceMs: 400 })
<input value={name.value} onChange={(e) => name.setValue(e.target.value, true)} />
```

## `useResourceCreator`
Create new resources via POST with consistent errors/notifications.

Import:
```ts
import { useResourceCreator } from '@/hooks/resource'
```

Signature:
```ts
const c = useResourceCreator(resourcePath, {
  initialData?: Record<string, any> | null,
  extract?: (raw: any) => any,
})
```

Returns:
- `data`, `saving`, `error`
- `setField(name, value)`
- `create(keys?)` → `{ ok, data? }`

Example (Create Shop):
```tsx
const c = useResourceCreator('shops')
<input value={c.data.name || ''} onChange={(e) => c.setField('name', e.target.value)} />
<button onClick={() => c.create(['name'])}>Create</button>
```

Example (Create Product):
```tsx
const c = useResourceCreator(`shops/${shopId}/products`)
// set name/description
const res = await c.create(['name','description'])
```

## `useResourceList`
Fetch lists of resources with optional query params. Uses the same API client under the hood and includes a `refresh()` helper.

Import:
```ts
import { useResourceList } from '@/hooks/resource'
```

Signature:
```ts
const list = useResourceList<T>(resourcePath, {
  params?: Record<string, string | number | boolean | undefined | null>,
  extract?: (raw: any) => T[],
})
```

Returns:
- `data`: `T[] | null`
- `loading`: boolean
- `error`: string | null
- `refresh()`: void

Example (List Shops):
```tsx
const { data: shops, loading, error } = useResourceList<Shop>('shops')
```

## Patterns & Tips
- Partial saves: `save(['fieldA','fieldB'])` to scope patches per section.
- Wrapped responses: use `extract` when backend returns `{ user: {...} }` or similar.
- Delete confirmations: `deleteResource()` includes a `confirm`; wrap it if you need custom UX.
- Autosave on blur: call `useResourceField(...).save()` in `onBlur` handlers.
- 204 responses: hooks handle 204 No Content gracefully.
- Error messages: hooks parse `detail` and field errors where possible.

## Examples in Repo
- Shop Manage: `frontend/app/dashboard/[id]/manage/page.tsx` (updater)
- Product Manage: `frontend/app/dashboard/[id]/products/[productId]/page.tsx` (updater)
- Profile: `frontend/app/profile/page.tsx` (updater with `load=false`)
- Create Shop: `frontend/app/dashboard/new/page.tsx` (creator)
- Create Product: `frontend/app/dashboard/[id]/products/new/page.tsx` (creator)
