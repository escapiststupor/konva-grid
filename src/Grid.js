"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const react_konva_1 = require("react-konva");
const defaultProps = {
    width: 800,
    height: 800,
    rowCount: 200,
    columnCount: 200,
    rowHeight: () => 20,
    columnWidth: () => 100,
    scrollbarSize: 20,
};
const getRowStartIndex = (rowCount, rowHeight, scrollTop) => {
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
const getRowStopIndex = (startIndex, rowCount, rowHeight, scrollTop, containerHeight) => {
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
const getColumnStartIndex = (columnCount, columnWidth, scrollLeft) => {
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
const getColumnStopIndex = (startIndex, columnCount, columnWidth, scrollLeft, containerWidth) => {
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
const getBoundedCells = (area) => {
    const { top, bottom, left, right } = area;
    const cells = new Set();
    for (let i = top; i <= bottom; i++) {
        for (let j = left; j <= right; j++) {
            cells.add(JSON.stringify([i, j]));
        }
    }
    return cells;
};
const itemKey = ({ rowIndex, columnIndex }) => `${rowIndex}:${columnIndex}`;
/**
 * Grid component
 * @param props
 */
const Grid = (props) => {
    const { width: containerWidth, height: containerHeight, rowHeight, columnWidth, rowCount, columnCount, scrollbarSize, children, } = props;
    const verticalScrollRef = react_1.useRef(null);
    const wheelingRef = react_1.useRef(null);
    const horizontalScrollRef = react_1.useRef(null);
    const [scrollTop, setScrollTop] = react_1.useState(0);
    const [scrollLeft, setScrollLeft] = react_1.useState(0);
    const handleScroll = react_1.useCallback((e) => {
        setScrollTop(e.target.scrollTop);
    }, []);
    const handleScrollLeft = react_1.useCallback((e) => {
        setScrollLeft(e.target.scrollLeft);
    }, []);
    const scrollHeight = rowCount * rowHeight();
    const scrollWidth = columnCount * columnWidth();
    const [selectedArea, setSelectedArea] = react_1.useState({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
    });
    const boundedCells = react_1.useMemo(() => getBoundedCells(selectedArea), [
        selectedArea,
    ]);
    const handleWheel = react_1.useCallback((event) => {
        if (wheelingRef.current)
            return;
        const { deltaX, deltaY, deltaMode } = event.nativeEvent;
        let dx = deltaX;
        let dy = deltaY;
        if (deltaMode === 1) {
            dy = dy * 17;
        }
        if (!horizontalScrollRef.current || !verticalScrollRef.current)
            return;
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
    const rowStopIndex = getRowStopIndex(rowStartIndex, rowCount, rowHeight, scrollTop, containerHeight);
    const columnStartIndex = getColumnStartIndex(columnCount, columnWidth, scrollLeft);
    const columnStopIndex = getColumnStopIndex(columnStartIndex, columnCount, columnWidth, scrollLeft, containerWidth);
    const items = [];
    if (columnCount > 0 && rowCount) {
        for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
            for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
                const width = columnWidth(columnIndex);
                const x = columnIndex * width;
                const height = rowHeight(rowIndex);
                const y = rowIndex * height;
                items.push(react_1.createElement(children, {
                    x,
                    y,
                    width,
                    height,
                    rowIndex,
                    columnIndex,
                    key: itemKey({ rowIndex, columnIndex }),
                }));
            }
        }
    }
    return (react_1.default.createElement("div", { style: { position: "relative", width: containerWidth + 20 } },
        react_1.default.createElement("div", { style: {
                height: containerHeight,
                overflow: "scroll",
                position: "absolute",
                right: 0,
                top: 0,
                width: scrollbarSize,
                background: "#666",
            }, onScroll: handleScroll, ref: verticalScrollRef },
            react_1.default.createElement("div", { style: {
                    position: "absolute",
                    height: scrollHeight,
                    width: 1,
                } })),
        react_1.default.createElement("div", { style: {
                overflow: "scroll",
                position: "absolute",
                bottom: -scrollbarSize,
                left: 0,
                width: containerWidth,
                height: scrollbarSize,
                background: "#666",
            }, onScroll: handleScrollLeft, ref: horizontalScrollRef },
            react_1.default.createElement("div", { style: {
                    position: "absolute",
                    width: scrollWidth,
                    height: 1,
                } })),
        react_1.default.createElement("div", { onWheel: handleWheel, tabIndex: -1 },
            react_1.default.createElement(react_konva_1.Stage, { width: containerWidth, height: containerHeight },
                react_1.default.createElement(react_konva_1.Layer, null,
                    react_1.default.createElement(react_konva_1.Group, { offsetY: scrollTop, offsetX: scrollLeft }, items))))));
};
Grid.defaultProps = defaultProps;
exports.default = Grid;
