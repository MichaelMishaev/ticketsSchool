'use client'

import { useState } from 'react'
import { Users, UtensilsCrossed, ListOrdered, ChevronLeft } from 'lucide-react'
import Modal from '../Modal'
import { tableOccupiedSpots, isTableEmpty, type TableRegistration } from './table-helpers'

interface Table {
  id: string
  tableNumber: string
  capacity: number
  minOrder: number
  status: 'AVAILABLE' | 'RESERVED' | 'INACTIVE'
  hasWaitlistMatch?: boolean
  // Sharing-aware: may host multiple CONFIRMED registrations.
  registrations: TableRegistration[]
}

interface WaitlistEntry {
  id: string
  confirmationCode: string
  guestsCount: number | null
  phoneNumber: string | null
  waitlistPriority: number | null
  data: any
  createdAt: string | Date
  matchingTables?: any[]
  bestTable?: any
  hasMatch?: boolean
}

interface TableBoardStatsProps {
  tables: Table[]
  waitlist: WaitlistEntry[]
  stats: {
    total: number
    available: number
    reserved: number
    waitlistCount: number
    matchAvailable: number
  }
}

export default function TableBoardStats({ tables, waitlist, stats }: TableBoardStatsProps) {
  const [activeModal, setActiveModal] = useState<
    'total' | 'available' | 'reserved' | 'waitlist' | null
  >(null)

  const getModalConfig = () => {
    switch (activeModal) {
      case 'total':
        return {
          title: 'סה״כ שולחנות',
          type: 'info' as const,
          items: tables,
          renderItem: (t: Table) => (
            <div
              key={t.id}
              className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100"
            >
              <div>
                <div className="font-semibold text-blue-900">שולחן {t.tableNumber}</div>
                <div className="text-xs text-blue-700 mt-1">
                  סטטוס:{' '}
                  {t.status === 'AVAILABLE' ? 'פנוי' : t.status === 'RESERVED' ? 'תפוס' : 'מוחזק'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-blue-800">{t.capacity} מקומות</div>
                <div className="text-xs text-blue-600">מינימום {t.minOrder}</div>
              </div>
            </div>
          ),
        }
      case 'available':
        return {
          title: 'שולחנות פנויים',
          type: 'success' as const,
          items: tables.filter((t) => t.status === 'AVAILABLE'),
          renderItem: (t: Table) => (
            <div
              key={t.id}
              className="flex justify-between items-center p-3 bg-green-50/50 rounded-lg border border-green-100"
            >
              <div>
                <div className="font-semibold text-green-900">שולחן {t.tableNumber}</div>
                {t.hasWaitlistMatch && (
                  <div className="text-xs text-amber-600 mt-1">✨ יש התאמה בהמתנה</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium text-green-800">{t.capacity} מקומות</div>
                <div className="text-xs text-green-600">מינימום {t.minOrder}</div>
              </div>
            </div>
          ),
        }
      case 'reserved':
        return {
          title: 'שולחנות תפוסים',
          type: 'error' as const,
          items: tables.filter((t) => t.status === 'RESERVED' || t.status === 'INACTIVE'),
          renderItem: (t: Table) => {
            // Sharing-aware summary: show how many regs share the table
            // and total occupied spots. INACTIVE (empty hold) shows "מוחזק".
            const regCount = t.registrations.length
            const occ = tableOccupiedSpots(t)
            const empty = isTableEmpty(t)
            const summary = empty
              ? 'מוחזק (סגור)'
              : regCount === 1
                ? `קוד: ${t.registrations[0].confirmationCode}`
                : `${regCount} הזמנות משותפות`
            return (
              <div
                key={t.id}
                className="flex justify-between items-center p-3 bg-red-50/50 rounded-lg border border-red-100"
              >
                <div>
                  <div className="font-semibold text-red-900">שולחן {t.tableNumber}</div>
                  <div className="text-xs text-red-700 mt-1">{summary}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-red-800">{t.capacity} מקומות</div>
                  {!empty && (
                    <div className="text-xs text-red-600">
                      {occ} {occ === 1 ? 'אורח' : 'אורחים'}
                    </div>
                  )}
                </div>
              </div>
            )
          },
        }
      case 'waitlist':
        return {
          title: 'רשימת המתנה',
          type: 'warning' as const,
          items: waitlist,
          renderItem: (w: WaitlistEntry) => (
            <div
              key={w.id}
              className="flex justify-between items-center p-3 bg-amber-50/50 rounded-lg border border-amber-100"
            >
              <div>
                <div className="font-semibold text-amber-900">
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full ml-2">
                    #{w.waitlistPriority}
                  </span>
                  {w.confirmationCode}
                </div>
                {w.hasMatch && <div className="text-xs text-green-600 mt-1">✨ נמצאה התאמה</div>}
              </div>
              <div className="text-right">
                <div className="font-medium text-amber-800">{w.guestsCount || '?'} אורחים</div>
                {w.phoneNumber && <div className="text-xs text-amber-600">{w.phoneNumber}</div>}
              </div>
            </div>
          ),
        }
      default:
        return null
    }
  }

  const modalConfig = getModalConfig()

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="סה״כ שולחנות"
          value={stats.total}
          icon={<UtensilsCrossed className="w-5 h-5" />}
          color="blue"
          onClick={() => setActiveModal('total')}
        />
        <StatCard
          label="פנויים"
          value={stats.available}
          icon={<Users className="w-5 h-5" />}
          color="green"
          onClick={() => setActiveModal('available')}
        />
        <StatCard
          label="תפוסים"
          value={stats.reserved}
          icon={<Users className="w-5 h-5" />}
          color="red"
          onClick={() => setActiveModal('reserved')}
        />
        <StatCard
          label="רשימת המתנה"
          value={stats.waitlistCount}
          icon={<ListOrdered className="w-5 h-5" />}
          color="amber"
          onClick={() => setActiveModal('waitlist')}
        />
      </div>

      <Modal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={modalConfig?.title || ''}
        type={modalConfig?.type}
        size="md"
      >
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pl-2" dir="rtl">
          {modalConfig?.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">אין נתונים להצגה</div>
          ) : (
            modalConfig?.items.map((item: any) => modalConfig.renderItem(item))
          )}
        </div>
      </Modal>
    </>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
  onClick,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red' | 'amber'
  onClick: () => void
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      gradient: 'from-blue-500/10 to-blue-600/5',
      hover: 'hover:border-blue-300 hover:ring-2 hover:ring-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      gradient: 'from-green-500/10 to-green-600/5',
      hover: 'hover:border-green-300 hover:ring-2 hover:ring-green-100',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      gradient: 'from-red-500/10 to-red-600/5',
      hover: 'hover:border-red-300 hover:ring-2 hover:ring-red-100',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      gradient: 'from-amber-500/10 to-amber-600/5',
      hover: 'hover:border-amber-300 hover:ring-2 hover:ring-amber-100',
    },
  }

  const colors = colorClasses[color]

  return (
    <button
      onClick={onClick}
      className={`relative w-full text-right overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm transition-all cursor-pointer ${colors.hover}`}
    >
      {/* Subtle gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} pointer-events-none`}
      />

      <div className="relative p-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.icon} flex-shrink-0`}>{icon}</div>
          <ChevronLeft className="w-4 h-4 text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="mt-3">
          <div className="text-3xl font-bold text-gray-900 leading-none mb-1">{value}</div>
          <div className="text-sm text-gray-600 font-medium">{label}</div>
        </div>
      </div>
    </button>
  )
}
