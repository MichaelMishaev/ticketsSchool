'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TableData {
  name: string
  count: number
  data: any[]
}

export default function AdminProdDashboard() {
  const router = useRouter()
  const [tables, setTables] = useState<TableData[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('Event')
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem('adminProdAuth')
    if (isAuthenticated !== 'true') {
      router.push('/admin-prod')
      return
    }

    // Load initial data
    loadTables()
  }, [router])

  const loadTables = async () => {
    try {
      const response = await fetch('/api/admin-prod/tables', {
        headers: {
          'x-admin-prod-auth': 'authenticated-6262'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTables(data)
        if (data.length > 0) {
          loadTableData(data[0].name)
        }
      }
    } catch (error) {
      console.error('Error loading tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTableData = async (tableName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin-prod/table-data?table=${tableName}`, {
        headers: {
          'x-admin-prod-auth': 'authenticated-6262'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTableData(data)
        setSelectedTable(tableName)
      }
    } catch (error) {
      console.error('Error loading table data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tableName: string, id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return

    try {
      const response = await fetch(`/api/admin-prod/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-prod-auth': 'authenticated-6262'
        },
        body: JSON.stringify({ table: tableName, id })
      })

      if (response.ok) {
        loadTableData(tableName)
      }
    } catch (error) {
      console.error('Error deleting record:', error)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminProdAuth')
    router.push('/admin-prod')
  }

  const handleBackToAdmin = () => {
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold">Production Database Viewer</h1>
            <div className="flex gap-2">
              <button
                onClick={handleBackToAdmin}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Back to Admin
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-6">
          {tables.map((table) => (
            <button
              key={table.name}
              onClick={() => loadTableData(table.name)}
              className={`px-4 py-2 rounded ${
                selectedTable === table.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border hover:bg-gray-50'
              }`}
            >
              {table.name} ({table.count})
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">{selectedTable} Table</h2>
          </div>

          {tableData.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {tableData.length > 0 &&
                      Object.keys(tableData[0]).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((row) => (
                    <tr key={row.id}>
                      {Object.entries(row).map(([key, value]) => (
                        <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(selectedTable, row.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}