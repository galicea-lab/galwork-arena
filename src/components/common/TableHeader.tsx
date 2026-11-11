import { Icon } from '@iconify/react'

interface TableHeaderProps {
  value: string
  handleFilter: (val: string) => void
}

const TableHeader = (props: TableHeaderProps) => {
  const { value, handleFilter } = props

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200">
      <div className="relative w-full sm:w-72">
        <Icon
          icon="mdi:magnify"
          className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => handleFilter(e.target.value)}
          placeholder="Szukaj..."
          className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>
    </div>
  )
}

export default TableHeader
