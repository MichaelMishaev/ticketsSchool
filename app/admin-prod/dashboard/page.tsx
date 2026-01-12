'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

interface TableData {
  name: string
  count: number
  data: Record<string, any>[]
}

export default function AdminProdDashboard() {
  const router = useRouter()
  const [tables, setTables] = useState<TableData[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('Event')
  const [tableData, setTableData] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [currentView, setCurrentView] = useState<'prisma' | 'logs'>('prisma')
  const [logs, setLogs] = useState<Record<string, any>[]>([])
  const [logFilters, setLogFilters] = useState({
    level: 'all',
    source: 'all',
    search: ''
  })

  useEffect(() => {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem('adminProdAuth')
    if (isAuthenticated !== 'true') {
      router.push('/admin-prod')
      return
    }

    // Load initial data
    loadTables()
    if (currentView === 'logs') {
      loadLogs()
    }
  }, [router, currentView])

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

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (logFilters.level !== 'all') params.append('level', logFilters.level)
      if (logFilters.source !== 'all') params.append('source', logFilters.source)
      if (logFilters.search) params.append('search', logFilters.search)

      const response = await fetch(`/api/admin-prod/logs?${params.toString()}`, {
        headers: {
          'x-admin-prod-auth': 'authenticated-6262'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Error loading logs:', error)
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

  const toggleColumn = (column: string) => {
    const newHidden = new Set(hiddenColumns)
    if (newHidden.has(column)) {
      newHidden.delete(column)
    } else {
      newHidden.add(column)
    }
    setHiddenColumns(newHidden)
  }

  const toggleRow = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  const getColumns = () => {
    if (tableData.length === 0) return []
    return Object.keys(tableData[0])
  }

  const visibleColumns = getColumns().filter(col => !hiddenColumns.has(col))

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
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4">
            <h1 className="text-xl sm:text-2xl font-bold">Production Database</h1>
            <div className="flex gap-2">
              <button
                onClick={handleBackToAdmin}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <span className="hidden sm:inline">Back to Admin</span>
                <span className="sm:hidden">Back</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex gap-1 pb-4 border-b">
            <button
              onClick={() => setCurrentView('prisma')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'prisma'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Prisma
            </button>
            <button
              onClick={() => setCurrentView('logs')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'logs'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Logs
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'prisma' && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => loadTableData(table.name)}
                className={`px-3 py-2 rounded whitespace-nowrap text-sm ${
                  selectedTable === table.name
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {table.name} ({table.count})
              </button>
            ))}
          </div>
        )}

        {currentView === 'prisma' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-base sm:text-lg font-semibold">{selectedTable} Table</h2>
              <button
                onClick={() => setShowColumnManager(!showColumnManager)}
                className="px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-2 self-start sm:self-auto"
              >
                {showColumnManager ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">Manage Columns</span>
                <span className="sm:hidden">Columns</span>
              </button>
            </div>

          {showColumnManager && tableData.length > 0 && (
            <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {getColumns().map((col) => (
                  <button
                    key={col}
                    onClick={() => toggleColumn(col)}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors ${
                      !hiddenColumns.has(col)
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                  >
                    {!hiddenColumns.has(col) ? '✓' : '✗'} <span className="hidden sm:inline">{col}</span>
                    <span className="sm:hidden">{col.slice(0, 8)}{col.length > 8 ? '...' : ''}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tableData.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No records found
            </div>
          ) : (
            <div className="overflow-x-auto max-w-full">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.map((key) => (
                      <th
                        key={key}
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {key}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr className="hover:bg-gray-50">
                        {visibleColumns.map((key) => (
                          <td key={key} className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {key === 'data' || typeof row[key] === 'object' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleRow(`${row.id}-${key}`)}
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                                >
                                  {expandedRows.has(`${row.id}-${key}`) ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                  <span className="hidden sm:inline">View</span>
                                  <span className="sm:hidden">...</span>
                                </button>
                              </div>
                            ) : key === 'id' || key === 'createdAt' || key === 'updatedAt' ? (
                              <span className="block" title={String(row[key])}>
                                {key.includes('At') && row[key] ?
                                  new Date(row[key]).toLocaleDateString('he-IL', {
                                    year: '2-digit',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) :
                                  formatCellValue(row[key])
                                }
                              </span>
                            ) : (
                              <span className="block max-w-[200px] truncate" title={String(row[key])}>
                                {formatCellValue(row[key])}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center text-sm font-medium whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(selectedTable, row.id)}
                            className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {visibleColumns.map((key) =>
                        expandedRows.has(`${row.id}-${key}`) && (key === 'data' || typeof row[key] === 'object') ? (
                          <tr key={`${row.id}-${key}-expanded`}>
                            <td colSpan={visibleColumns.length + 1} className="px-6 py-4 bg-gray-50">
                              <div className="max-w-full overflow-x-auto">
                                <pre className="text-xs bg-white p-4 rounded border">
                                  {formatCellValue(row[key])}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        ) : null
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        ) : (
          /* Logs View */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b">
              <h2 className="text-base sm:text-lg font-semibold mb-4">System Logs</h2>

              {/* Log Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={logFilters.level}
                    onChange={(e) => {
                      setLogFilters({...logFilters, level: e.target.value})
                      setTimeout(loadLogs, 100)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Levels</option>
                    <option value="DEBUG">Debug</option>
                    <option value="INFO">Info</option>
                    <option value="WARN">Warning</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={logFilters.source}
                    onChange={(e) => {
                      setLogFilters({...logFilters, source: e.target.value})
                      setTimeout(loadLogs, 100)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Sources</option>
                    <option value="api">API</option>
                    <option value="auth">Authentication</option>
                    <option value="database">Database</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={logFilters.search}
                    onChange={(e) => setLogFilters({...logFilters, search: e.target.value})}
                    onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
                    placeholder="Search messages..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <button
                onClick={loadLogs}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Refresh Logs
              </button>
            </div>

            {/* Logs Table */}
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                Loading logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No logs found
              </div>
            ) : (
              <div className="overflow-x-auto max-w-full">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString('he-IL', {
                              year: '2-digit',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="px-3 py-2 text-sm whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                                log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                                log.level === 'INFO' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {log.level}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {log.source || 'Unknown'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <div className="max-w-md truncate" title={log.message}>
                              {log.message}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {log.metadata && (
                              <button
                                onClick={() => toggleRow(log.id)}
                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                              >
                                {expandedRows.has(log.id) ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                                <span className="hidden sm:inline">Details</span>
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedRows.has(log.id) && log.metadata && (
                          <tr key={`${log.id}-expanded`}>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <div className="max-w-full overflow-x-auto">
                                <pre className="text-xs bg-white p-4 rounded border">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}