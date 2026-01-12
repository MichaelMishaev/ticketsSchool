'use client'

import { useState } from 'react'
import { UtensilsCrossed, ListOrdered } from 'lucide-react'

interface TableBoardTabsProps {
  tablesView: React.ReactNode
  waitlistView: React.ReactNode
  waitlistCount: number
}

export default function TableBoardTabs({ tablesView, waitlistView, waitlistCount }: TableBoardTabsProps) {
  const [activeTab, setActiveTab] = useState<'tables' | 'waitlist'>('tables')

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" dir="rtl">
            <button
              onClick={() => setActiveTab('tables')}
              className={`
                flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'tables'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span>מצב שולחנות</span>
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`
                flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === 'waitlist'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <ListOrdered className="w-5 h-5" />
              <span>רשימת המתנה</span>
              {waitlistCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                  {waitlistCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'tables' && tablesView}
        {activeTab === 'waitlist' && waitlistView}
      </div>
    </div>
  )
}
