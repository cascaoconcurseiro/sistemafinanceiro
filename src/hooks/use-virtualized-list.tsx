import { useRef, useEffect, useState } from 'react'
import { FixedSizeList as List } from 'react-window'

interface UseVirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscanCount?: number
}

export function useVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscanCount = 5,
}: UseVirtualizedListProps<T>) {
  const listRef = useRef<List>(null)
  const [scrollOffset, setScrollOffset] = useState(0)

  const scrollToItem = (index: number, align: 'start' | 'center' | 'end' = 'start') => {
    listRef.current?.scrollToItem(index, align)
  }

  const scrollToTop = () => {
    listRef.current?.scrollTo(0)
  }

  return {
    listRef,
    scrollOffset,
    setScrollOffset,
    scrollToItem,
    scrollToTop,
    itemCount: items.length,
    itemHeight,
    containerHeight,
    overscanCount,
  }
}
