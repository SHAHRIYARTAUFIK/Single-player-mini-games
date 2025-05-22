import React, { useState, useEffect, useCallback } from 'react';

const ColorChainGame = () => {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(10);
  const [target, setTarget] = useState(100);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [explosions, setExplosions] = useState([]);
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
  const gridSize = 8;

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid = [];
    for (let i = 0; i < gridSize; i++) {
      const row = [];
      for (let j = 0; j < gridSize; j++) {
        row.push({
          color: colors[Math.floor(Math.random() * colors.length)],
          energy: Math.floor(Math.random() * 3) + 1,
          maxEnergy: 4,
          exploding: false,
          id: `${i}-${j}`
        });
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  }, []);

  // Initialize game
  useEffect(() => {
    initializeGrid();
    setTarget(100 * level);
    setMoves(Math.max(8, 12 - level));
  }, [level, initializeGrid]);

  // Add explosion effect
  const addExplosion = (row, col) => {
    const newExplosion = {
      id: Math.random(),
      row,
      col,
      timestamp: Date.now()
    };
    setExplosions(prev => [...prev, newExplosion]);
    
    setTimeout(() => {
      setExplosions(prev => prev.filter(exp => exp.id !== newExplosion.id));
    }, 500);
  };

  // Handle cell click
  const handleCellClick = (row, col) => {
    if (gameState !== 'playing' || moves <= 0) return;

    const newGrid = [...grid];
    const cell = newGrid[row][col];
    
    if (cell.energy >= cell.maxEnergy) return;

    // Add energy to clicked cell
    cell.energy += 1;
    
    // Chain reaction logic
    const processExplosions = () => {
      let hasExplosions = false;
      let chainScore = 0;
      
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const currentCell = newGrid[i][j];
          if (currentCell.energy >= currentCell.maxEnergy && !currentCell.exploding) {
            currentCell.exploding = true;
            hasExplosions = true;
            chainScore += 10;
            addExplosion(i, j);
            
            // Spread energy to adjacent cells of same color
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            directions.forEach(([di, dj]) => {
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize) {
                const adjacentCell = newGrid[ni][nj];
                if (adjacentCell.color === currentCell.color) {
                  adjacentCell.energy = Math.min(adjacentCell.energy + 1, adjacentCell.maxEnergy);
                }
              }
            });
          }
        }
      }
      
      // Reset exploding state and remove over-energized cells
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          if (newGrid[i][j].exploding) {
            newGrid[i][j].energy = 0;
            newGrid[i][j].exploding = false;
            newGrid[i][j].color = colors[Math.floor(Math.random() * colors.length)];
          }
        }
      }
      
      setScore(prev => prev + chainScore);
      
      if (hasExplosions) {
        setTimeout(() => processExplosions(), 300);
      }
    };

    setTimeout(() => processExplosions(), 100);
    
    setGrid(newGrid);
    setMoves(prev => prev - 1);
  };

  // Check win/lose conditions
  useEffect(() => {
    if (moves <= 0 && gameState === 'playing') {
      if (score >= target) {
        setGameState('won');
      } else {
        setGameState('lost');
      }
    }
  }, [moves, score, target, gameState]);

  // Next level
  const nextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    setScore(0);
    setTarget(100 * newLevel);
    setMoves(Math.max(8, 12 - newLevel));
    setGameState('playing');
    setExplosions([]);
    initializeGrid();
  };

  // Restart game
  const restartGame = () => {
    setLevel(1);
    setScore(0);
    setTarget(100);
    setMoves(10);
    setGameState('playing');
    setExplosions([]);
    initializeGrid();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white border-opacity-20">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Color Chain Reaction
          </h1>
          <div className="flex justify-center gap-8 text-white text-lg">
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              Score: <span className="font-bold text-yellow-300">{score}</span>
            </div>
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              Level: <span className="font-bold text-green-300">{level}</span>
            </div>
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              Moves: <span className="font-bold text-red-300">{moves}</span>
            </div>
            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
              Target: <span className="font-bold text-blue-300">{target}</span>
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <div className="relative">
          <div className="grid grid-cols-8 gap-2 bg-black bg-opacity-30 p-4 rounded-2xl">
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={cell.id}
                  className="relative w-12 h-12 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-110 hover:shadow-lg"
                  style={{
                    backgroundColor: cell.color,
                    boxShadow: `0 0 ${cell.energy * 5}px ${cell.color}50`,
                    opacity: cell.energy / cell.maxEnergy * 0.7 + 0.3
                  }}
                  onClick={() => handleCellClick(i, j)}
                >
                  {/* Energy indicators */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex gap-1">
                      {[...Array(cell.energy)].map((_, idx) => (
                        <div
                          key={idx}
                          className="w-2 h-2 bg-white rounded-full shadow-lg animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Glow effect for high energy */}
                  {cell.energy >= 3 && (
                    <div className="absolute inset-0 rounded-lg animate-pulse"
                         style={{
                           background: `radial-gradient(circle, ${cell.color}40 0%, transparent 70%)`
                         }} />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Explosion effects */}
          {explosions.map(explosion => (
            <div
              key={explosion.id}
              className="absolute pointer-events-none"
              style={{
                left: `${explosion.col * 56 + 32}px`,
                top: `${explosion.row * 56 + 32}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-16 h-16 bg-yellow-400 rounded-full animate-ping opacity-75" />
              <div className="absolute inset-0 w-16 h-16 bg-white rounded-full animate-ping opacity-50" />
            </div>
          ))}
        </div>

        {/* Game Over Modal */}
        {gameState !== 'playing' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
              <h2 className="text-3xl font-bold mb-4">
                {gameState === 'won' ? '🎉 Level Complete!' : '💫 Game Over'}
              </h2>
              <p className="text-gray-600 mb-2">Final Score: {score}</p>
              <p className="text-gray-600 mb-6">
                {gameState === 'won' 
                  ? `You reached the target of ${target} points!` 
                  : `You needed ${target} points but got ${score}.`}
              </p>
              <div className="flex gap-4 justify-center">
                {gameState === 'won' ? (
                  <button
                    onClick={nextLevel}
                    className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105"
                  >
                    Next Level
                  </button>
                ) : (
                  <button
                    onClick={restartGame}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={restartGame}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600 transition-all"
                >
                  Restart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center text-white text-sm bg-white bg-opacity-10 rounded-lg p-4">
          <p className="mb-2">
            <strong>How to Play:</strong> Click on colored orbs to add energy. When an orb reaches maximum energy, it explodes and spreads energy to adjacent orbs of the same color, creating chain reactions!
          </p>
          <p>Reach the target score within the move limit to advance to the next level.</p>
        </div>
      </div>
    </div>
  );
};

export default ColorChainGame;