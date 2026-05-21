import React, { ReactNode } from 'react'

type Column<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

type TableProps<T extends object> = {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  loading?: boolean
  emptyMessage?: string
  className?: string
}

function getCellValue<T extends object>(row: T, key: keyof T | string): ReactNode {
  if (key in row) {
    const value = row[key as keyof T]
    if (value === null || value === undefined) return '—'
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
  }
  return '—'
}

export function Table<T extends object>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = 'No hay datos disponibles.',
  className = '',
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 ${className}`}>
      <table className="w-full text-sm font-outfit">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={[
                  'px-4 py-3 text-left text-gray-600 text-xs font-medium uppercase tracking-wider whitespace-nowrap',
                  col.className ?? '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            // Skeleton rows
            Array.from({ length: 3 }).map((_, rowIdx) => (
              <tr key={`skeleton-${rowIdx}`} className="even:bg-gray-50">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={String(row[keyField])}
                className="even:bg-gray-50 hover:bg-blue-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={[
                      'px-4 py-3 text-gray-700',
                      col.className ?? '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {col.render ? col.render(row) : getCellValue(row, col.key)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
