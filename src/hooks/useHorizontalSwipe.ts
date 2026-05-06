import { useMemo, useRef, type PointerEvent } from 'react'

type SwipeDirection = 'left' | 'right'

const SWIPE_THRESHOLD_PX = 56
const VERTICAL_TOLERANCE_RATIO = 0.7

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }
  return Boolean(target.closest('input, button, select, textarea, a, [data-no-swipe]'))
}

export function useHorizontalSwipe(onSwipe: (direction: SwipeDirection) => void) {
  const start = useRef<{ x: number; y: number } | null>(null)

  return useMemo(
    () => ({
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        if (isInteractiveTarget(e.target)) {
          start.current = null
          return
        }
        start.current = { x: e.clientX, y: e.clientY }
      },
      onPointerUp: (e: PointerEvent<HTMLElement>) => {
        if (!start.current) {
          return
        }
        const dx = e.clientX - start.current.x
        const dy = e.clientY - start.current.y
        start.current = null

        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) {
          return
        }
        if (Math.abs(dy) > Math.abs(dx) * VERTICAL_TOLERANCE_RATIO) {
          return
        }

        onSwipe(dx < 0 ? 'left' : 'right')
      },
      onPointerCancel: () => {
        start.current = null
      },
      onPointerLeave: () => {
        start.current = null
      },
      style: { touchAction: 'pan-y' as const },
    }),
    [onSwipe],
  )
}
