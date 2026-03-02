import { useState, useRef, useCallback, useMemo } from 'react';

const OVERSCAN = 5;

/**
 * Lightweight virtualized list that only renders visible items + buffer.
 *
 * @param {{ items: unknown[], itemHeight: number, containerHeight: number, renderItem: (item: unknown, index: number) => JSX.Element }} props
 */
export default function VirtualizedList({ items, itemHeight, containerHeight, renderItem }) {
  const [scrollTop, setScrollTop] = useState(0);
  const rafRef = useRef(null);

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
    return {
      startIndex: Math.max(0, visibleStart - OVERSCAN),
      endIndex: Math.min(items.length, visibleEnd + OVERSCAN),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const handleScroll = useCallback((e) => {
    const target = e.currentTarget;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
    });
  }, []);

  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i < endIndex; i++) {
      result.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: i * itemHeight,
            height: itemHeight,
            width: '100%',
          }}
        >
          {renderItem(items[i], i)}
        </div>
      );
    }
    return result;
  }, [startIndex, endIndex, itemHeight, items, renderItem]);

  return (
    <div
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}
