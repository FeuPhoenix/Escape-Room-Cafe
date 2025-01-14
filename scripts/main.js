document.addEventListener('DOMContentLoaded', () => {
    // Reset game state when starting
    localStorage.removeItem('connect4PieceFound');

    const startMenu = document.getElementById('start-menu');
    const gameArea = document.getElementById('game-area');
    const connect4Puzzle = document.getElementById('connect4-puzzle');
    const chessPuzzle = document.getElementById('chess-puzzle');
    const startButton = document.getElementById('start-button');
    const backToRoomButton = document.getElementById('back-to-room');
    const backToRoomChessButton = document.getElementById('back-to-room-chess');
    const connect4Game = document.getElementById('connect4-game');
    const chessGame = document.getElementById('chess-game');
    const resetButton = document.getElementById('reset-progress');
    const backToMenuRoomButton = document.getElementById('back-to-menu-room');

    // Initialize preview boards
    createPreviewBoard();
    initializeChessPreview();
    initializeScrabblePreview();

    // Return to menu from room view
    backToMenuRoomButton.addEventListener('click', () => {
        gameArea.classList.add('hidden');
        startMenu.classList.remove('hidden');
    });

    // Start Game
    startButton.addEventListener('click', () => {
        // Reset specific game states when starting new game
        localStorage.removeItem('connect4PieceFound');
        localStorage.removeItem('connect4Solved');
        localStorage.removeItem('chessPuzzleSolved');
        
        // Remove any existing frog easter egg elements
        const existingFrogs = document.querySelectorAll('.frog-easter-egg');
        existingFrogs.forEach(frog => frog.remove());
        
        // Reset frog easter egg state but keep the board state
        localStorage.removeItem('frogFound');
        const foundWords = JSON.parse(localStorage.getItem('foundWords') || '[]');
        const updatedWords = foundWords.filter(word => word !== 'FROG');
        localStorage.setItem('foundWords', JSON.stringify(updatedWords));
        
        // Hide start menu and show game area
        startMenu.classList.add('hidden');
        gameArea.classList.remove('hidden');
        
        // Make sure other screens are hidden
        connect4Puzzle.classList.add('hidden');
        chessPuzzle.classList.add('hidden');
        document.getElementById('scrabble-puzzle').classList.add('hidden');
    });

    // Connect 4 Interaction
    connect4Game.addEventListener('click', () => {
        // Clear any existing state
        const existingMessages = document.querySelectorAll('.error-message, .instruction-message');
        existingMessages.forEach(msg => msg.remove());
        gameArea.classList.add('hidden');
        connect4Puzzle.classList.remove('hidden');
        initializeConnect4();
    });

    // Chess Interaction
    chessGame.addEventListener('click', () => {
        // Clear any existing state
        const existingMessages = document.querySelectorAll('.error-message, .instruction-message');
        existingMessages.forEach(msg => msg.remove());
        gameArea.classList.add('hidden');
        chessPuzzle.classList.remove('hidden');
        initializeChessPuzzle();
    });

    // Return to Room buttons
    backToRoomButton.addEventListener('click', () => {
        connect4Puzzle.classList.add('hidden');
        gameArea.classList.remove('hidden');
    });

    backToRoomChessButton.addEventListener('click', () => {
        chessPuzzle.classList.add('hidden');
        gameArea.classList.remove('hidden');
        // Hide the secret compartment when returning to room
        document.getElementById('secret-compartment').classList.add('hidden');
    });

    // Scrabble Interaction
    const scrabbleGame = document.getElementById('scrabble-game');
    const backToRoomScrabbleButton = document.getElementById('back-to-room-scrabble');
    
    scrabbleGame.addEventListener('click', () => {
        gameArea.classList.add('hidden');
        document.getElementById('scrabble-puzzle').classList.remove('hidden');
        initializeScrabble();
    });
    
    backToRoomScrabbleButton.addEventListener('click', () => {
        document.getElementById('scrabble-puzzle').classList.add('hidden');
        gameArea.classList.remove('hidden');
    });

    // Add this function to create the preview board
    function createPreviewBoard() {
        const previewBoard = document.getElementById('connect4-game');
        for (let i = 0; i < 42; i++) {
            const cell = document.createElement('div');
            cell.className = 'preview-cell';
            previewBoard.appendChild(cell);
        }

        // Add some random pieces to make it look like a real board
        const previewCells = previewBoard.getElementsByClassName('preview-cell');
        const randomPattern = [
            0,0,0,1,0,0,0,
            0,0,1,2,0,0,0,
            0,0,2,1,0,0,0,
            0,1,2,2,1,0,0,
            0,2,1,1,2,0,0,
            1,2,2,1,1,2,0
        ];

        randomPattern.forEach((value, index) => {
            if (value === 1) previewCells[index].classList.add('red');
            if (value === 2) previewCells[index].classList.add('yellow');
        });
    }

    // Reset all progress
    resetButton.addEventListener('click', () => {
        // Clear all localStorage
        localStorage.clear();
        
        // Remove any existing frog easter egg elements
        const existingFrogs = document.querySelectorAll('.frog-easter-egg');
        existingFrogs.forEach(frog => frog.remove());
        
        // Reset letter visibility in the room
        const letterTiles = document.querySelectorAll('.letter-tile[data-letter]');
        letterTiles.forEach(tile => {
            tile.style.visibility = 'visible';
        });
        
        // Clear scrabble board state
        localStorage.removeItem('scrabbleBoardState');
        localStorage.removeItem('foundWords');
        
        showAchievement('Fresh Start', 'All progress has been reset!');
        
        // Reinitialize the scrabble game if it's currently visible
        const scrabblePuzzle = document.getElementById('scrabble-puzzle');
        if (!scrabblePuzzle.classList.contains('hidden')) {
            initializeScrabble();
        }
    });

    // Add achievement handling for chess puzzle
    document.addEventListener('chessPuzzleSolved', () => {
        showAchievement('Chess Master', 'Found the checkmate solution!');
    });

    // Add achievement handling for connect4 puzzle
    document.addEventListener('connect4PuzzleSolved', () => {
        showAchievement('Connect Champion', 'Solved the Connect 4 puzzle!');
    });
});

// Global achievement function
function showAchievement(title, description) {
    const achievementsContainer = document.getElementById('achievements-container');
    const achievement = document.createElement('div');
    achievement.className = 'achievement';
    
    achievement.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-content">
            <h3>${title}</h3>
            <p>${description}</p>
        </div>
    `;
    
    achievementsContainer.appendChild(achievement);
    
    // Animate in
    setTimeout(() => achievement.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
        achievement.classList.remove('show');
        setTimeout(() => achievement.remove(), 500);
    }, 5000);
    
    // Store achievement
    const achievements = JSON.parse(localStorage.getItem('gameAchievements') || '[]');
    if (!achievements.includes(title)) {
        achievements.push(title);
        localStorage.setItem('gameAchievements', JSON.stringify(achievements));
    }
} 