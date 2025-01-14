function initializeConnect4() {
    const board = document.getElementById('connect4-board');
    const ROWS = 6;
    const COLS = 7;
    
    // Check if the chess puzzle is solved and the piece is available
    const hasRedPiece = localStorage.getItem('connect4PieceFound') === 'true';
    const isPuzzleSolved = localStorage.getItem('connect4Solved') === 'true';
    
    // Clear any existing messages and state
    const existingMessages = document.querySelectorAll('.error-message, .instruction-message');
    existingMessages.forEach(msg => msg.remove());
    board.innerHTML = '';

    if (!hasRedPiece) {
        const message = document.createElement('p');
        message.textContent = "You're missing a red piece! Solve the chess puzzle to find it.";
        message.style.color = '#ff4444';
        message.className = 'error-message';
        board.parentElement.insertBefore(message, board);
        // Disable the board
        board.style.opacity = '0.5';
        board.style.pointerEvents = 'none';
        createEmptyBoard();
        return;
    }

    // Enable the board if piece is found
    board.style.opacity = '1';
    board.style.pointerEvents = 'auto';

    let currentPlayer = 'red';
    let gameBoard = Array(ROWS).fill().map(() => Array(COLS).fill(null));
    let movesMade = 0;

    function createEmptyBoard() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                board.appendChild(cell);
            }
        }
    }

    let previewColumn = null; // Track current preview column

    // Create board cells
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(col));
            
            // Add mouse enter/leave events for preview
            cell.addEventListener('mouseenter', () => showPreview(col));
            cell.addEventListener('mouseleave', () => clearPreview());
            
            board.appendChild(cell);
        }
    }

    // Add these new functions for preview
    function showPreview(col) {
        // Check if the player has found the piece from chess puzzle
        const hasFoundPiece = localStorage.getItem('connect4PieceFound') === 'true';
        if (!hasFoundPiece) return;

        if (movesMade > 0) return; // Don't show preview if move was made
        
        clearPreview(); // Clear any existing preview
        const row = findLowestEmptyRow(col);
        if (row !== -1) {
            const cell = board.children[row * COLS + col];
            cell.classList.add('preview');
            cell.style.backgroundColor = currentPlayer === 'red' 
                ? 'rgba(255, 68, 68, 0.4)' 
                : 'rgba(255, 235, 59, 0.4)';
            previewColumn = col;
        }
    }

    function clearPreview() {
        if (previewColumn !== null) {
            const cells = board.getElementsByClassName('cell');
            Array.from(cells).forEach(cell => {
                cell.classList.remove('preview');
                cell.style.backgroundColor = ''; // Reset any preview color
            });
            previewColumn = null;
        }
    }

    function triggerWinAnimation() {
        // Create and show win message
        const winMessage = document.createElement('div');
        winMessage.className = 'win-message';
        winMessage.textContent = "Congratulations! You've solved the Connect 4 puzzle!";
        board.parentElement.insertBefore(winMessage, board.nextSibling);

        // Save the solved state
        localStorage.setItem('connect4Solved', 'true');
        showAchievement('Connect Master', 'Completed the winning Connect 4 move!');

        // Trigger confetti
        const confettiConfig = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        };

        // Multiple confetti bursts
        confetti(confettiConfig);
        setTimeout(() => confetti({
            ...confettiConfig,
            particleCount: 50,
            origin: { y: 0.7, x: 0.3 }
        }), 200);
        setTimeout(() => confetti({
            ...confettiConfig,
            particleCount: 50,
            origin: { y: 0.7, x: 0.7 }
        }), 400);
    }

    function handleCellClick(col) {
        // Check if the player has found the piece from chess puzzle
        const hasFoundPiece = localStorage.getItem('connect4PieceFound') === 'true';
        if (!hasFoundPiece) {
            const message = document.createElement('div');
            message.className = 'error-message';
            message.textContent = "You need to find the red piece first! Try solving the chess puzzle.";
            message.style.color = '#ff4444';
            message.style.marginBottom = '10px';
            board.parentElement.insertBefore(message, board);
            return;
        }

        if (movesMade > 0) return; // Only allow one move
        
        const row = findLowestEmptyRow(col);
        if (row === -1) return; // Column is full

        gameBoard[row][col] = currentPlayer;
        updateCell(row, col);
        movesMade++;
        clearPreview(); // Clear any preview

        if (checkWin(row, col)) {
            triggerWinAnimation();
            return;
        } else if (movesMade > 0) {
            setTimeout(() => {
                // Remove any existing error messages
                const existingMessages = document.querySelectorAll('.error-message');
                existingMessages.forEach(msg => msg.remove());
                
                const message = document.createElement('div');
                message.className = 'error-message';
                message.textContent = "That wasn't the right move. Try again!";
                message.style.color = '#ff4444';
                message.style.marginBottom = '10px';
                board.parentElement.insertBefore(message, board);
                
                // Wait a tiny bit before reinitializing to let the animation play
                setTimeout(() => {
                    initializeConnect4();
                }, 600); // Wait for shake animation to complete
            }, 100);
        }
    }

    function findLowestEmptyRow(col) {
        for (let row = ROWS - 1; row >= 0; row--) {
            if (!gameBoard[row][col]) return row;
        }
        return -1;
    }

    function updateCell(row, col) {
        const cell = board.children[row * COLS + col];
        cell.classList.add(currentPlayer);
    }

    function checkWin(row, col) {
        // Check horizontal, vertical, and diagonal wins
        return (
            checkDirection(row, col, 0, 1) || // Horizontal
            checkDirection(row, col, 1, 0) || // Vertical
            checkDirection(row, col, 1, 1) || // Diagonal /
            checkDirection(row, col, 1, -1)   // Diagonal \
        );
    }

    function checkDirection(row, col, rowDir, colDir) {
        const player = gameBoard[row][col];
        let count = 1;

        // Check in positive direction
        for (let i = 1; i < 4; i++) {
            const newRow = row + (rowDir * i);
            const newCol = col + (colDir * i);
            if (
                newRow < 0 || newRow >= ROWS ||
                newCol < 0 || newCol >= COLS ||
                gameBoard[newRow][newCol] !== player
            ) break;
            count++;
        }

        // Check in negative direction
        for (let i = 1; i < 4; i++) {
            const newRow = row - (rowDir * i);
            const newCol = col - (colDir * i);
            if (
                newRow < 0 || newRow >= ROWS ||
                newCol < 0 || newCol >= COLS ||
                gameBoard[newRow][newCol] !== player
            ) break;
            count++;
        }

        return count >= 4;
    }

    // Set up the puzzle scenario with a nearly complete game
    const puzzleSetup = [
        [null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null],
        [null, null, null, 'red', null, null, null],
        [null, null, 'red', 'yellow', null, null, null],
        [null, 'red', 'yellow', 'yellow', null, null, null],
        [null, 'yellow', 'yellow', 'red', 'red', null, null]
    ];

    // Apply the puzzle setup to the game board
    gameBoard = puzzleSetup;
    
    // Update the visual board to match the puzzle setup
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (gameBoard[row][col]) {
                const cell = board.children[row * COLS + col];
                cell.classList.add(gameBoard[row][col]);
            }
        }
    }

    // Start with red player (the player needs to complete red's winning move)
    currentPlayer = 'red';

    // Add message to indicate the puzzle goal
    const message = document.createElement('p');
    message.className = 'instruction-message';
    message.textContent = hasRedPiece 
        ? "You found a red piece! Place it carefully to create a winning line..." 
        : "Find the missing red piece first!";
    message.style.marginBottom = '20px';
    board.parentElement.insertBefore(message, board);

    // If puzzle is already solved, show the solution
    if (isPuzzleSolved) {
        // Clear the board first
        board.innerHTML = '';
        
        const solvedSetup = [
            [null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null],
            [null, null, null, 'red', null, null, null],
            [null, null, 'red', 'yellow', null, null, null],
            [null, 'red', 'yellow', 'yellow', 'red', null, null],
            [null, 'yellow', 'yellow', 'red', 'red', null, null]
        ];
        
        // Create the board cells
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                board.appendChild(cell);
            }
        }
        
        // Apply the solved state
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (solvedSetup[row][col]) {
                    const cell = board.children[row * COLS + col];
                    cell.classList.add(solvedSetup[row][col]);
                }
            }
        }
        
        // Add the solved message
        const existingMessages = document.querySelectorAll('.win-message');
        existingMessages.forEach(msg => msg.remove());
        
        const message = document.createElement('div');
        message.className = 'win-message';
        message.textContent = "You've already solved this puzzle!";
        board.parentElement.insertBefore(message, board);
        
        board.style.opacity = '0.8';
        board.style.pointerEvents = 'none';
        return;
    }
} 