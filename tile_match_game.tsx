import React, { useState, useEffect, useCallback } from 'react';

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const GRID_SIZE = 8;

const TileMatchGame = () => {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [moves, setMoves] = useState(0);

  // Initialize the game grid
  const initializeGrid = useCallback(() => {
    const newGrid = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const gridRow = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        gridRow.push({
          id: `${row}-${col}`,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          row,
          col,
          selected: false
        });
      }
      newGrid.push(gridRow);
    }
    setGrid(newGrid);
  }, []);

  // Check for matches (3 or more adjacent tiles of same color)
  const findMatches = useCallback((currentGrid) => {
    const matches = new Set();
    
    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      let count = 1;
      let currentColor = currentGrid[row][0].color;
      
      for (let col = 1; col < GRID_SIZE; col++) {
        if (currentGrid[row][col].color === currentColor) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = col - count; i < col; i++) {
              matches.add(`${row}-${i}`);
            }
          }
          count = 1;
          currentColor = currentGrid[row][col].color;
        }
      }
      
      if (count >= 3) {
        for (let i = GRID_SIZE - count; i < GRID_SIZE; i++) {
          matches.add(`${row}-${i}`);
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      let count = 1;
      let currentColor = currentGrid[0][col].color;
      
      for (let row = 1; row < GRID_SIZE; row++) {
        if (currentGrid[row][col].color === currentColor) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = row - count; i < row; i++) {
              matches.add(`${i}-${col}`);
            }
          }
          count = 1;
          currentColor = currentGrid[row][col].color;
        }
      }
      
      if (count >= 3) {
        for (let i = GRID_SIZE - count; i < GRID_SIZE; i++) {
          matches.add(`${i}-${col}`);
        }
      }
    }
    
    return matches;
  }, []);

  // Remove matched tiles and drop remaining tiles
  const removeMatches = useCallback((matches) => {
    if (matches.size === 0) return false;

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      
      // Remove matched tiles
      matches.forEach(tileId => {
        const [row, col] = tileId.split('-').map(Number);
        newGrid[row][col] = null;
      });
      
      // Drop tiles down
      for (let col = 0; col < GRID_SIZE; col++) {
        const column = [];
        for (let row = GRID_SIZE - 1; row >= 0; row--) {
          if (newGrid[row][col]) {
            column.push(newGrid[row][col]);
          }
        }
        
        // Fill column from bottom up
        for (let row = GRID_SIZE - 1; row >= 0; row--) {
          if (column.length > 0) {
            const tile = column.shift();
            newGrid[row][col] = {
              ...tile,
              row,
              col,
              id: `${row}-${col}`
            };
          } else {
            // Add new random tile
            newGrid[row][col] = {
              id: `${row}-${col}`,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              row,
              col,
              selected: false
            };
          }
        }
      }
      
      return newGrid;
    });
    
    setScore(prev => prev + matches.size * 10);
    return true;
  }, []);

  // Handle tile click
  const handleTileClick = (row, col) => {
    if (gameOver) return;
    
    const tileId = `${row}-${col}`;
    
    if (selectedTiles.includes(tileId)) {
      setSelectedTiles(prev => prev.filter(id => id !== tileId));
      setGrid(prevGrid => 
        prevGrid.map(gridRow => 
          gridRow.map(tile => 
            tile.id === tileId ? { ...tile, selected: false } : tile
          )
        )
      );
    } else if (selectedTiles.length < 2) {
      setSelectedTiles(prev => [...prev, tileId]);
      setGrid(prevGrid => 
        prevGrid.map(gridRow => 
          gridRow.map(tile => 
            tile.id === tileId ? { ...tile, selected: true } : tile
          )
        )
      );
    }
  };

  // Swap tiles
  const swapTiles = useCallback(() => {
    if (selectedTiles.length !== 2) return;
    
    const [tile1Id, tile2Id] = selectedTiles;
    const [row1, col1] = tile1Id.split('-').map(Number);
    const [row2, col2] = tile2Id.split('-').map(Number);
    
    // Check if tiles are adjacent
    const isAdjacent = 
      (Math.abs(row1 - row2) === 1 && col1 === col2) ||
      (Math.abs(col1 - col2) === 1 && row1 === row2);
    
    if (!isAdjacent) {
      setSelectedTiles([]);
      setGrid(prevGrid => 
        prevGrid.map(gridRow => 
          gridRow.map(tile => ({ ...tile, selected: false }))
        )
      );
      return;
    }
    
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      
      // Swap colors
      const tempColor = newGrid[row1][col1].color;
      newGrid[row1][col1] = {
        ...newGrid[row1][col1],
        color: newGrid[row2][col2].color,
        selected: false
      };
      newGrid[row2][col2] = {
        ...newGrid[row2][col2],
        color: tempColor,
        selected: false
      };
      
      return newGrid;
    });
    
    setSelectedTiles([]);
    setMoves(prev => prev + 1);
  }, [selectedTiles]);

  // Effect to handle tile swapping
  useEffect(() => {
    if (selectedTiles.length === 2) {
      const timer = setTimeout(swapTiles, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedTiles, swapTiles]);

  // Effect to check for matches and remove them
  useEffect(() => {
    if (grid.length === 0) return;
    
    const timer = setTimeout(() => {
      const matches = findMatches(grid);
      if (matches.size > 0) {
        removeMatches(matches);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [grid, findMatches, removeMatches]);

  // Initialize game on mount
  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const resetGame = () => {
    setScore(0);
    setMoves(0);
    setGameOver(false);
    setSelectedTiles([]);
    initializeGrid();
  };

  const getTileColor = (color) => {
    const colorMap = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500'
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Tile Match Game</h1>
      
      <div className="flex gap-8 mb-6">
        <div className="text-xl font-semibold">Score: {score}</div>
        <div className="text-xl font-semibold">Moves: {moves}</div>
      </div>
      
      <div className="grid grid-cols-8 gap-1 bg-gray-300 p-2 rounded-lg mb-6">
        {grid.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <div
              key={tile.id}
              className={`
                w-12 h-12 rounded cursor-pointer transition-all duration-200 border-2
                ${getTileColor(tile.color)}
                ${tile.selected ? 'border-white border-4 scale-110' : 'border-gray-400 hover:scale-105'}
              `}
              onClick={() => handleTileClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
      
      <div className="text-center mb-4">
        <p className="text-gray-600 mb-2">Click two adjacent tiles to swap them!</p>
        <p className="text-gray-600">Match 3+ tiles of the same color to score points.</p>
      </div>
      
      <button
        onClick={resetGame}
        className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
      >
        New Game
      </button>
    </div>
  );
};

export default TileMatchGame;