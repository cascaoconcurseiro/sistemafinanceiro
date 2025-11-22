'use client'

import { useState, useEffect, useRef, TouchEvent } from 'react'

interface SwipeConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  minSwipeDistance?: number
  preventDefaultTouchmoveEvent?: boolean
}

interface SwipeState {
  touchStart: { x: number; y: number } | null
  touchEnd: { x: number; y: number } | null
  isSwiping: boolean
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
  preventDefaultTouchmoveEvent = false,
}: SwipeConfig) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    touchStart: null,
    touchEnd: null,
    isSwiping: false,
  })

  const onTouchStart = (e: TouchEvent) => {
    setSwipeState({
      touchStart: {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      },
      touchEnd: null,
      isSwiping: true,
    })
  }

  const onTouchMove = (e: TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault()
    }
    
    setSwipeState(prev => ({
      ...prev,
      touchEnd: {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
      },
    }))
  }

  const onTouchEnd = () => {
    if (!swipeState.touchStart || !swipeState.touchEnd) {
      setSwipeState(prev => ({ ...prev, isSwiping: false }))
      return
    }

    const distanceX = swipeState.touchStart.x - swipeState.touchEnd.x
    const distanceY = swipeState.touchStart.y - swipeState.touchEnd.y
    
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY)
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX)

    // Swipe horizontal
    if (isHorizontalSwipe) {
      if (distanceX > minSwipeDistance) {
        onSwipeLeft?.()
      } else if (distanceX < -minSwipeDistance) {
        onSwipeRight?.()
      }
    }

    // Swipe vertical
    if (isVerticalSwipe) {
      if (distanceY > minSwipeDistance) {
        onSwipeUp?.()
      } else if (distanceY < -minSwipeDistance) {
        onSwipeDown?.()
      }
    }

    setSwipeState({
      touchStart: null,
      touchEnd: null,
      isSwiping: false,
    })
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isSwiping: swipeState.isSwiping,
  }
}

/**
 * Hook para swipe em lista de itens (ex: deletar ao swipe)
 */
export function useSwipeableItem({
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
}: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}) {
  const [offset, setOffset] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isSwiping) return
    
    const currentX = e.touches[0].clientX
    const diff = currentX - startX.current
    setOffset(diff)
  }

  const handleTouchEnd = () => {
    setIsSwiping(false)
    
    if (offset < -threshold) {
      onSwipeLeft?.()
    } else if (offset > threshold) {
      onSwipeRight?.()
    }
    
    setOffset(0)
  }

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    style: {
      transform: `translateX(${offset}px)`,
      transition: isSwiping ? 'none' : 'transform 0.3s ease',
    },
    isSwiping,
  }
}

/**
 * Hook para pull-to-refresh
 */
export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const startY = useRef(0)
  const threshold = 80

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return
    
    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current
    
    if (distance > 0) {
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold) {
      await onRefresh()
    }
    
    setIsPulling(false)
    setPullDistance(0)
  }

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isPulling,
    pullDistance,
    isRefreshing: isPulling && pullDistance >= threshold,
  }
}
