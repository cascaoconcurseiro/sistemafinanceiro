'use client'

import { memo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { cn } from '@/lib/utils'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  height: number
  width?: string | number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscanCount?: number
}

function VirtualizedListComponent<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  className,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>{renderItem(items[index], index)}</div>
  )

  return (
    <List
      className={cn('scrollbar-thin scrollbar-thumb-gray-300', className)}
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      overscanCount={overscanCount}
    >
      {Row}
    </List>
  )
}

export const VirtualizedList = memo(VirtualizedListComponent) as typeof VirtualizedListComponent
