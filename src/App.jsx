import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import "./App.css"

const GRID_SIZE = 25

const createGrid = () => {
  const grid = []
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = []
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        x,
        y,
        isWall: false,
        isStart: false,
        isEnd: false,
        isVisited: false,
        inOpenSet: false,
      })
    }
    grid.push(row)
  }
  return grid
}

const heuristic = (a, b) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

function App() {
  const [grid, setGrid] = useState(createGrid)
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const [path, setPath] = useState([])
  const [mode, setMode] = useState("start")
  const [isRunning, setIsRunning] = useState(false)

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  const handleCellClick = (cell) => {
    if (isRunning) return
    const newGrid = grid.map((row) =>
      row.map((c) => {
        if (c.x === cell.x && c.y === cell.y) {
          if (mode === "start") {
            if (start) start.isStart = false
            c.isStart = true
            setStart(c)
          } else if (mode === "end") {
            if (end) end.isEnd = false
            c.isEnd = true
            setEnd(c)
          } else if (mode === "wall") {
            c.isWall = !c.isWall
          }
        }
        return c
      })
    )
    setGrid(newGrid)
  }

  const clearGrid = () => {
    if (isRunning) return
    setGrid(createGrid())
    setStart(null)
    setEnd(null)
    setPath([])
  }

  const generateMaze = () => {
    if (isRunning) return;
    const newGrid = createGrid();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        newGrid[y][x].isWall = true;
      }
    }

    const directions = [
      [-2, 0], 
      [0, 2],  
      [2, 0],  
      [0, -2], 
    ];

    const isValid = (y, x) => {
      return y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE;
    };

    const carvePath = (y, x) => {
      newGrid[y][x].isWall = false;

      const shuffledDirs = directions.sort(() => Math.random() - 0.5);

      for (const [dy, dx] of shuffledDirs) {
        const newY = y + dy;
        const newX = x + dx;

        if (isValid(newY, newX) && newGrid[newY][newX].isWall) {
          newGrid[y + dy / 2][x + dx / 2].isWall = false;

          carvePath(newY, newX);
        }
      }
    };

      carvePath(0, 0);

      newGrid[0][0].isStart = true;
      newGrid[0][0].isWall = false;
      setStart(newGrid[0][0]);

      newGrid[GRID_SIZE - 1][GRID_SIZE - 1].isEnd = true;
      newGrid[GRID_SIZE - 1][GRID_SIZE - 1].isWall = false;
      setEnd(newGrid[GRID_SIZE - 1][GRID_SIZE - 1]);

      setGrid(newGrid);
      setPath([]);
  };

  const runAStar = async () => {
    if (!start || !end || isRunning) return
    setIsRunning(true)
    const openSet = [start]
    const cameFrom = new Map()
    const gScore = new Map()
    const fScore = new Map()
    gScore.set(start, 0)
    fScore.set(start, heuristic(start, end))

    const newGrid = grid.slice()

    const getCell = (x, y) =>
      newGrid[y] && newGrid[y][x]

    while (openSet.length) {
      openSet.sort((a, b) => fScore.get(a) - fScore.get(b))
      const current = openSet.shift()
      if (current === end) {
        const fullPath = []
        let temp = current
        while (cameFrom.has(temp)) {
          fullPath.push(temp)
          temp = cameFrom.get(temp)
        }
        setPath(fullPath.reverse())
        setIsRunning(false)
        return
      }
      current.isVisited = true
      const directions = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ]
      for (const [dx, dy] of directions) {
        const neighbor = getCell(current.x + dx, current.y + dy)
        if (
          neighbor &&
          !neighbor.isWall &&
          !neighbor.isVisited
        ) {
          const tentativeG =
            (gScore.get(current) || 0) + 1
          if (tentativeG < (gScore.get(neighbor) || Infinity)) {
            cameFrom.set(neighbor, current)
            gScore.set(neighbor, tentativeG)
            fScore.set(
              neighbor,
              tentativeG + heuristic(neighbor, end)
            )
            if (!openSet.includes(neighbor)) {
              openSet.push(neighbor)
              neighbor.inOpenSet = true
            }
          }
        }
      }
      setGrid(newGrid.map((row) => row.slice()))
      await sleep(20)
    }
    setIsRunning(false)
  }

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      <h1 className="text-2xl font-bold">
        A* Pathfinding Visualizer
      </h1>
      <div className="flex gap-2">
        <button
          onClick={() => setMode("start")}
          disabled={isRunning}
          className={`px-3 py-1 rounded ${
            mode === "start"
              ? "bg-gray-600 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Place Start
        </button>
        <button
          onClick={() => setMode("end")}
          disabled={isRunning}
          className={`px-3 py-1 rounded ${
            mode === "end"
              ? "bg-gray-600 text-white"
              : "bg-gray-100 text-black"
          }`}
        >
          Place End
        </button>
        <button
          onClick={() => setMode("wall")}
          disabled={isRunning}
          className={`px-3 py-1 rounded ${
            mode === "wall"
              ? "bg-gray-700 text-white"
              : "bg-gray-200 text-black"
          }`}
        >
          Toggle Walls
        </button>
        <button
          onClick={runAStar}
          disabled={isRunning}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >
          Run A*
        </button>
        <button
          onClick={clearGrid}
          disabled={isRunning}
          className="px-3 py-1 rounded bg-orange-500 text-white"
        >
          Clear
        </button>
        <button
          onClick={generateMaze}
          disabled={isRunning}
          className="px-3 py-1 rounded bg-green-600 text-white"
        >
          Maze
        </button>
      </div>
      <div
        className="grid bg-gray-400 border border-black-300"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 20px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 20px)`,
          gap: "2px",
        }}
      >
        {grid.flat().map((cell, idx) => (
          <div
            key={idx}
            onClick={() => handleCellClick(cell)}
            className={`w-5 h-5 border border-gray-300 cursor-pointer transition-all duration-200 ${
              cell.isStart
                ? "bg-green-500"
                : cell.isEnd
                ? "bg-red-500"
                : cell.isWall
                ? "bg-gray-800"
                : path.includes(cell)
                ? "bg-yellow-300"
                : cell.inOpenSet
                ? "bg-blue-400"
                : cell.isVisited
                ? "bg-purple-400"
                : "bg-white"
            }`}
          ></div>
        ))}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

export default App;