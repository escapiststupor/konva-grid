## Declarative Canvas Grid with React Konva

Canvas grid to render large set of tabular data. Uses virtualization similar to `react-window`

1. Supports virtualization - Only visible cells are rendered
1. Supports scrolling using native scrollbars
1. Supports both Fixed and Variable sized grids
1. Highly customizable using [react-konva](https://github.com/konvajs/react-konva/)

## Installation

````
yarn add react-konva-grid

OR

npm install react-konva-grid
````

## Usage

````js
import { Grid } from 'react-konva-grid'
import { Group, Text, Rect } from 'react-konva'

const App = () => {
  const Cell = ({ rowIndex, columnIndex, x, y, width, height}) => {
    return (
      <Group>
        <Rect
          x={x}
          y={y}
          height={height}
          width={width}
          fill="white"
          stroke="grey"
        />
        <Text
          x={x}
          y={y}
          height={height}
          width={width}
          text={text}
          verticalAlign="middle"
          align="center"
        />
      </Group>
    )
  }

  return (
    <Grid
      rowCount={100}
      columnCount={100}
      width={800}
      height={800}
      rowHeight={(rowIndex) => 20}
      columnWidth={(columnIndex) => 100}
    >
      {Cell}
    </Grid>
  )
}
````
### Screenshot

![](screenshot.png)


### Contributing

Feel free to fork and submit pull requests

````
git clone https://github.com/rmdort/konva-grid.git
cd konva-grid
yarn
// Run storybook
yarn storybook 
````