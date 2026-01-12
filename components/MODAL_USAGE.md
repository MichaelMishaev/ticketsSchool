# 🎯 Modal Component - Complete Usage Guide

## 📦 What's Included

The Modal system includes:

- **`Modal`** - Main customizable modal component
- **`ConfirmModal`** - Quick confirmation dialogs
- **`AlertModal`** - Simple alert messages

---

## 🚀 Basic Usage

### 1. Import the Component

```typescript
import Modal, { ConfirmModal, AlertModal } from '@/components/Modal'
```

### 2. Add State

```typescript
const [showModal, setShowModal] = useState(false)
```

### 3. Render the Modal

```tsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="כותרת המודאל"
  description="תיאור קצר (אופציונלי)"
>
  {/* התוכן שלך כאן */}
  <p>זהו תוכן המודאל</p>
</Modal>
```

---

## 🎨 Examples by Use Case

### ✅ Confirmation Dialog (Delete, Cancel, etc.)

```tsx
import { useState } from 'react'
import { ConfirmModal } from '@/components/Modal'
import { Trash2 } from 'lucide-react'

function MyComponent() {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    // Perform delete action
    console.log('Item deleted!')
  }

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        <Trash2 className="w-4 h-4" />
        מחק פריט
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="האם למחוק פריט זה?"
        description="פעולה זו לא ניתנת לביטול. הפריט יימחק לצמיתות."
        type="error"
        confirmText="מחק"
        cancelText="ביטול"
      />
    </>
  )
}
```

**Result:**

- ❌ Red error-themed modal
- 🔴 "מחק" button (danger variant)
- ⚪ "ביטול" button (secondary variant)

---

### ℹ️ Info/Alert Message

```tsx
import { useState } from 'react'
import { AlertModal } from '@/components/Modal'

function MyComponent() {
  const [showAlert, setShowAlert] = useState(false)

  return (
    <>
      <button onClick={() => setShowAlert(true)}>הצג הודעה</button>

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="פעולה הושלמה בהצלחה"
        message="האירוע נוצר בהצלחה ונשמר במערכת"
        type="success"
        buttonText="מעולה!"
      />
    </>
  )
}
```

---

### 🎯 Custom Modal with Multiple Buttons

```tsx
import { useState } from 'react'
import Modal from '@/components/Modal'
import { Save, Eye, X } from 'lucide-react'

function MyComponent() {
  const [showOptions, setShowOptions] = useState(false)

  return (
    <Modal
      isOpen={showOptions}
      onClose={() => setShowOptions(false)}
      title="בחר פעולה"
      description="מה ברצונך לעשות עם האירוע?"
      type="info"
      size="md"
      buttons={[
        {
          label: 'ביטול',
          onClick: () => setShowOptions(false),
          variant: 'secondary',
          icon: <X className="w-5 h-5" />,
        },
        {
          label: 'תצוגה מקדימה',
          onClick: () => console.log('Preview'),
          variant: 'secondary',
          icon: <Eye className="w-5 h-5" />,
        },
        {
          label: 'שמור ופרסם',
          onClick: () => console.log('Publish'),
          variant: 'success',
          icon: <Save className="w-5 h-5" />,
        },
      ]}
    >
      <p className="text-gray-700">
        האירוע מוכן לפרסום. תוכל לבחור לשמור, לראות תצוגה מקדימה, או לבטל.
      </p>
    </Modal>
  )
}
```

---

### 📋 Modal with Complex Content (Forms, Lists, etc.)

```tsx
import { useState } from 'react'
import Modal from '@/components/Modal'
import { Settings } from 'lucide-react'

function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: false,
    theme: 'light',
  })

  const handleSave = () => {
    console.log('Saving settings:', settings)
    setIsOpen(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="הגדרות"
      description="התאם אישית את הגדרות המערכת"
      icon={<Settings className="w-8 h-8" />}
      size="lg"
      buttons={[
        {
          label: 'ביטול',
          onClick: () => setIsOpen(false),
          variant: 'secondary',
        },
        {
          label: 'שמור שינויים',
          onClick: handleSave,
          variant: 'primary',
        },
      ]}
    >
      <div className="space-y-4">
        {/* Notifications Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">התראות</p>
            <p className="text-sm text-gray-600">קבל עדכונים על אירועים חדשים</p>
          </div>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
            className="w-5 h-5"
          />
        </div>

        {/* Auto-save Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">שמירה אוטומטית</p>
            <p className="text-sm text-gray-600">שמור טיוטות אוטומטית כל 10 שניות</p>
          </div>
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
            className="w-5 h-5"
          />
        </div>

        {/* Theme Selector */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-900 mb-2">ערכת צבעים</p>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
          >
            <option value="light">בהיר</option>
            <option value="dark">כהה</option>
            <option value="auto">אוטומטי</option>
          </select>
        </div>
      </div>
    </Modal>
  )
}
```

---

## 🎛️ Props Reference

### Modal Component

| Prop                   | Type                                                      | Default    | Description                               |
| ---------------------- | --------------------------------------------------------- | ---------- | ----------------------------------------- |
| `isOpen`               | `boolean`                                                 | -          | **Required.** Controls modal visibility   |
| `onClose`              | `() => void`                                              | -          | **Required.** Called when modal closes    |
| `title`                | `string`                                                  | -          | **Required.** Modal title                 |
| `description`          | `string`                                                  | -          | Optional subtitle                         |
| `type`                 | `'info' \| 'success' \| 'warning' \| 'error' \| 'custom'` | `'custom'` | Preset styling                            |
| `icon`                 | `React.ReactNode`                                         | -          | Custom icon (overrides type icon)         |
| `children`             | `React.ReactNode`                                         | -          | Modal content                             |
| `buttons`              | `ModalButton[]`                                           | `[]`       | Array of action buttons                   |
| `showCloseButton`      | `boolean`                                                 | `true`     | Show X button in header                   |
| `closeOnBackdropClick` | `boolean`                                                 | `true`     | Close when clicking outside               |
| `closeOnEsc`           | `boolean`                                                 | `true`     | Close on Escape key                       |
| `size`                 | `'sm' \| 'md' \| 'lg' \| 'xl'`                            | `'md'`     | Modal width                               |
| `headerGradient`       | `string`                                                  | -          | Custom header gradient (Tailwind classes) |

### ModalButton Interface

```typescript
interface ModalButton {
  label: string // Button text
  onClick: () => void // Click handler
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  icon?: React.ReactNode // Optional icon
  disabled?: boolean // Disable button
}
```

---

## 🎨 Type Presets

Each `type` comes with predefined styling:

### `info` (Blue)

- 🔵 Blue gradient header
- ℹ️ Info icon
- Use for: General information, help messages

### `success` (Green)

- 🟢 Green gradient header
- ✅ Checkmark icon
- Use for: Success confirmations, completed actions

### `warning` (Amber)

- 🟡 Amber gradient header
- ⚠️ Warning icon
- Use for: Caution messages, important notices

### `error` (Red)

- 🔴 Red gradient header
- ❌ Error icon
- Use for: Destructive actions, critical errors

### `custom` (Purple/Blue)

- 🟣 Blue-purple gradient
- No default icon
- Use for: Custom scenarios with your own icon

---

## 📱 Responsive Behavior

The Modal component is **fully responsive**:

- ✅ **Mobile (< 640px):**
  - Buttons stack vertically
  - Full-width modal with padding
  - Scrollable content area

- ✅ **Tablet/Desktop (≥ 640px):**
  - Buttons display horizontally
  - Centered modal with max-width
  - Backdrop blur effect

- ✅ **All Sizes:**
  - Smooth animations (scale + fade)
  - Keyboard navigation (Tab, Escape)
  - Focus trap within modal
  - Body scroll prevention

---

## ♿ Accessibility Features

- ✅ **Keyboard Navigation:**
  - `Escape` key to close
  - Tab through buttons
  - Enter to submit

- ✅ **Screen Readers:**
  - Proper ARIA labels
  - Semantic HTML structure
  - Focus management

- ✅ **Visual:**
  - High contrast colors
  - Clear button hierarchy
  - Animated transitions (reduced for prefers-reduced-motion)

---

## 🎯 Common Use Cases

### 1. Delete Confirmation

```tsx
<ConfirmModal
  isOpen={showDelete}
  onClose={() => setShowDelete(false)}
  onConfirm={handleDelete}
  title="האם למחוק אירוע זה?"
  description="פעולה זו לא ניתנת לביטול"
  type="error"
  confirmText="מחק"
  cancelText="ביטול"
/>
```

### 2. Success Message

```tsx
<AlertModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="אירוע נוצר בהצלחה"
  message="האירוע שלך נשמר ופורסם במערכת"
  type="success"
  buttonText="מעולה!"
/>
```

### 3. Unsaved Changes Warning

```tsx
<ConfirmModal
  isOpen={showUnsaved}
  onClose={() => setShowUnsaved(false)}
  onConfirm={handleDiscard}
  title="יש לך שינויים לא שמורים"
  description="אם תצא עכשיו, השינויים יאבדו"
  type="warning"
  confirmText="צא בלי לשמור"
  cancelText="המשך לערוך"
/>
```

### 4. Draft Recovery (Complex Example)

See `/app/admin/events/new-test/page.tsx` lines 868-973 for full implementation.

---

## 🚀 Quick Start Checklist

1. ✅ Import Modal component
2. ✅ Add `useState` for open/close state
3. ✅ Render Modal with `isOpen` and `onClose`
4. ✅ Add title and description
5. ✅ Choose type or add custom icon
6. ✅ Define buttons with actions
7. ✅ Add content inside `<Modal>` tags

---

## 💡 Pro Tips

1. **Use Presets:** For simple confirmations, use `ConfirmModal` or `AlertModal` instead of the full `Modal`
2. **Button Order:** Place destructive actions (delete) on the right for Hebrew RTL UX
3. **Size Selection:** Use `sm` for alerts, `md` for confirmations, `lg` for forms, `xl` for complex content
4. **Accessibility:** Always provide clear button labels and descriptions
5. **Mobile First:** Test on mobile - buttons will stack, content will scroll

---

**Built with:** React, TypeScript, Framer Motion, Tailwind CSS, Lucide Icons
