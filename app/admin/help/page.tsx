'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  X,
  Menu,
  ChevronDown,
  ChevronRight,
  Rocket,
  Calendar,
  Grid3x3,
  QrCode,
  ShieldAlert,
  Users,
  Lock,
  Filter as FilterIcon,
  Settings,
  BarChart3,
  Clock,
  Ban,
  Image as ImageIcon,
  UserPlus,
  MessageSquare,
  Crown,
  Globe,
  FileDown,
  Mail,
  Wrench,
  Star,
  Sparkles,
  BookOpen,
  Copy,
  Share2,
  Check,
  Info,
  AlertCircle
} from 'lucide-react'
import { wikiCategories, searchFeatures, filterFeatures, type WikiCategory, type WikiFeature, type FeatureType, type UserRole, type DifficultyLevel } from '@/lib/wiki-data'
import ReactMarkdown from 'react-markdown'

// Icon mapping
const iconMap: Record<string, any> = {
  Rocket,
  Calendar,
  Grid3x3,
  QrCode,
  ShieldAlert,
  Users,
  Lock,
  Settings,
  BarChart3,
  Clock,
  Ban,
  Image: ImageIcon,
  UserPlus,
  MessageSquare,
  Crown,
  Globe,
  FileDown,
  Mail,
  Wrench
}

// Color schemes for categories
const colorSchemes: Record<string, {bg: string, border: string, text: string, hover: string, badge: string}> = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-100',
    badge: 'bg-blue-100 text-blue-700'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    hover: 'hover:bg-purple-100',
    badge: 'bg-purple-100 text-purple-700'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    hover: 'hover:bg-green-100',
    badge: 'bg-green-100 text-green-700'
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    hover: 'hover:bg-orange-100',
    badge: 'bg-orange-100 text-orange-700'
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    hover: 'hover:bg-red-100',
    badge: 'bg-red-100 text-red-700'
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    hover: 'hover:bg-indigo-100',
    badge: 'bg-indigo-100 text-indigo-700'
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    hover: 'hover:bg-pink-100',
    badge: 'bg-pink-100 text-pink-700'
  },
  teal: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    hover: 'hover:bg-teal-100',
    badge: 'bg-teal-100 text-teal-700'
  }
}

export default function HelpWikiPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['getting-started']))
  const [selectedFeature, setSelectedFeature] = useState<WikiFeature | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [language, setLanguage] = useState<'en' | 'he'>('he')
  const [showFilters, setShowFilters] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<FeatureType[]>([])
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel[]>([])

  // Filter and search features
  const filteredFeatures = useMemo(() => {
    let features = searchQuery.trim()
      ? searchFeatures(searchQuery, language)
      : filterFeatures({
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          types: selectedTypes.length > 0 ? selectedTypes : undefined,
          roles: selectedRoles.length > 0 ? selectedRoles : undefined,
          difficulty: selectedDifficulty.length > 0 ? selectedDifficulty : undefined
        })

    return features
  }, [searchQuery, language, selectedCategories, selectedTypes, selectedRoles, selectedDifficulty])

  // Filter categories to show only those with matching features
  const visibleCategories = useMemo(() => {
    if (!searchQuery.trim() && selectedCategories.length === 0 && selectedTypes.length === 0 && selectedRoles.length === 0 && selectedDifficulty.length === 0) {
      return wikiCategories
    }

    return wikiCategories.filter(category =>
      category.features.some(feature => filteredFeatures.includes(feature))
    )
  }, [wikiCategories, filteredFeatures, searchQuery, selectedCategories, selectedTypes, selectedRoles, selectedDifficulty])

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Select feature
  const selectFeature = (feature: WikiFeature) => {
    setSelectedFeature(feature)
    setSidebarOpen(false) // Close mobile sidebar after selection
  }

  // Copy code
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Share feature
  const shareFeature = () => {
    if (selectedFeature) {
      const url = `${window.location.origin}/admin/help#${selectedFeature.id}`
      navigator.clipboard.writeText(url)
      alert(language === 'he' ? 'הקישור הועתק!' : 'Link copied!')
    }
  }

  // Load feature from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const feature = filteredFeatures.find(f => f.id === hash)
      if (feature) {
        setSelectedFeature(feature)
        // Expand the category
        setExpandedCategories(prev => new Set([...prev, feature.category]))
      }
    }
  }, [])

  // Feature type badge
  const FeatureTypeBadge = ({ type }: { type: FeatureType }) => {
    const badges = {
      NEW: { text: language === 'he' ? 'חדש' : 'NEW', className: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' },
      UPDATED: { text: language === 'he' ? 'עודכן' : 'UPDATED', className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' },
      CORE: { text: language === 'he' ? 'ליבה' : 'CORE', className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' },
      ADVANCED: { text: language === 'he' ? 'מתקדם' : 'ADVANCED', className: 'bg-gradient-to-r from-orange-500 to-red-500 text-white' },
      BETA: { text: language === 'he' ? 'בטא' : 'BETA', className: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' }
    }
    const badge = badges[type]
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${badge.className} shadow-sm`}>
        {badge.text}
      </span>
    )
  }

  // Difficulty badge
  const DifficultyBadge = ({ difficulty }: { difficulty: DifficultyLevel }) => {
    const badges = {
      beginner: { text: language === 'he' ? 'מתחיל' : 'Beginner', className: 'bg-green-100 text-green-700', icon: '⭐' },
      intermediate: { text: language === 'he' ? 'בינוני' : 'Intermediate', className: 'bg-yellow-100 text-yellow-700', icon: '⭐⭐' },
      advanced: { text: language === 'he' ? 'מתקדם' : 'Advanced', className: 'bg-red-100 text-red-700', icon: '⭐⭐⭐' }
    }
    const badge = badges[difficulty]
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        <span>{badge.icon}</span>
        <span>{badge.text}</span>
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={language === 'he' ? 'תפריט' : 'Menu'}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {language === 'he' ? 'מרכז העזרה' : 'Help Center'}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {language === 'he' ? 'TicketCap Wiki' : 'TicketCap Wiki'}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={language === 'he' ? 'חפש תכונות, מדריכים...' : 'Search features, guides...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900
                           focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                           transition-all duration-200 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${showFilters ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <FilterIcon className="w-4 h-4" />
                <span className="hidden lg:inline">{language === 'he' ? 'סינון' : 'Filters'}</span>
              </button>
              <button
                onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
                className="px-4 py-2 rounded-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white
                         hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {language === 'he' ? 'EN' : 'עב'}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={language === 'he' ? 'חפש...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900
                         focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b-2 border-gray-200 shadow-sm">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  {language === 'he' ? 'קטגוריות' : 'Categories'}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {wikiCategories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat.id])
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat.id))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{language === 'he' ? cat.nameHe : cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  {language === 'he' ? 'סוג' : 'Type'}
                </label>
                <div className="space-y-2">
                  {(['NEW', 'UPDATED', 'CORE', 'ADVANCED', 'BETA'] as FeatureType[]).map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTypes([...selectedTypes, type])
                          } else {
                            setSelectedTypes(selectedTypes.filter(t => t !== type))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <FeatureTypeBadge type={type} />
                    </label>
                  ))}
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  {language === 'he' ? 'תפקיד' : 'Role'}
                </label>
                <div className="space-y-2">
                  {(['ALL', 'SUPER_ADMIN', 'OWNER', 'ADMIN', 'MANAGER', 'VIEWER'] as UserRole[]).map(role => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoles([...selectedRoles, role])
                          } else {
                            setSelectedRoles(selectedRoles.filter(r => r !== role))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  {language === 'he' ? 'קושי' : 'Difficulty'}
                </label>
                <div className="space-y-2">
                  {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map(diff => (
                    <label key={diff} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedDifficulty.includes(diff)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDifficulty([...selectedDifficulty, diff])
                          } else {
                            setSelectedDifficulty(selectedDifficulty.filter(d => d !== diff))
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <DifficultyBadge difficulty={diff} />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategories.length > 0 || selectedTypes.length > 0 || selectedRoles.length > 0 || selectedDifficulty.length > 0) && (
              <button
                onClick={() => {
                  setSelectedCategories([])
                  setSelectedTypes([])
                  setSelectedRoles([])
                  setSelectedDifficulty([])
                }}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                {language === 'he' ? 'נקה סינון' : 'Clear Filters'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-[1920px] mx-auto flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 bottom-0 z-40
            w-80 bg-white border-l-2 border-gray-200 overflow-y-auto
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : language === 'he' ? 'translate-x-full' : '-translate-x-full'}
            lg:translate-x-0 lg:block
            shadow-xl lg:shadow-none
          `}
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          <div className="p-6 space-y-2">
            {/* Results count */}
            {(searchQuery || selectedCategories.length > 0 || selectedTypes.length > 0) && (
              <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-700">
                  {language === 'he'
                    ? `נמצאו ${filteredFeatures.length} תוצאות`
                    : `${filteredFeatures.length} results found`
                  }
                </p>
              </div>
            )}

            {visibleCategories.map(category => {
              const Icon = iconMap[category.icon]
              const colorScheme = colorSchemes[category.color] || colorSchemes.blue
              const isExpanded = expandedCategories.has(category.id)
              const categoryFeatures = category.features.filter(f => filteredFeatures.includes(f))

              if (categoryFeatures.length === 0 && (searchQuery || selectedCategories.length > 0)) {
                return null // Hide empty categories when filtering
              }

              return (
                <div key={category.id} className="space-y-1">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200
                      ${isExpanded ? `${colorScheme.bg} ${colorScheme.border} border-2` : 'hover:bg-gray-50'}
                    `}
                  >
                    {Icon && <Icon className={`w-5 h-5 ${isExpanded ? colorScheme.text : 'text-gray-600'}`} />}
                    <span className={`flex-1 text-right font-bold text-sm ${isExpanded ? colorScheme.text : 'text-gray-700'}`}>
                      {language === 'he' ? category.nameHe : category.name}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorScheme.badge}`}>
                      {categoryFeatures.length}
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {/* Features List */}
                  {isExpanded && (
                    <div className="mr-8 space-y-1">
                      {categoryFeatures.map(feature => (
                        <button
                          key={feature.id}
                          onClick={() => selectFeature(feature)}
                          className={`w-full text-right p-3 rounded-lg transition-all duration-200 group
                            ${selectedFeature?.id === feature.id
                              ? `${colorScheme.bg} ${colorScheme.border} border-2 shadow-sm`
                              : 'hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1">
                              {feature.type === 'NEW' && <Sparkles className="w-3 h-3 text-green-500" />}
                              {feature.difficulty === 'advanced' && <Star className="w-3 h-3 text-orange-500" />}
                            </div>
                            <span className={`text-sm font-medium ${selectedFeature?.id === feature.id ? colorScheme.text : 'text-gray-700'}`}>
                              {language === 'he' ? feature.titleHe : feature.title}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {language === 'he' ? feature.descriptionHe : feature.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-12">
          {selectedFeature ? (
            <article className="max-w-4xl mx-auto">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="hover:text-gray-700 transition-colors"
                >
                  {language === 'he' ? 'ראשי' : 'Home'}
                </button>
                <ChevronRight className="w-4 h-4" />
                <span>{language === 'he' ? wikiCategories.find(c => c.id === selectedFeature.category)?.nameHe : wikiCategories.find(c => c.id === selectedFeature.category)?.name}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">{language === 'he' ? selectedFeature.titleHe : selectedFeature.title}</span>
              </nav>

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">
                      {language === 'he' ? selectedFeature.titleHe : selectedFeature.title}
                    </h1>
                    <p className="text-xl text-gray-600">
                      {language === 'he' ? selectedFeature.descriptionHe : selectedFeature.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={shareFeature}
                      className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title={language === 'he' ? 'שתף' : 'Share'}
                    >
                      <Share2 className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3">
                  <FeatureTypeBadge type={selectedFeature.type} />
                  <DifficultyBadge difficulty={selectedFeature.difficulty} />
                  <span className="text-sm text-gray-500">
                    {language === 'he' ? 'עודכן' : 'Updated'}: {new Date(selectedFeature.lastUpdated).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-lg max-w-none mb-12 bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm">
                <ReactMarkdown
                  components={{
                    code: ({ node, className, children, ...props }: any) => {
                      const code = String(children).replace(/\n$/, '')
                      const inline = !className
                      return !inline ? (
                        <div className="relative group">
                          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                          <button
                            onClick={() => copyCode(code)}
                            className="absolute top-2 left-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      ) : (
                        <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded" {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {language === 'he' ? selectedFeature.contentHe : selectedFeature.content}
                </ReactMarkdown>
              </div>

              {/* Examples */}
              {selectedFeature.examples && selectedFeature.examples.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                    {language === 'he' ? 'דוגמאות' : 'Examples'}
                  </h2>
                  <div className="grid gap-6">
                    {selectedFeature.examples.map((example, index) => (
                      <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {language === 'he' ? example.titleHe : example.title}
                        </h3>
                        <p className="text-gray-700 mb-4">
                          {language === 'he' ? example.descriptionHe : example.description}
                        </p>
                        {example.code && (
                          <div className="relative group">
                            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                              <code>{example.code}</code>
                            </pre>
                            <button
                              onClick={() => copyCode(example.code!)}
                              className="absolute top-2 left-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Features */}
              {selectedFeature.relatedFeatures && selectedFeature.relatedFeatures.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Info className="w-6 h-6 text-blue-500" />
                    {language === 'he' ? 'תכונות קשורות' : 'Related Features'}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedFeature.relatedFeatures.map(relatedId => {
                      const related = filteredFeatures.find(f => f.id === relatedId)
                      if (!related) return null
                      const category = wikiCategories.find(c => c.id === related.category)
                      const colorScheme = category ? colorSchemes[category.color] : colorSchemes.blue

                      return (
                        <button
                          key={relatedId}
                          onClick={() => selectFeature(related)}
                          className={`p-4 rounded-lg border-2 ${colorScheme.border} ${colorScheme.hover} transition-all duration-200 text-right group`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <ChevronRight className={`w-5 h-5 ${colorScheme.text} group-hover:translate-x-1 transition-transform`} />
                            <span className="font-bold text-gray-900">
                              {language === 'he' ? related.titleHe : related.title}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {language === 'he' ? related.descriptionHe : related.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </article>
          ) : (
            /* Welcome Screen */
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-2xl">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                  {language === 'he' ? 'ברוכים הבאים למרכז העזרה' : 'Welcome to Help Center'}
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  {language === 'he'
                    ? 'גלה את כל התכונות, המדריכים והטיפים שתצטרך כדי למקסם את TicketCap'
                    : 'Discover all the features, guides, and tips you need to maximize TicketCap'
                  }
                </p>
              </div>

              {/* Quick Start Guide */}
              <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 rounded-2xl p-8 mb-12 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <Rocket className="w-8 h-8 text-blue-600" />
                  <h2 className="text-3xl font-bold text-gray-900">
                    {language === 'he' ? 'התחלה מהירה' : 'Quick Start'}
                  </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 border-2 border-white hover:border-blue-300 transition-all duration-200 shadow-sm">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {language === 'he' ? 'צור אירוע' : 'Create Event'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'he' ? 'התחל עם יצירת האירוע הראשון שלך תוך דקות' : 'Start by creating your first event in minutes'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border-2 border-white hover:border-purple-300 transition-all duration-200 shadow-sm">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-purple-600">2</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {language === 'he' ? 'שתף קישור' : 'Share Link'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'he' ? 'שתף את קישור ההרשמה עם המשתתפים שלך' : 'Share the registration link with your attendees'}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border-2 border-white hover:border-pink-300 transition-all duration-200 shadow-sm">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-pink-600">3</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      {language === 'he' ? 'עקוב בזמן אמת' : 'Track Real-time'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'he' ? 'ראה הרשמות ונוכחות בזמן אמת' : 'See registrations and attendance in real-time'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  {language === 'he' ? 'תכונות מובילות' : 'Featured'}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFeatures.filter(f => f.type === 'NEW').slice(0, 6).map(feature => {
                    const category = wikiCategories.find(c => c.id === feature.category)
                    const colorScheme = category ? colorSchemes[category.color] : colorSchemes.blue

                    return (
                      <button
                        key={feature.id}
                        onClick={() => selectFeature(feature)}
                        className={`p-6 rounded-xl border-2 ${colorScheme.border} ${colorScheme.hover} transition-all duration-200 text-right group hover:shadow-lg`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <FeatureTypeBadge type={feature.type} />
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-lg">
                          {language === 'he' ? feature.titleHe : feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {language === 'he' ? feature.descriptionHe : feature.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <DifficultyBadge difficulty={feature.difficulty} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Browse by Category */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  {language === 'he' ? 'עיון לפי קטגוריה' : 'Browse by Category'}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {wikiCategories.slice(0, 8).map(category => {
                    const Icon = iconMap[category.icon]
                    const colorScheme = colorSchemes[category.color]

                    return (
                      <button
                        key={category.id}
                        onClick={() => {
                          toggleCategory(category.id)
                          setSidebarOpen(true)
                        }}
                        className={`p-6 rounded-xl border-2 ${colorScheme.border} ${colorScheme.hover} transition-all duration-200 group hover:shadow-lg`}
                      >
                        <div className={`w-12 h-12 ${colorScheme.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          {Icon && <Icon className={`w-6 h-6 ${colorScheme.text}`} />}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">
                          {language === 'he' ? category.nameHe : category.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {language === 'he' ? category.descriptionHe : category.description}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colorScheme.badge}`}>
                          {category.features.length} {language === 'he' ? 'תכונות' : 'features'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
