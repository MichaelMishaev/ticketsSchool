'use client'

import { useState } from 'react'

// Generic default used when no cover image is selected — shown on the public page
export const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200'

type ImageCategory = 'school' | 'sports' | 'music' | 'community' | 'restaurant' | 'outdoor'

interface CategoryOption {
  id: ImageCategory
  label: string
  icon: string
}

const CATEGORIES: CategoryOption[] = [
  { id: 'sports', label: 'ספורט', icon: '⚽' },
  { id: 'music', label: 'מוזיקה', icon: '🎵' },
  { id: 'school', label: 'בית ספר', icon: '🏫' },
  { id: 'restaurant', label: 'מסעדה', icon: '🍽' },
  { id: 'outdoor', label: 'שטח פתוח', icon: '🌿' },
  { id: 'community', label: 'קהילה', icon: '👥' },
]

// Fallback static images per category (shown before any AI generation)
const STATIC_IMAGES: Record<ImageCategory, { url: string; label: string }[]> = {
  school: [
    { url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800', label: 'כיתה' },
    {
      url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
      label: 'אירוע בית ספר',
    },
  ],
  sports: [
    { url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800', label: 'כדורגל' },
    { url: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800', label: 'ספורט' },
  ],
  music: [
    { url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', label: 'קונצרט' },
    { url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800', label: 'הופעה' },
  ],
  community: [
    { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', label: 'קהילה' },
    { url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800', label: 'קבוצה' },
  ],
  restaurant: [
    { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', label: 'מסעדה' },
    { url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800', label: 'גאלה' },
  ],
  outdoor: [
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', label: 'טבע' },
    {
      url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
      label: 'שטח פתוח',
    },
  ],
}

function detectCategory(eventGameType?: string): ImageCategory {
  if (!eventGameType) return 'community'
  const text = eventGameType.toLowerCase()
  if (/ספורט|כדורגל|כדורסל|ריצה|שחייה|אתלטיקה|טניס/.test(text)) return 'sports'
  if (/מוזיקה|הופעה|קונצרט|להקה|שירה|זמר/.test(text)) return 'music'
  if (/מסעדה|גאלה|ארוחה|סעודה|שולחן/.test(text)) return 'restaurant'
  if (/טיול|שטח|הרים|טבע|מחנה/.test(text)) return 'outdoor'
  if (/בית ספר|לימוד|כיתה|חינוך|קורס|הרצאה|סדנה/.test(text)) return 'school'
  return 'community'
}

interface ImageTile {
  id: string
  url: string
  label: string
  isAI?: boolean
}

interface CoverImagePickerProps {
  value: string | null
  onChange: (url: string | null) => void
  eventGameType?: string
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SkeletonTile() {
  return (
    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 animate-pulse">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-300" />
        <div className="w-20 h-2 rounded bg-gray-300" />
        <div className="w-14 h-2 rounded bg-gray-200" />
      </div>
    </div>
  )
}

function PreviewModal({
  tile,
  isSelected,
  onSelect,
  onClose,
}: {
  tile: ImageTile
  isSelected: boolean
  onSelect: () => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-white rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={tile.url} alt={tile.label} className="w-full max-h-[70vh] object-cover" />
        <div className="absolute top-2 left-2">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            {tile.isAI && <span className="text-yellow-500">✨</span>}
            {tile.label}
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect()
              onClose()
            }}
            className={`
              px-4 py-1.5 rounded-lg text-sm font-medium transition-all
              ${
                isSelected
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }
            `}
          >
            {isSelected ? '✓ נבחרה' : 'בחר תמונה זו'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CoverImagePicker({
  value,
  onChange,
  eventGameType,
}: CoverImagePickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>(
    detectCategory(eventGameType)
  )
  const [generatedImages, setGeneratedImages] = useState<ImageTile[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [previewTile, setPreviewTile] = useState<ImageTile | null>(null)

  // Build tile list: AI-generated first (latest on top), then static
  const staticTiles: ImageTile[] = STATIC_IMAGES[selectedCategory].map((img) => ({
    id: `static-${selectedCategory}-${img.url.slice(-10)}`,
    url: img.url,
    label: img.label,
  }))

  const allTiles: ImageTile[] = [...generatedImages, ...staticTiles].slice(0, 6)

  async function handleGenerate() {
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch('/api/admin/generate-cover-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory }),
      })
      const data = await res.json()
      if (!res.ok) {
        setGenerateError(data.error ?? 'שגיאה ביצירת תמונה')
        return
      }
      const newTile: ImageTile = {
        id: `ai-${Date.now()}`,
        url: data.url,
        label: `AI – ${CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? selectedCategory}`,
        isAI: true,
      }
      // Prepend new tile; cap AI images at 4 to leave room for static ones
      setGeneratedImages((prev) => [newTile, ...prev].slice(0, 4))
      // Auto-select the newly generated image
      onChange(data.url)
    } catch {
      setGenerateError('לא ניתן ליצור תמונה כרגע. נסה שנית.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div dir="rtl">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        תמונת כותרת לעמוד ההרשמה
        <span className="text-gray-400 text-xs font-normal mr-2">(רשות)</span>
      </label>
      <p className="text-xs text-gray-500 mb-3">
        בחר קטגוריה וצור תמונה ב-AI, או בחר מהתמונות הזמינות.
      </p>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setSelectedCategory(cat.id)
              setGenerateError(null)
            }}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* AI Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`
          w-full mb-4 flex items-center justify-center gap-2
          py-2.5 px-4 rounded-lg border-2 border-dashed text-sm font-medium transition-all
          ${
            isGenerating
              ? 'border-blue-300 bg-blue-50 text-blue-400 cursor-not-allowed'
              : 'border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-500 active:scale-[0.98]'
          }
        `}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
              />
            </svg>
            <span>יוצר תמונה ב-AI...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>
              צור תמונה ב-AI לקטגוריה &quot;
              {CATEGORIES.find((c) => c.id === selectedCategory)?.label}&quot;
            </span>
          </>
        )}
      </button>

      {/* Error message */}
      {generateError && (
        <p className="text-sm text-red-600 mb-3 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          {generateError}
        </p>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Default image tile — shows the generic fallback image */}
        <div
          className={`
          relative aspect-video rounded-lg overflow-hidden border-2 transition-all group
          ${
            value === null
              ? 'border-blue-500 ring-2 ring-blue-500/30'
              : 'border-gray-200 hover:border-gray-400'
          }
        `}
        >
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={DEFAULT_COVER_IMAGE}
              alt="תמונת ברירת מחדל"
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-end">
              <span className="text-white text-xs font-medium px-2 py-1 w-full bg-black/40 flex items-center gap-1">
                <span>🌟</span>
                <span>ברירת מחדל</span>
              </span>
            </div>
          </button>
          {value === null && (
            <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center pointer-events-none">
              <CheckIcon />
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              setPreviewTile({ id: 'default', url: DEFAULT_COVER_IMAGE, label: 'ברירת מחדל' })
            }
            className="absolute top-1 left-1 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100 flex z-10"
            title="תצוגה מקדימה"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        </div>

        {/* Loading skeleton while generating */}
        {isGenerating && <SkeletonTile />}

        {/* Image tiles */}
        {allTiles.slice(0, isGenerating ? 5 : 6).map((tile) => (
          <div
            key={tile.id}
            className={`
              relative aspect-video rounded-lg overflow-hidden border-2 transition-all group
              ${
                value === tile.url
                  ? 'border-blue-500 ring-2 ring-blue-500/30'
                  : 'border-gray-200 hover:border-gray-400'
              }
            `}
          >
            <button
              type="button"
              onClick={() => onChange(tile.url)}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={tile.url}
                alt={tile.label}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-end">
                <span className="text-white text-xs font-medium px-2 py-1 w-full bg-black/30 flex items-center gap-1">
                  {tile.isAI && <span className="text-yellow-300">✨</span>}
                  {tile.label}
                </span>
              </div>
            </button>
            {value === tile.url && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center pointer-events-none">
                <CheckIcon />
              </div>
            )}
            <button
              type="button"
              onClick={() => setPreviewTile(tile)}
              className="absolute top-1 left-1 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100 flex z-10"
              title="תצוגה מקדימה"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Lightbox preview modal */}
      {previewTile && (
        <PreviewModal
          tile={previewTile}
          isSelected={previewTile.id === 'default' ? value === null : value === previewTile.url}
          onSelect={() =>
            previewTile.id === 'default' ? onChange(null) : onChange(previewTile.url)
          }
          onClose={() => setPreviewTile(null)}
        />
      )}

      {/* Expiry notice for AI images */}
      {generatedImages.length > 0 && (
        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
          <span>⚠️</span>
          <span>תמונות AI הן זמניות. לאחר שמירת האירוע, התמונה תשמר בפרמנט.</span>
        </p>
      )}
    </div>
  )
}
