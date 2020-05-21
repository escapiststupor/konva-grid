import React, {
  useRef,
  useCallback,
  useState,
  useMemo,
  createElement,
} from "react";
import { Stage, Layer, Group } from "react-konva";
import {
  getBoundedCells,
  getRowStartIndexForOffset,
  getRowStopIndexForStartIndex,
  getColumnStartIndexForOffset,
  getColumnStopIndexForStartIndex,
  itemKey,
  getRowOffset,
  getColumnOffset,
  getColumnWidth,
  getRowHeight,
  getEstimatedTotalHeight,
  getEstimatedTotalWidth,
} from "./helpers";

export interface IProps {
  width: number;
  height: number;
  columnCount: number;
  rowCount: number;
  rowHeight: TItemSize;
  columnWidth: TItemSize;
  children: RenderComponent;
  scrollbarSize: number;
  estimatedColumnWidth?: number;
  estimatedRowHeight?: number;
}

const defaultProps = {
  width: 800,
  height: 800,
  rowCount: 200,
  columnCount: 200,
  rowHeight: () => 20,
  columnWidth: () => 100,
  scrollbarSize: 20,
};

type RenderComponent = React.FC<IChildrenProps>;

export interface IChildrenProps extends ICell {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TItemSize = (index?: number) => number;

export interface IArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ICell {
  rowIndex: number;
  columnIndex: number;
}

export interface IInstanceProps {
  columnMetadataMap: TCellMetaDataMap;
  rowMetadataMap: TCellMetaDataMap;
  lastMeasuredColumnIndex: number;
  lastMeasuredRowIndex: number;
  estimatedRowHeight: number;
  estimatedColumnWidth: number;
}

export type TCellMetaDataMap = Record<number, TCellMetaData>;
export type TCellMetaData = {
  offset: number;
  size: number;
};

const DEFAULT_ESTIMATED_ITEM_SIZE = 50;

/**
 * Grid component
 * @param props
 */
const Grid: React.FC<IProps> = (props) => {
  const {
    width: containerWidth,
    height: containerHeight,
    estimatedColumnWidth,
    estimatedRowHeight,
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
    scrollbarSize,
    children,
  } = props;
  const instanceProps = useRef<IInstanceProps>({
    columnMetadataMap: {},
    rowMetadataMap: {},
    lastMeasuredColumnIndex: -1,
    lastMeasuredRowIndex: -1,
    estimatedColumnWidth: estimatedColumnWidth || DEFAULT_ESTIMATED_ITEM_SIZE,
    estimatedRowHeight: estimatedRowHeight || DEFAULT_ESTIMATED_ITEM_SIZE,
  });
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

  const rowStartIndex = getRowStartIndexForOffset({
    itemType: "row",
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
    instanceProps: instanceProps.current,
    offset: scrollTop,
  });
  const rowStopIndex = getRowStopIndexForStartIndex({
    startIndex: rowStartIndex,
    rowCount,
    rowHeight,
    columnWidth,
    scrollTop,
    containerHeight,
    instanceProps: instanceProps.current,
  });
  const columnStartIndex = getColumnStartIndexForOffset({
    itemType: "column",
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
    instanceProps: instanceProps.current,
    offset: scrollLeft,
  });
  const columnStopIndex = getColumnStopIndexForStartIndex({
    startIndex: columnStartIndex,
    columnCount,
    rowHeight,
    columnWidth,
    scrollLeft,
    containerWidth,
    instanceProps: instanceProps.current,
  });
  const items = [];
  if (columnCount > 0 && rowCount) {
    for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
      for (
        let columnIndex = columnStartIndex;
        columnIndex <= columnStopIndex;
        columnIndex++
      ) {
        const width = getColumnWidth(columnIndex, instanceProps.current);
        const x = getColumnOffset({
          index: columnIndex,
          rowHeight,
          columnWidth,
          instanceProps: instanceProps.current,
        });
        const height = getRowHeight(rowIndex, instanceProps.current);
        const y = getRowOffset({
          index: rowIndex,
          rowHeight,
          columnWidth,
          instanceProps: instanceProps.current,
        });
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

  const estimatedTotalHeight = getEstimatedTotalHeight(
    rowCount,
    instanceProps.current.estimatedRowHeight,
    instanceProps.current
  );
  const estimatedTotalWidth = getEstimatedTotalWidth(
    columnCount,
    instanceProps.current.estimatedColumnWidth,
    instanceProps.current
  );

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
            height: estimatedTotalHeight,
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
            width: estimatedTotalWidth,
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
