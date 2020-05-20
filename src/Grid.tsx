import React, {
  useRef,
  useCallback,
  useState,
  useMemo,
  createElement,
} from "react";
import { Stage, Layer, Group } from "react-konva";

interface IProps{
  width: number;
  height: number;
  columnCount: number;
  rowCount: number;
  rowHeight: TItemSize;
  columnWidth: TItemSize;
  children: RenderComponent;
  scrollbarSize: number;
}

const defaultProps = {
  width: 800,
  height: 800,
  rowCount: 200,
  columnCount: 200,
  rowHeight: () => 20,
  columnWidth: () => 100,
  scrollbarSize: 20,
}

type RenderComponent = React.FC<IChildrenProps>;

export interface IChildrenProps extends ICell {
  x: number;
  y: number;
  width: number;
  height: number;
}

type TItemSize = (index?: number) => number;

interface IArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface ICell {
  rowIndex: number;
  columnIndex: number;
}

const getRowStartIndex = (
  rowCount: number,
  rowHeight: TItemSize,
  scrollTop: number
) => {
  let i = 0;
  let startIndex = 0;
  while (i < rowCount) {
    const itemHeight = rowHeight(i);
    if (i * itemHeight + itemHeight >= scrollTop) {
      startIndex = i;
      break;
    }
    i++;
  }
  return startIndex;
};

const getRowStopIndex = (
  startIndex: number,
  rowCount: number,
  rowHeight: TItemSize,
  scrollTop: number,
  containerHeight: number
) => {
  let i = startIndex;
  let stopIndex = rowCount;
  while (i < rowCount) {
    const itemHeight = rowHeight(i);
    const itemScrollTop = i * itemHeight - scrollTop;
    if (itemScrollTop > containerHeight) {
      stopIndex = i;
      break;
    }
    i++;
  }
  return stopIndex;
};

const getColumnStartIndex = (
  columnCount: number,
  columnWidth: TItemSize,
  scrollLeft: number
) => {
  let i = 0;
  let startIndex = 0;
  while (i < columnCount) {
    const itemWidth = columnWidth(i);
    if (i * itemWidth + itemWidth >= scrollLeft) {
      startIndex = i;
      break;
    }
    i++;
  }
  return startIndex;
};

const getColumnStopIndex = (
  startIndex: number,
  columnCount: number,
  columnWidth: TItemSize,
  scrollLeft: number,
  containerWidth: number
) => {
  let i = startIndex;
  let stopIndex = columnCount;
  while (i < columnCount) {
    const itemWidth = columnWidth(i);
    const itemScrollLeft = i * itemWidth - scrollLeft;
    if (itemScrollLeft > containerWidth) {
      stopIndex = i;
      break;
    }
    i++;
  }
  return stopIndex;
};
const getBoundedCells = (area: IArea) => {
  const { top, bottom, left, right } = area;
  const cells = new Set();
  for (let i = top; i <= bottom; i++) {
    for (let j = left; j <= right; j++) {
      cells.add(JSON.stringify([i, j]));
    }
  }
  return cells;
};

const itemKey = ({ rowIndex, columnIndex }: ICell) =>
  `${rowIndex}:${columnIndex}`;

/**
 * Grid component
 * @param props
 */
const Grid: React.FC<IProps> = (props) => {
  const {
    width: containerWidth,
    height: containerHeight,
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
    scrollbarSize,
    children,
  } = props;
  const verticalScrollRef = useRef<HTMLDivElement>(null);
  const wheelingRef = useRef<number | null>(null);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  const handleScrollLeft = useCallback((e) => {
    setScrollLeft(e.target.scrollLeft);
  }, []);
  const scrollHeight = rowCount * rowHeight();
  const scrollWidth = columnCount * columnWidth();
  const [selectedArea, setSelectedArea] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const boundedCells = useMemo(() => getBoundedCells(selectedArea), [
    selectedArea,
  ]);
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (wheelingRef.current) return;
    const { deltaX, deltaY, deltaMode } = event.nativeEvent;
    let dx = deltaX;
    let dy = deltaY;

    if (deltaMode === 1) {
      dy = dy * 17;
    }
    if (!horizontalScrollRef.current || !verticalScrollRef.current) return;
    const x = horizontalScrollRef.current?.scrollLeft;
    const y = verticalScrollRef.current?.scrollTop;
    wheelingRef.current = window.requestAnimationFrame(() => {
      wheelingRef.current = null;
      if (horizontalScrollRef.current)
        horizontalScrollRef.current.scrollLeft = x + dx;
      if (verticalScrollRef.current)
        verticalScrollRef.current.scrollTop = y + dy;
    });
  }, []);

  const rowStartIndex = getRowStartIndex(rowCount, rowHeight, scrollTop);
  const rowStopIndex = getRowStopIndex(
    rowStartIndex,
    rowCount,
    rowHeight,
    scrollTop,
    containerHeight
  );
  const columnStartIndex = getColumnStartIndex(
    columnCount,
    columnWidth,
    scrollLeft
  );
  const columnStopIndex = getColumnStopIndex(
    columnStartIndex,
    columnCount,
    columnWidth,
    scrollLeft,
    containerWidth
  );
  const items = [];
  if (columnCount > 0 && rowCount) {
    for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
      for (
        let columnIndex = columnStartIndex;
        columnIndex <= columnStopIndex;
        columnIndex++
      ) {
        const width = columnWidth(columnIndex);
        const x = columnIndex * width;
        const height = rowHeight(rowIndex);
        const y = rowIndex * height;
        items.push(
          createElement(children, {
            x,
            y,
            width,
            height,
            rowIndex,
            columnIndex,
            key: itemKey({ rowIndex, columnIndex }),
          })
        );
      }
    }
  }

  return (
    <div style={{ position: "relative", width: containerWidth + 20 }}>
      <div
        style={{
          height: containerHeight,
          overflow: "scroll",
          position: "absolute",
          right: 0,
          top: 0,
          width: scrollbarSize,
          background: "#666",
        }}
        onScroll={handleScroll}
        ref={verticalScrollRef}
      >
        <div
          style={{
            position: "absolute",
            height: scrollHeight,
            width: 1,
          }}
        />
      </div>
      <div
        style={{
          overflow: "scroll",
          position: "absolute",
          bottom: -scrollbarSize,
          left: 0,
          width: containerWidth,
          height: scrollbarSize,
          background: "#666",
        }}
        onScroll={handleScrollLeft}
        ref={horizontalScrollRef}
      >
        <div
          style={{
            position: "absolute",
            width: scrollWidth,
            height: 1,
          }}
        />
      </div>
      <div onWheel={handleWheel} tabIndex={-1}>
        <Stage width={containerWidth} height={containerHeight}>
          <Layer>
            <Group offsetY={scrollTop} offsetX={scrollLeft}>
              {items}
            </Group>
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

Grid.defaultProps = defaultProps;

export default Grid;
