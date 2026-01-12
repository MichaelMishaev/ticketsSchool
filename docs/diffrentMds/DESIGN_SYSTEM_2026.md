# 🎨 TicketCap Design System 2026
**Version:** 1.0.0
**Last Updated:** 2026-01-10
**Status:** Active

---

## 📐 Foundation Principles

### Design Philosophy
1. **Accessibility First** - WCAG 2.1 AAA compliance (7:1 contrast)
2. **Mobile-First** - Design for 375px, enhance for desktop
3. **Hebrew RTL** - Native right-to-left with proper BiDi support
4. **Performance** - 60fps animations, lazy loading, optimized assets
5. **Consistency** - Reusable components, systematic spacing

### Core Values
- **Clarity over cleverness** - Simple, obvious UI
- **Speed over features** - Fast loading, instant feedback
- **Inclusion over exclusion** - Accessible to all users
- **Trust over flash** - Professional, reliable design

---

## 🎨 Color System

### Primary Palette (Blue)
```tsx
export const blue = {
  50: '#eff6ff',   // Backgrounds, hover states
  100: '#dbeafe',  // Light backgrounds
  200: '#bfdbfe',  // Borders, dividers
  300: '#93c5fd',  // Secondary borders
  400: '#60a5fa',  // Secondary elements
  500: '#3b82f6',  // Primary brand color
  600: '#2563eb',  // Primary buttons, links
  700: '#1d4ed8',  // Hover states, active
  800: '#1e40af',  // Pressed states
  900: '#1e3a8a',  // Dark text on light bg
  950: '#172554',  // Darkest text
}
```

**Usage:**
```tsx
// Primary Button
className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"

// Primary Link
className="text-blue-600 hover:text-blue-700 hover:underline"

// Info Background
className="bg-blue-50 border-2 border-blue-200 text-blue-900"
```

---

### Semantic Colors

#### Success (Green)
```tsx
export const green = {
  50: '#f0fdf4',   // Success backgrounds
  100: '#dcfce7',  // Light success
  500: '#22c55e',  // Success icons
  600: '#16a34a',  // Success buttons
  700: '#15803d',  // Success hover
  900: '#14532d',  // Success text
}
```

**Usage:**
```tsx
// Success Button
className="bg-green-600 hover:bg-green-700 text-white"

// Success Badge
className="bg-green-100 text-green-800 border border-green-200"

// Success Alert
className="bg-green-50 border-2 border-green-200 text-green-900"
```

---

#### Warning (Amber)
```tsx
export const amber = {
  50: '#fffbeb',   // Warning backgrounds
  100: '#fef3c7',  // Light warning
  500: '#f59e0b',  // Warning icons
  600: '#d97706',  // Warning buttons
  700: '#b45309',  // Warning hover
  900: '#78350f',  // Warning text
}
```

**Usage:**
```tsx
// Warning Button
className="bg-amber-600 hover:bg-amber-700 text-white"

// Warning Badge
className="bg-amber-100 text-amber-800 border border-amber-200"
```

---

#### Error (Red)
```tsx
export const red = {
  50: '#fef2f2',   // Error backgrounds
  100: '#fee2e2',  // Light error
  500: '#ef4444',  // Error icons
  600: '#dc2626',  // Error buttons
  700: '#b91c1c',  // Error hover
  900: '#7f1d1d',  // Error text
}
```

**Usage:**
```tsx
// Error Button
className="bg-red-600 hover:bg-red-700 text-white"

// Error Badge
className="bg-red-100 text-red-800 border border-red-200"

// Error Input
className="border-2 border-red-500 focus:ring-red-300"
```

---

#### Neutral (Gray Scale)
```tsx
export const gray = {
  50: '#f9fafb',   // Page backgrounds
  100: '#f3f4f6',  // Card backgrounds
  200: '#e5e7eb',  // Borders, dividers
  300: '#d1d5db',  // Input borders
  400: '#9ca3af',  // Placeholder text
  500: '#6b7280',  // Secondary text
  600: '#4b5563',  // Body text (AVOID - use 700+)
  700: '#374151',  // Body text (7:1 contrast ✅)
  800: '#1f2937',  // Headings
  900: '#111827',  // Primary text (21:1 contrast ✅)
  950: '#030712',  // Maximum contrast
}
```

**CRITICAL:** Always use `text-gray-900` or `text-gray-700` for body text.
**NEVER use:** `text-gray-600` or lighter (fails WCAG AAA).

---

### Purple (Organization/School)
```tsx
export const purple = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  600: '#9333ea',
  700: '#7e22ce',
  900: '#581c87',
}
```

**Usage:**
```tsx
// School Badge
className="bg-purple-100 text-purple-700 border-2 border-purple-200"
```

---

## 📏 Typography System

### Type Scale (1.250 - Major Third)
```tsx
export const fontSize = {
  xs: '0.75rem',      // 12px - Micro text, labels
  sm: '0.875rem',     // 14px - Small text, captions
  base: '1rem',       // 16px - Body text (default)
  lg: '1.125rem',     // 18px - Large body, lead text
  xl: '1.25rem',      // 20px - H4
  '2xl': '1.5rem',    // 24px - H3
  '3xl': '1.875rem',  // 30px - H2
  '4xl': '2.25rem',   // 36px - H1
  '5xl': '3rem',      // 48px - Display
}
```

### Font Weights
```tsx
export const fontWeight = {
  normal: 400,    // Body text
  medium: 500,    // Emphasized text
  semibold: 600,  // Subheadings
  bold: 700,      // Headings
  extrabold: 800, // Display text
}
```

### Line Heights
```tsx
export const lineHeight = {
  tight: 1.25,    // Headings
  snug: 1.375,    // Subheadings
  normal: 1.5,    // Body text (default)
  relaxed: 1.625, // Long-form content
  loose: 2,       // Spacious layouts
}
```

---

### Semantic Typography Classes

```tsx
export const typography = {
  // Display (Hero sections)
  display: "text-5xl font-bold leading-tight tracking-tight text-gray-900",

  // Headings
  h1: "text-4xl font-bold leading-tight text-gray-900",
  h2: "text-3xl font-bold leading-tight text-gray-900",
  h3: "text-2xl font-bold leading-snug text-gray-900",
  h4: "text-xl font-semibold leading-snug text-gray-800",
  h5: "text-lg font-semibold leading-normal text-gray-800",

  // Body Text
  body: "text-base leading-relaxed text-gray-700",
  bodyLarge: "text-lg leading-relaxed text-gray-700",
  bodySmall: "text-sm leading-normal text-gray-700",

  // Supporting Text
  caption: "text-sm leading-normal text-gray-600",
  micro: "text-xs leading-snug text-gray-500",

  // Labels
  label: "text-sm font-medium leading-normal text-gray-900",
  labelSmall: "text-xs font-medium leading-snug text-gray-900",

  // Special
  overline: "text-xs font-semibold uppercase tracking-wide text-gray-700",
  code: "font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-900",
}
```

**Usage Example:**
```tsx
import { typography } from '@/lib/design-tokens'

<h1 className={typography.h1}>כותרת ראשית</h1>
<p className={typography.body}>טקסט רגיל בגוף הדף</p>
<span className={typography.caption}>טקסט עזר קטן</span>
```

---

## 📐 Spacing System

### Base Unit: 4px
```tsx
export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '2px',      // 0.5 × 4 = 2px
  1: '4px',        // 1 × 4 = 4px
  1.5: '6px',      // 1.5 × 4 = 6px
  2: '8px',        // 2 × 4 = 8px
  2.5: '10px',     // 2.5 × 4 = 10px
  3: '12px',       // 3 × 4 = 12px
  3.5: '14px',     // 3.5 × 4 = 14px
  4: '16px',       // 4 × 4 = 16px ⭐ Most common
  5: '20px',       // 5 × 4 = 20px
  6: '24px',       // 6 × 4 = 24px ⭐ Section spacing
  7: '28px',       // 7 × 4 = 28px
  8: '32px',       // 8 × 4 = 32px
  9: '36px',       // 9 × 4 = 36px
  10: '40px',      // 10 × 4 = 40px
  12: '48px',      // 12 × 4 = 48px ⭐ Large spacing
  14: '56px',      // 14 × 4 = 56px
  16: '64px',      // 16 × 4 = 64px
  20: '80px',      // 20 × 4 = 80px
  24: '96px',      // 24 × 4 = 96px ⭐ Section gaps
  32: '128px',     // 32 × 4 = 128px
}
```

### Common Spacing Patterns

#### Component Spacing
```tsx
// Button padding
className="px-6 py-3"  // 24px × 12px (touch-friendly)

// Card padding
className="p-6"        // 24px all sides (desktop)
className="p-4"        // 16px all sides (mobile)

// Input padding
className="px-4 py-3"  // 16px × 12px (comfortable)
```

#### Layout Spacing
```tsx
// Vertical rhythm (between sections)
className="space-y-6"  // 24px between elements

// Container padding
className="px-4 md:px-6 lg:px-8"  // Responsive padding

// Grid gaps
className="gap-4"      // 16px (cards)
className="gap-6"      // 24px (sections)
```

---

## 🎯 Component Library

### Button System

#### Size Variants
```tsx
export const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",           // Small: 12px × 6px, 14px text
  md: "px-4 py-2.5 text-base",         // Medium: 16px × 10px, 16px text
  lg: "px-6 py-3 text-base",           // Large: 24px × 12px, 16px text
  xl: "px-8 py-4 text-lg",             // Extra Large: 32px × 16px, 18px text
}
```

#### Color Variants
```tsx
export const buttonVariants = {
  primary: `
    bg-blue-600 text-white font-semibold rounded-lg
    hover:bg-blue-700 hover:shadow-md
    active:bg-blue-800 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-blue-300
    disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-all duration-200 ease-out
  `,

  secondary: `
    bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600
    hover:bg-blue-50 hover:border-blue-700
    active:bg-blue-100 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-blue-300
    disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed
    transition-all duration-200 ease-out
  `,

  ghost: `
    bg-transparent text-gray-700 font-medium rounded-lg
    hover:bg-gray-100
    active:bg-gray-200 active:scale-[0.98]
    focus:outline-none focus:ring-2 focus:ring-gray-300
    disabled:text-gray-400 disabled:cursor-not-allowed
    transition-all duration-150
  `,

  success: `
    bg-green-600 text-white font-semibold rounded-lg
    hover:bg-green-700 hover:shadow-md
    active:bg-green-800 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-green-300
    transition-all duration-200
  `,

  warning: `
    bg-amber-600 text-white font-semibold rounded-lg
    hover:bg-amber-700 hover:shadow-md
    active:bg-amber-800 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-amber-300
    transition-all duration-200
  `,

  danger: `
    bg-red-600 text-white font-semibold rounded-lg
    hover:bg-red-700 hover:shadow-md
    active:bg-red-800 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-red-300
    transition-all duration-200
  `,
}
```

#### Complete Button Component
```tsx
// /components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all"

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-4 focus:ring-blue-300",
    secondary: "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 active:bg-blue-100 focus:ring-4 focus:ring-blue-300",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-2 focus:ring-gray-300",
    success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-4 focus:ring-green-300",
    warning: "bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 focus:ring-4 focus:ring-amber-300",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-4 focus:ring-red-300",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  }

  const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed"
  const activeClasses = "active:scale-[0.98]"

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${activeClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  )
}
```

---

### Badge System

```tsx
export const badgeVariants = {
  success: "bg-green-100 text-green-800 border border-green-200",
  warning: "bg-amber-100 text-amber-800 border border-amber-200",
  error: "bg-red-100 text-red-800 border border-red-200",
  info: "bg-blue-100 text-blue-800 border border-blue-200",
  neutral: "bg-gray-100 text-gray-800 border border-gray-200",
  purple: "bg-purple-100 text-purple-800 border border-purple-200",
}

export const badgeSizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
}
```

**Usage:**
```tsx
<span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-sm font-medium">
  <Check className="w-3.5 h-3.5" />
  אושר
</span>
```

---

### Input System

```tsx
export const inputVariants = {
  default: `
    w-full px-4 py-3 text-base text-gray-900 bg-white
    border-2 border-gray-300 rounded-lg
    placeholder:text-gray-400
    focus:border-blue-500 focus:ring-4 focus:ring-blue-200
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-all duration-200
  `,

  error: `
    w-full px-4 py-3 text-base text-gray-900 bg-white
    border-2 border-red-500 rounded-lg
    placeholder:text-gray-400
    focus:border-red-600 focus:ring-4 focus:ring-red-200
    transition-all duration-200
  `,

  success: `
    w-full px-4 py-3 text-base text-gray-900 bg-white
    border-2 border-green-500 rounded-lg
    placeholder:text-gray-400
    focus:border-green-600 focus:ring-4 focus:ring-green-200
    transition-all duration-200
  `,
}
```

---

### Card System

```tsx
export const cardVariants = {
  default: `
    bg-white rounded-xl shadow-sm border border-gray-200
    hover:shadow-md
    transition-shadow duration-200
  `,

  elevated: `
    bg-white rounded-xl shadow-lg border border-gray-200
    hover:shadow-xl hover:-translate-y-1
    transition-all duration-300
  `,

  outlined: `
    bg-white rounded-xl border-2 border-gray-300
    hover:border-gray-400
    transition-colors duration-200
  `,

  highlighted: `
    bg-gradient-to-br from-blue-50 to-indigo-50
    border-2 border-blue-200 rounded-xl shadow-sm
    hover:shadow-md
    transition-shadow duration-200
  `,
}
```

---

## 🎬 Animation System

### Timing Functions
```tsx
export const easing = {
  easeOut: 'cubic-bezier(0.33, 1, 0.68, 1)',      // Default - decelerating
  easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',       // Accelerating (rare)
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',    // Smooth start/end
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',    // Bouncy
  linear: 'linear',                                // Constant speed
}
```

### Duration
```tsx
export const duration = {
  instant: '100ms',    // Micro-interactions (hover, active)
  fast: '150ms',       // Quick transitions
  normal: '200ms',     // Default animations
  slow: '300ms',       // Complex animations
  slower: '500ms',     // Page transitions
}
```

### Common Animations
```tsx
// Fade In
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
className="animate-[fadeIn_300ms_ease-out]"

// Scale On Hover
className="transition-transform hover:scale-105 duration-200"

// Active Press
className="active:scale-[0.98] transition-transform duration-100"

// Slide Up Toast
@keyframes slideUp {
  from { transform: translate(-50%, 100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

// Spinner
className="animate-spin"  // Built-in Tailwind
```

---

## 📱 Responsive Breakpoints

```tsx
export const breakpoints = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
}
```

### Mobile-First Strategy
```tsx
// Base: Mobile (375px+)
className="p-4 text-sm"

// Tablet (768px+)
className="p-4 md:p-6 text-sm md:text-base"

// Desktop (1024px+)
className="p-4 md:p-6 lg:p-8 text-sm md:text-base lg:text-lg"
```

---

## 🎯 Component Patterns

### Hero Section
```tsx
<section className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-xl shadow-lg p-6">
  <div className="flex items-center gap-3 mb-3">
    <div className="p-2 bg-blue-600 rounded-lg">
      <Link2 className="w-5 h-5 text-white" />
    </div>
    <h2 className="text-xl font-bold text-blue-900">קישור הרשמה לאירוע</h2>
  </div>
  <p className="text-sm text-blue-700 mb-4">שתף קישור זה עם המשתתפים</p>
  {/* Content */}
</section>
```

### Info Card
```tsx
<div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
    <div>
      <h3 className="text-sm font-semibold text-blue-900 mb-1">כותרת</h3>
      <p className="text-sm text-blue-700">תוכן ההודעה כאן</p>
    </div>
  </div>
</div>
```

### Status Badge
```tsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-sm font-medium">
  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
  אושר
</span>
```

### Icon Button (Touch-Friendly)
```tsx
<button className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Edit className="w-5 h-5" />
</button>
```

---

## ♿ Accessibility Standards

### Color Contrast (WCAG AAA)
```tsx
// ✅ PASS - 21:1 ratio
text-gray-900 on bg-white

// ✅ PASS - 12:1 ratio
text-gray-700 on bg-white

// ❌ FAIL - 4.5:1 ratio (needs 7:1 for AAA)
text-gray-600 on bg-white

// ✅ PASS - 7:1 ratio
text-blue-900 on bg-blue-50
```

### Touch Targets (iOS HIG)
```tsx
// ✅ Minimum 44x44px
className="min-w-[44px] min-h-[44px] p-2.5"

// ✅ Button with icon
<button className="px-6 py-3">  {/* 48px height */}
  <Icon className="w-5 h-5" />
</button>
```

### Focus Indicators
```tsx
// Always visible focus ring
className="focus:outline-none focus:ring-4 focus:ring-blue-300"

// Keyboard-only focus (with focus-visible)
className="focus-visible:ring-4 focus-visible:ring-blue-300"
```

### Screen Reader Support
```tsx
// Proper ARIA labels
<button aria-label="ערוך אירוע">
  <Edit className="w-5 h-5" />
</button>

// Live regions
<div role="alert" aria-live="polite">
  {errorMessage}
</div>

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  דלג לתוכן הראשי
</a>
```

---

## 🌐 Hebrew RTL Best Practices

### Direction
```tsx
// Page level
<html dir="rtl" lang="he">

// Component level
<div dir="rtl" className="text-right">
```

### Icons
```tsx
// Always use lucide-react icons (auto-flip in RTL)
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Avoid emojis in UI (not accessible, inconsistent rendering)
❌ "🔗 קישור"
✅ <Link2 className="w-4 h-4" /> קישור
```

### Flexbox/Grid
```tsx
// Use logical properties
className="gap-4"  // Works in both LTR and RTL

// Margins/Padding
className="ml-4"   // margin-left (not RTL-aware)
className="mr-4"   // margin-right (not RTL-aware)
className="ms-4"   // margin-inline-start (RTL-aware ✅)
className="me-4"   // margin-inline-end (RTL-aware ✅)
```

---

## 📦 Implementation

### Design Tokens File
Create `/lib/design-tokens.ts`:

```tsx
export const colors = {
  blue: { /* ... */ },
  green: { /* ... */ },
  // ... all colors
}

export const typography = {
  h1: "text-4xl font-bold leading-tight text-gray-900",
  // ... all variants
}

export const spacing = {
  /* ... */
}

export const buttonVariants = {
  /* ... */
}
```

### Usage in Components
```tsx
import { typography, buttonVariants } from '@/lib/design-tokens'

export function MyComponent() {
  return (
    <div>
      <h1 className={typography.h1}>כותרת</h1>
      <button className={buttonVariants.primary}>
        לחץ כאן
      </button>
    </div>
  )
}
```

---

## ✅ Design Checklist

Before shipping any component:

**Visual Design**
- [ ] Uses design system colors (blue, green, amber, red, gray)
- [ ] Follows 4px spacing grid
- [ ] Typography uses semantic classes (h1, h2, body, etc.)
- [ ] Consistent border-radius (rounded-lg = 8px)
- [ ] Proper shadows (shadow-sm, shadow-md, shadow-lg)

**Accessibility**
- [ ] Text contrast ≥ 7:1 (WCAG AAA)
- [ ] Touch targets ≥ 44x44px
- [ ] Focus indicators visible (ring-4)
- [ ] ARIA labels on icon-only buttons
- [ ] Keyboard navigation works

**Responsive**
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1024px+)
- [ ] Touch-friendly on mobile
- [ ] Readable text sizes

**Hebrew RTL**
- [ ] dir="rtl" applied
- [ ] Icons used instead of emojis
- [ ] Text aligns right
- [ ] Proper BiDi support

**Performance**
- [ ] Animations are 60fps
- [ ] No layout shifts (CLS < 0.1)
- [ ] Fast loading (<1.8s)

---

## 📚 Resources

- **Tailwind CSS 4:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **iOS HIG:** https://developer.apple.com/design/human-interface-guidelines/
- **Material Design 3:** https://m3.material.io

---

**Version History:**
- **1.0.0** (2026-01-10) - Initial design system created
