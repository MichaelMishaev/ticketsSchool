import { requireSuperAdmin } from '@/lib/auth.server'
import { redirect } from 'next/navigation'
import StatisticsDashboard from './StatisticsDashboard'

/**
 * Super Admin Statistics Dashboard
 * Provides comprehensive analytics across all schools:
 * - Revenue & payments (YaadPay)
 * - Registrations & capacity
 * - Check-in attendance
 * - Platform health metrics
 */
export default async function StatisticsPage() {
  try {
    // Enforce Super Admin access
    await requireSuperAdmin()
  } catch {
    // Not authorized, redirect to admin dashboard
    redirect('/admin')
  }

  return <StatisticsDashboard />
}
