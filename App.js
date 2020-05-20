import React, { useRef, useEffect, useCallback, useState } from 'react'
import { Stage, Layer, Rect, Text, Group } from 'react-konva'

const ITEM_LIST = Array.from({ length: 200}).map((_, idx) => idx)
const COL_LIST = Array.from({ length: 200 }).map((_, idx) => idx)
const itemHeight = 20
const itemWidth = 50
const containerWidth = window.innerWidth - 40
const containerHeight = 800
const scrollHeight = ITEM_LIST.length * itemHeight
const scrollWidth = COL_LIST.length * itemWidth
const columnWidth = (index) => {
  return 50
}
const rowHeight = (index) => {
  return 20
}
const App = () => {
  const verticalScrollRef = useRef()
  const horizontalScrollRef = useRef()
  const [ scrollTop, setScrollTop ] = useState(0)
  const [ scrollLeft, setScrollLeft ] = useState(0)
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])
  const handleScrollLeft = useCallback((e) => {
    setScrollLeft(e.target.scrollLeft)
  }, [])
  const handleWheel = useCallback(({ evt: event }, delta) => {
    // Extract the delta X and Y movement.
    let dx = event.deltaX;
    let dy = event.deltaY;
    dx *= itemWidth/2
    dy *= itemHeight/2
    window.requestAnimationFrame(() => {
      verticalScrollRef.current.scrollTop += dy
      horizontalScrollRef.current.scrollLeft += dx
    })
  }, [])
  
  const frozenRows = 0
  const items = ITEM_LIST.filter((item, idx) => {
    const itemHeight = rowHeight(item)
    if (idx < frozenRows) return true
    const itemScrollTop = idx * itemHeight - scrollTop
    return idx * itemHeight + itemHeight >= scrollTop && itemScrollTop <= containerHeight
  })
  const columns = COL_LIST.filter((item, idx) => {
    const itemWidth = columnWidth(item)
    const itemScrollLeft = idx * itemWidth - scrollLeft
    return idx * itemWidth + itemWidth >= scrollLeft && itemScrollLeft <= containerWidth
  })
  return (
    <div style={{ position: 'relative'}}>
      <div
        style={{
          height: containerHeight,
          overflow: 'scroll',
          position: 'absolute',
          right: 0,
          top: 0,
          width: 20,
          backkground: 'black'
        }}
        onScroll={handleScroll}
        ref={verticalScrollRef}
      >
        <div style={{
          position: 'absolute',
          height: scrollHeight,
          width: 1
        }} />
      </div>
      <div
        style={{
          height: containerHeight,
          overflow: 'scroll',
          position: 'absolute',
          bottom: -20,
          left: 0,
          width: containerWidth,
          height: 20,
          backkground: 'black'
        }}
        onScroll={handleScrollLeft}
        ref={horizontalScrollRef}
      >
        <div style={{
          position: 'absolute',
          width: scrollWidth,
          height: 1
        }} />
      </div>
      <Stage width={containerWidth} height={containerHeight} onWheel={handleWheel}>
        <Layer>
          {items.map((item, idx) => {
            const top = idx * itemHeight
            const height = rowHeight(item)
            return (
              <Group key={idx} offsetY={scrollTop} offsetX={scrollLeft}>
                {columns.map((col, colIndex) => {
                  const width = columnWidth(col)
                  const x = col * width
                  const isFrozen = item < frozenRows
                  const y = isFrozen
                    ? idx * itemHeight + scrollTop
                    : item * height
                  const text = `${item} x ${col}`
                  return (
                    <Group key={`${idx}_${colIndex}`}>
                      <Rect x={x} y={y} height={height} width={width} fill='#eee' stroke='grey' />
                      <Text x={x} y={y} height={height} width={width} text={text} />
                    </Group>
                  )
                })}
              </Group>
            )            
          })}
        </Layer>
      </Stage>
    </div>
  )
}

export default App
