function initializeChessPreview() {
    const previewBoard = document.getElementById('chess-game');
    // Create 8x8 grid for chess preview
    for (let i = 0; i < 64; i++) {
        const square = document.createElement('div');
        square.className = 'preview-square ' + ((i + Math.floor(i / 8)) % 2 === 0 ? 'light' : 'dark');
        previewBoard.appendChild(square);
    }
}

function initializeChessPuzzle() {
    const board = document.getElementById('chess-board');
    const piecesSelection = document.getElementById('chess-pieces-selection');
    
    // Clear any existing pieces from previous sessions
    piecesSelection.innerHTML = '';
    
    // Check if puzzle is already solved
    if (localStorage.getItem('chessPuzzleSolved') === 'true') {
        const message = document.createElement('div');
        message.className = 'win-message';
        message.textContent = "You've already solved this puzzle and found the Connect4 piece!";
        board.parentElement.insertBefore(message, board);
        
        // Show the solved state with the queen in the correct position
        const solvedPosition = '4k3/R3Q3/8/8/8/8/8/4K3 w - - 0 1';
        let chessBoard = Chessboard('chess-board', {
            position: solvedPosition,
            draggable: false,
            pieceTheme: 'https://lichess1.org/assets/piece/cburnett/{piece}.svg'
        });
        
        board.style.opacity = '0.5';
        board.style.pointerEvents = 'none';
        piecesSelection.style.display = 'none';
        return;
    }

    let selectedPiece = null;
    let game = new Chess();
    let queenPlaced = false;
    let wrongAttempts = 0;
    let hintLevel = 0;

    // Set up a puzzle position that's one move from checkmate
    // Position with White king on e1, Black king on e8, and White rook on a7 (controlling 7th rank)
    const puzzlePosition = '4k3/R7/8/8/8/8/8/4K3 w - - 0 1';
    game.load(puzzlePosition);

    // Add CSS for hint highlight
    const style = document.createElement('style');
    style.textContent = `
        .hint-square {
            box-shadow: inset 0 0 20px rgba(76, 175, 80, 0.5);
            animation: pulse 1s infinite;
        }
        .hint-diagonal {
            background: linear-gradient(45deg, 
                transparent 0%, 
                transparent 40%, 
                rgba(76, 175, 80, 0.2) 40%, 
                rgba(76, 175, 80, 0.2) 60%, 
                transparent 60%, 
                transparent 100%);
        }
        #chess-hint-button {
            padding: 8px 16px;
            margin: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        #chess-hint-button:hover {
            background-color: #45a049;
        }
        @keyframes pulse {
            0% { box-shadow: inset 0 0 20px rgba(76, 175, 80, 0.5); }
            50% { box-shadow: inset 0 0 30px rgba(76, 175, 80, 0.8); }
            100% { box-shadow: inset 0 0 20px rgba(76, 175, 80, 0.5); }
        }
    `;
    document.head.appendChild(style);

    // Initialize the chessboard
    let chessBoard = Chessboard('chess-board', {
        position: puzzlePosition,
        draggable: false,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: 'https://lichess1.org/assets/piece/cburnett/{piece}.svg'
    });

    // Available pieces for the player to use
    const availablePieces = [
        { piece: 'wQ', image: 'https://lichess1.org/assets/piece/cburnett/wQ.svg' },
    ];

    // Create piece selection options
    availablePieces.forEach(piece => {
        const pieceOption = document.createElement('div');
        pieceOption.className = 'chess-piece-option';
        pieceOption.innerHTML = `<img src="${piece.image}" alt="${piece.piece}" />`;
        pieceOption.addEventListener('click', () => {
            selectedPiece = piece.piece;
            document.querySelectorAll('.chess-piece-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            pieceOption.classList.add('selected');
        });
        piecesSelection.appendChild(pieceOption);
    });

    // Add preview pieces to the room view board
    const previewPieces = document.querySelectorAll('.preview-square');
    const fen = game.fen();
    const fenBoard = fen.split(' ')[0];
    let square = 0;
    for (let i = 0; i < fenBoard.length; i++) {
        const char = fenBoard[i];
        if (char === '/') continue;
        if (isNaN(char)) {
            const pieceColor = char === char.toUpperCase() ? 'w' : 'b';
            const pieceType = char.toLowerCase();
            previewPieces[square].innerHTML = `<img src="https://lichess1.org/assets/piece/cburnett/${pieceColor}${pieceType.toUpperCase()}.svg" class="preview-piece">`;
            square++;
        } else {
            square += parseInt(char);
        }
    }

    // Define the winning piece and position
    const WINNING_PIECE = 'wQ';
    const WINNING_SQUARE = 'e7';
    let hasCorrectPiece = false;

    // Modify the click handler for empty squares
    $('#chess-board .square-55d63').on('click', function() {
        if (!selectedPiece) {
            showHint("Select the Queen piece first!");
            return;
        }

        const square = $(this).data('square');
        if (queenPlaced) {
            showHint("You've already placed the Queen! Try a different square.");
            return;
        }

        const position = chessBoard.position();
        // Clear any existing queen
        Object.keys(position).forEach(sq => {
            if (position[sq] === 'wQ') {
                delete position[sq];
            }
        });

        // Add queen to new position
        position[square] = selectedPiece;
        chessBoard.position(position);

        // Update game state
        game = new Chess();
        game.load(puzzlePosition);
        const newFen = Chessboard.objToFen(position);
        game.load(newFen);

        if (square === WINNING_SQUARE) {
            hasCorrectPiece = true;
            queenPlaced = true;
            showHint("Perfect! The Queen on e7 is checkmate!");
            highlightWinningSquare();
            triggerWinAnimation();
        } else {
            wrongAttempts++;
            queenPlaced = true;
            showHint("That's not quite right. Try another position!");
            showProgressiveHint();
            
            // Reset after delay
            setTimeout(() => {
                resetPuzzle();
            }, 2000);
        }

        selectedPiece = null;
        document.querySelectorAll('.chess-piece-option').forEach(option => {
            option.classList.remove('selected');
        });
    });

    function showProgressiveHint() {
        $('.square-55d63').removeClass('hint-square hint-diagonal');
        
        if (wrongAttempts >= 5) {
            $(`[data-square="${WINNING_SQUARE}"]`).addClass('hint-square');
            showHint("Hint: Place the Queen on e7, where it works with the rook to checkmate!");
        } else if (wrongAttempts >= 3) {
            $('.square-55d63').each(function() {
                const sq = $(this).data('square');
                if (['e7'].includes(sq)) {
                    $(this).addClass('hint-diagonal');
                }
            });
            showHint("Hint: The rook on a7 controls the 7th rank!");
        } else if (wrongAttempts >= 2) {
            showHint("Hint: The rook and queen can work together to trap the king!");
        } else {
            showHint("Hint: Look for a checkmate using both the queen and rook!");
        }
    }

    function highlightWinningSquare() {
        $('.square-55d63').removeClass('hint-square');
        $(`[data-square="${WINNING_SQUARE}"]`).addClass('hint-square');
    }

    function showHint(message) {
        const existingHints = document.querySelectorAll('.hint-message');
        existingHints.forEach(hint => hint.remove());
        
        const hint = document.createElement('div');
        hint.className = 'hint-message';
        hint.textContent = message;
        hint.style.color = '#4CAF50';
        hint.style.marginBottom = '10px';
        board.parentElement.insertBefore(hint, board);
    }

    function onDragStart(source, piece) {
        // Only allow white pieces to be moved
        if (piece.search(/^b/) !== -1) return false;
        // Only allow moves if game is still going
        if (game.game_over()) return false;
        // Only allow moving the queen if it's in the correct position
        if (source === WINNING_SQUARE && hasCorrectPiece) return true;
        // Prevent moving other pieces if the queen is correctly placed
        if (hasCorrectPiece) return false;
        return true;
    }

    function onDrop(source, target) {
        // Try the move
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        if (game.in_checkmate()) {
            triggerWinAnimation();
        } else {
            setTimeout(() => {
                showError();
                game.undo();
                chessBoard.position(game.fen());
            }, 100);
        }
    }

    function onSnapEnd() {
        chessBoard.position(game.fen());
    }

    function showError() {
        const existingMessages = document.querySelectorAll('.error-message, .hint-message');
        existingMessages.forEach(msg => msg.remove());
        
        wrongAttempts++;
        const message = document.createElement('div');
        message.className = 'error-message';
        message.textContent = hasCorrectPiece ? 
            "Almost there! Now move the Queen to deliver checkmate!" :
            "Try placing the Queen in a better position first!";
        message.style.color = '#ff4444';
        message.style.marginBottom = '10px';
        board.parentElement.insertBefore(message, board);

        // Reset the board after a delay
        setTimeout(() => {
            resetPuzzle();
            wrongAttempts = 0;
        }, 2000);
    }

    function triggerWinAnimation() {
        const winMessage = document.createElement('div');
        winMessage.className = 'win-message';
        winMessage.textContent = "Checkmate! You've solved the chess puzzle!";
        board.parentElement.insertBefore(winMessage, board.nextSibling);

        // Save both the piece found and the solved state
        localStorage.setItem('connect4PieceFound', 'true');
        localStorage.setItem('chessPuzzleSolved', 'true');
        showAchievement('Chess Master', 'Found the perfect checkmate position!');

        const confettiConfig = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        };

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

        // Show the secret compartment after a short delay
        setTimeout(() => {
            document.getElementById('secret-compartment').classList.remove('hidden');
            // Update game state to indicate Connect4 piece is available
            localStorage.setItem('connect4PieceFound', 'true');
        }, 1500);
    }

    function resetPuzzle() {
        // Don't reset if the puzzle was already solved
        if (localStorage.getItem('connect4PieceFound') === 'true') {
            return;
        }

        // Reset the game state
        game = new Chess();
        game.load(puzzlePosition);
        chessBoard.position(puzzlePosition);
        
        // Reset flags and selections
        hasCorrectPiece = false;
        selectedPiece = null;
        selectedSquare = null;
        queenPlaced = false;
        wrongAttempts = 0;
        hintLevel = 0;
        
        // Hide the secret compartment
        document.getElementById('secret-compartment').classList.add('hidden');
        
        // Clear any messages and hints
        const messages = document.querySelectorAll('.error-message, .hint-message');
        messages.forEach(msg => msg.remove());
        $('.square-55d63').removeClass('hint-square hint-diagonal');
        
        // Reset piece selection highlights
        document.querySelectorAll('.chess-piece-option').forEach(option => {
            option.classList.remove('selected');
        });
    }

    // Add event listener for the back button to reset the puzzle
    document.getElementById('back-to-room-chess').addEventListener('click', () => {
        resetPuzzle();
    });
} 