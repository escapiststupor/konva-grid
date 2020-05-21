// Utilities extracted from https://github.com/bvaughn/react-window
import { TItemSize, IInstanceProps, IArea, ICell, TCellMetaData } from './Grid'

export interface IItemMetaData {
  itemType: 'row' | 'column'
  offset: number
  index: number
  rowCount: number
  columnCount: number
  rowHeight: TItemSize
  columnWidth: TItemSize
  instanceProps: IInstanceProps
}

export const getRowStartIndexForOffset = (
  {
    itemType,
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
    instanceProps,
    offset
  }: Omit<IItemMetaData, 'index'>
): number => {
  return findNearestItem({
    itemType,
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
    instanceProps,
    offset
  })
};

interface IRowStopIndex extends Omit<IItemMetaData, 'itemType' | 'index' | 'offset' | 'columnCount'> {
  startIndex: number
  containerHeight: number
  scrollTop: number
}
export  const getRowStopIndexForStartIndex = ({
  startIndex,
  rowCount,
  rowHeight,
  columnWidth,
  scrollTop,
  containerHeight,
  instanceProps
}: IRowStopIndex): number => {

  const itemMetadata = getItemMetadata({
    itemType: 'row',
    rowHeight,
    columnWidth,
    index: startIndex,
    instanceProps
  })
  const maxOffset = scrollTop + containerHeight;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < rowCount - 1 && offset < maxOffset) {
    stopIndex++;
    offset += getItemMetadata({
      itemType: 'row',
      rowHeight,
      columnWidth,
      index: stopIndex,
      instanceProps
    }).size;
  }

  return stopIndex;
};

export  const getColumnStartIndexForOffset = (
  {
    itemType,
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
    instanceProps,
    offset
  }: Omit<IItemMetaData, 'index'>
): number => {
  return findNearestItem({
    itemType,
    rowHeight,
    columnWidth,
    rowCount,
    columnCount,
    instanceProps,
    offset
  })
};

interface IColumnStopIndex extends Omit<IItemMetaData, 'itemType' | 'index' | 'offset' | 'rowCount'> {
  startIndex: number
  containerWidth: number
  scrollLeft: number
}
export  const getColumnStopIndexForStartIndex = ({
  startIndex,
  rowHeight,
  columnWidth,
  instanceProps,
  containerWidth,
  scrollLeft,
  columnCount
}: IColumnStopIndex): number => {
  const itemMetadata = getItemMetadata({
    itemType: 'column',
    index: startIndex,
    rowHeight,
    columnWidth,
    instanceProps
  })
  const maxOffset = scrollLeft + containerWidth;

  let offset = itemMetadata.offset + itemMetadata.size;
  let stopIndex = startIndex;

  while (stopIndex < columnCount - 1 && offset < maxOffset) {
    stopIndex++;
    offset += getItemMetadata({
      itemType: 'column',
      rowHeight,
      columnWidth,
      index: stopIndex,
      instanceProps
    }).size;
  }

  return stopIndex; 
};

export const getBoundedCells = (area: IArea) => {
  const { top, bottom, left, right } = area;
  const cells = new Set();
  for (let i = top; i <= bottom; i++) {
    for (let j = left; j <= right; j++) {
      cells.add(JSON.stringify([i, j]));
    }
  }
  return cells;
};

export  const itemKey = ({ rowIndex, columnIndex }: ICell) =>
  `${rowIndex}:${columnIndex}`;

export const getRowOffset = ({
  index,
  rowHeight,
  columnWidth,
  instanceProps,
}: Omit<IGetItemMetadata, 'itemType'>): number => {
  return getItemMetadata({
    itemType: 'row',
    index,
    rowHeight,
    columnWidth,
    instanceProps
  }).offset
}

export const getColumnOffset = ({
  index,
  rowHeight,
  columnWidth,
  instanceProps,
}: Omit<IGetItemMetadata, 'itemType'>): number => {
  return getItemMetadata({
    itemType: 'column',
    index,
    rowHeight,
    columnWidth,
    instanceProps
  }).offset
}

export const getRowHeight = (index: number, instanceProps: IInstanceProps) => {
  return instanceProps.rowMetadataMap[index].size
}

export const getColumnWidth = (index: number, instanceProps: IInstanceProps) => {
  return instanceProps.columnMetadataMap[index].size
}

interface IGetItemMetadata extends Pick<IItemMetaData, 'itemType' | 'index' | 'rowHeight' | 'columnWidth' | 'instanceProps'>{}
export const getItemMetadata = ({
  itemType,
  index,
  rowHeight,
  columnWidth,
  instanceProps
}: IGetItemMetadata): TCellMetaData=> {
  let itemMetadataMap, itemSize, lastMeasuredIndex;
  if (itemType === 'column') {
    itemMetadataMap = instanceProps.columnMetadataMap
    itemSize = columnWidth
    lastMeasuredIndex = instanceProps.lastMeasuredColumnIndex
  } else {
    itemMetadataMap = instanceProps.rowMetadataMap;
    itemSize = rowHeight
    lastMeasuredIndex = instanceProps.lastMeasuredRowIndex;
  }
  
  if (index > lastMeasuredIndex) {
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const itemMetadata = itemMetadataMap[lastMeasuredIndex];
      offset = itemMetadata.offset + itemMetadata.size;
    }

    for (let i = lastMeasuredIndex + 1; i <= index; i++) {
      let size = itemSize(i);

      itemMetadataMap[i] = {
        offset,
        size,
      };

      offset += size;
    }

    if (itemType === 'column') {
      instanceProps.lastMeasuredColumnIndex = index;
    } else {
      instanceProps.lastMeasuredRowIndex = index;
    }
  }

  return itemMetadataMap[index];
}

const findNearestItem = ({
  itemType,
  rowHeight,
  columnWidth,
  rowCount,
  columnCount,
  instanceProps,
  offset
}: Omit<IItemMetaData, 'index'>): number => {
  let itemMetadataMap, lastMeasuredIndex;
  if (itemType === 'column') {
    itemMetadataMap = instanceProps.columnMetadataMap;
    lastMeasuredIndex = instanceProps.lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = instanceProps.rowMetadataMap;
    lastMeasuredIndex = instanceProps.lastMeasuredRowIndex;
  }

  const lastMeasuredItemOffset =
    lastMeasuredIndex > 0 ? itemMetadataMap[lastMeasuredIndex].offset : 0;

  if (lastMeasuredItemOffset >= offset) {
    // If we've already measured items within this range just use a binary search as it's faster.
    return findNearestItemBinarySearch({
      itemType,
      rowHeight,
      columnWidth,
      instanceProps,
      high: lastMeasuredIndex,
      low: 0,
      offset
    })
  } else {
    // If we haven't yet measured this high, fallback to an exponential search with an inner binary search.
    // The exponential search avoids pre-computing sizes for the full set of items as a binary search would.
    // The overall complexity for this approach is O(log n).
    return findNearestItemExponentialSearch({
      itemType,
      rowHeight,
      rowCount,
      columnCount,
      columnWidth,
      instanceProps,
      index: Math.max(0, lastMeasuredIndex),
      offset
    });
  }
};

interface IBinarySearchArgs extends Omit<IItemMetaData, 'index' | 'rowCount' | 'columnCount'>{
  high: number
  low: number
}
const findNearestItemBinarySearch = ({
  itemType,
  rowHeight,
  columnWidth,
  instanceProps,
  high,
  low,
  offset
}: IBinarySearchArgs): number => {
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = getItemMetadata({
      itemType,
      rowHeight,
      columnWidth,
      index: middle,
      instanceProps
    }).offset;

    if (currentOffset === offset) {
      return middle;
    } else if (currentOffset < offset) {
      low = middle + 1;
    } else if (currentOffset > offset) {
      high = middle - 1;
    }
  }

  if (low > 0) {
    return low - 1;
  } else {
    return 0;
  }
};

const findNearestItemExponentialSearch = ({
  itemType,
  rowHeight,
  columnWidth,
  rowCount,
  columnCount,
  instanceProps,
  index,
  offset
}: IItemMetaData) => {
  const itemCount = itemType === 'column' ? columnCount : rowCount;
  let interval = 1;

  while (
    index < itemCount &&
    getItemMetadata({
      itemType,
      rowHeight,
      columnWidth,
      index,
      instanceProps
    }).offset < offset
  ) {
    index += interval;
    interval *= 2;
  }

  return findNearestItemBinarySearch({
    itemType,
    rowHeight,
    columnWidth,
    instanceProps,
    high: Math.min(index, itemCount - 1),
    low: Math.floor(index / 2),
    offset
  });
};


export const getEstimatedTotalHeight = (rowCount: number, estimatedRowHeight: number, instanceProps: IInstanceProps) => {
  let totalSizeOfMeasuredRows = 0;
  let { lastMeasuredRowIndex, rowMetadataMap } = instanceProps

  // Edge case check for when the number of items decreases while a scroll is in progress.
  // https://github.com/bvaughn/react-window/pull/138
  if (lastMeasuredRowIndex >= rowCount) {
    lastMeasuredRowIndex = rowCount - 1;
  }
  
  if (lastMeasuredRowIndex >= 0) {
    const itemMetadata = rowMetadataMap[lastMeasuredRowIndex];
    totalSizeOfMeasuredRows = itemMetadata.offset + itemMetadata.size;
  }
  
  const numUnmeasuredItems = rowCount - lastMeasuredRowIndex - 1;  
  const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedRowHeight;

  return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems;
};

export const getEstimatedTotalWidth = (columnCount: number, estimatedColumnWidth: number, instanceProps: IInstanceProps) => {
  let totalSizeOfMeasuredRows = 0;
  let { lastMeasuredColumnIndex, columnMetadataMap } = instanceProps
  // Edge case check for when the number of items decreases while a scroll is in progress.
  // https://github.com/bvaughn/react-window/pull/138
  if (lastMeasuredColumnIndex >= columnCount) {
    lastMeasuredColumnIndex = columnCount - 1;
  }

  if (lastMeasuredColumnIndex >= 0) {
    const itemMetadata = columnMetadataMap[lastMeasuredColumnIndex];
    totalSizeOfMeasuredRows = itemMetadata.offset + itemMetadata.size;
  }

  const numUnmeasuredItems = columnCount - lastMeasuredColumnIndex - 1;
  const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedColumnWidth;

  return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems;
};