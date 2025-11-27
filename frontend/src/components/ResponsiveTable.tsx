'use client'

interface ResponsiveTableProps {
  headers: string[]
  children: React.ReactNode
  emptyMessage?: string
}

export default function ResponsiveTable({ headers, children, emptyMessage = 'Aucune donnée' }: ResponsiveTableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle sm:px-0">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-700">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </tbody>
          </table>
          {!children || (Array.isArray(children) && children.length === 0) && (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

