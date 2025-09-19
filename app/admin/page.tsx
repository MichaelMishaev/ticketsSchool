import { Calendar, Users, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">לוח בקרה</h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 mb-6 sm:mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="sm:mr-3 w-full sm:w-0 sm:flex-1">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  אירועים פעילים
                </dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">0</dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="sm:mr-3 w-full sm:w-0 sm:flex-1">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  סה"כ נרשמים
                </dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">0</dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="sm:mr-3 w-full sm:w-0 sm:flex-1">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  ממתינים ברשימת המתנה
                </dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">0</dd>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="sm:mr-3 w-full sm:w-0 sm:flex-1">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  אחוז תפוסה
                </dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">0%</dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            אירועים אחרונים
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center text-gray-500">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg">אין אירועים עדיין</p>
            <Link
              href="/admin/events/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              צור אירוע חדש
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}