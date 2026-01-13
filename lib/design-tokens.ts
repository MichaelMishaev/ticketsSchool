/**
 * Design System Tokens - TicketCap 2026
 *
 * Centralized design system following WCAG 2.1 AAA standards
 * @see /docs/DESIGN_SYSTEM_2026.md
 */

// Typography System
export const typography = {
  // Display (Hero sections)
  display: 'text-5xl font-bold leading-tight tracking-tight text-gray-900',

  // Headings
  h1: 'text-4xl font-bold leading-tight text-gray-900',
  h2: 'text-3xl font-bold leading-tight text-gray-900',
  h3: 'text-2xl font-bold leading-snug text-gray-900',
  h4: 'text-xl font-semibold leading-snug text-gray-800',
  h5: 'text-lg font-semibold leading-normal text-gray-800',

  // Body Text
  body: 'text-base leading-relaxed text-gray-700',
  bodyLarge: 'text-lg leading-relaxed text-gray-700',
  bodySmall: 'text-sm leading-normal text-gray-700',

  // Supporting Text
  caption: 'text-sm leading-normal text-gray-600',
  micro: 'text-xs leading-snug text-gray-500',

  // Labels
  label: 'text-sm font-medium leading-normal text-gray-900',
  labelSmall: 'text-xs font-medium leading-snug text-gray-900',

  // Special
  overline: 'text-xs font-semibold uppercase tracking-wide text-gray-700',
  code: 'font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-900',
}

// Button Variants
export const buttonVariants = {
  primary: `
    inline-flex items-center justify-center gap-2
    bg-blue-600 text-white font-semibold rounded-lg
    hover:bg-blue-700 hover:shadow-md
    active:bg-blue-800 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-blue-300
    disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-all duration-200 ease-out
  `,

  secondary: `
    inline-flex items-center justify-center gap-2
    bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600
    hover:bg-blue-50 hover:border-blue-700
    active:bg-blue-100 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-blue-300
    disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed
    transition-all duration-200 ease-out
  `,

  ghost: `
    inline-flex items-center justify-center gap-2
    bg-transparent text-gray-700 font-medium rounded-lg
    hover:bg-gray-100
    active:bg-gray-200 active:scale-[0.98]
    focus:outline-none focus:ring-2 focus:ring-gray-300
    disabled:text-gray-400 disabled:cursor-not-allowed
    transition-all duration-150
  `,

  success: `
    inline-flex items-center justify-center gap-2
    bg-green-600 text-white font-semibold rounded-lg
    hover:bg-green-700 hover:shadow-md
    active:bg-green-800 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-green-300
    disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-all duration-200
  `,

  warning: `
    inline-flex items-center justify-center gap-2
    bg-amber-600 text-white font-semibold rounded-lg
    hover:bg-amber-700 hover:shadow-md
    active:bg-amber-800 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-amber-300
    disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-all duration-200
  `,

  danger: `
    inline-flex items-center justify-center gap-2
    bg-red-600 text-white font-semibold rounded-lg
    hover:bg-red-700 hover:shadow-md
    active:bg-red-800 active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-red-300
    disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
    transition-all duration-200
  `,
}

// Button Sizes
export const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2.5 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
  xl: 'px-8 py-4 text-lg min-h-[56px]',
}

// Badge Variants
export const badgeVariants = {
  success:
    'inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-sm font-medium',
  warning:
    'inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-sm font-medium',
  error:
    'inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full text-sm font-medium',
  info: 'inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-sm font-medium',
  neutral:
    'inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-full text-sm font-medium',
  purple:
    'inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-sm font-medium',
}

// Input Variants
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

// Card Variants
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

// Icon Button (Touch-Friendly)
export const iconButton = {
  primary:
    'p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-300',
  success:
    'p-2.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-300',
  warning:
    'p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-300',
  danger:
    'p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-300',
  ghost:
    'p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-300',
}

// Status Dot Colors
export const statusDots = {
  open: 'w-2 h-2 bg-green-500 rounded-full',
  paused: 'w-2 h-2 bg-yellow-500 rounded-full',
  closed: 'w-2 h-2 bg-gray-400 rounded-full',
  confirmed: 'w-2 h-2 bg-green-500 rounded-full',
  waitlist: 'w-2 h-2 bg-yellow-500 rounded-full',
  cancelled: 'w-2 h-2 bg-red-500 rounded-full',
}

// ============================================================================
// MODERN MINIMAL REDESIGN 2026 - New Unified Standards
// ============================================================================

/**
 * Color Palette - Modern Minimal
 *
 * Neutral grays for primary UI, semantic colors for status only
 */
export const colors = {
  // Neutrals (Primary UI)
  neutral: {
    50: '#f9fafb', // Page background
    100: '#f3f4f6', // Card hover states
    200: '#e5e7eb', // Borders
    600: '#4b5563', // Secondary text
    900: '#111827', // Primary text
  },

  // Semantic (Status indicators only)
  success: '#10b981', // Green-500
  warning: '#f59e0b', // Amber-500
  error: '#ef4444', // Red-500
  info: '#3b82f6', // Blue-500
}

/**
 * Unified Card System
 *
 * All cards use rounded-lg (8px) for consistency
 */
export const modernCards = {
  // Base card - most common
  base: 'bg-white rounded-lg border border-gray-200 p-4',

  // Interactive card (clickable, hoverable)
  interactive:
    'bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer',

  // Elevated card (with subtle shadow)
  elevated: 'bg-white rounded-lg shadow-sm p-4',

  // Section card (for grouping content)
  section: 'bg-white rounded-lg border border-gray-200 p-6',
}

/**
 * Unified Badge System
 *
 * Consistent badge styling across all components
 */
export const modernBadges = {
  base: 'px-3 py-1 rounded-full text-sm font-medium border',

  // Status badges (semantic colors)
  success:
    'px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200',
  warning:
    'px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200',
  error: 'px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200',
  info: 'px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200',
  neutral:
    'px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200',
}

/**
 * Unified Button System
 *
 * Primary CTA uses gray-900 (neutral), semantic colors for specific actions only
 */
export const modernButtons = {
  // Primary CTA (neutral gray-900)
  primary:
    'px-6 py-3 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-gray-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/20',

  // Secondary (outlined)
  secondary:
    'px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-gray-400/20',

  // Ghost (minimal)
  ghost:
    'px-4 py-2 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-100 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-gray-300',

  // Semantic actions
  success:
    'px-6 py-3 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-green-300',
  danger:
    'px-6 py-3 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-red-300',
}

/**
 * Spacing Standards
 *
 * Consistent spacing throughout the app
 */
export const spacing = {
  // Between sections
  section: 'space-y-6',
  sectionGap: 'gap-6',

  // Card padding
  cardPadding: 'p-4',
  cardPaddingLarge: 'p-6',

  // Container padding
  container: 'px-4 sm:px-6 lg:px-8',
  containerVertical: 'py-6',

  // Grid gaps
  gridGap: 'gap-4',
  gridGapLarge: 'gap-6',
}
