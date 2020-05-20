import React from "react";
interface IProps {
    width: number;
    height: number;
    columnCount: number;
    rowCount: number;
    rowHeight: TItemSize;
    columnWidth: TItemSize;
    children: RenderComponent;
    scrollbarSize: number;
}
declare type RenderComponent = React.FC<IChildrenProps>;
export interface IChildrenProps extends ICell {
    x: number;
    y: number;
    width: number;
    height: number;
}
declare type TItemSize = (index?: number) => number;
interface ICell {
    rowIndex: number;
    columnIndex: number;
}
/**
 * Grid component
 * @param props
 */
declare const Grid: React.FC<IProps>;
export default Grid;
