function initializeScrabblePreview() {
    const previewBoard = document.getElementById('scrabble-game');
    // Create a mini scrabble board preview
    for (let i = 0; i < 225; i++) {
        const cell = document.createElement('div');
        cell.className = 'preview-cell';
        previewBoard.appendChild(cell);
    }
}

function initializeScrabble() {
    // Reset game state at start
    if (!localStorage.getItem('gameAchievements')) {
        localStorage.setItem('gameAchievements', JSON.stringify([]));
    }

    const board = document.getElementById('scrabble-board');
    const playerTiles = document.getElementById('player-tiles');
    const collectedLetters = document.getElementById('collected-letters');
    
    // Clear any existing content and messages
    board.innerHTML = '';
    playerTiles.innerHTML = '';
    collectedLetters.innerHTML = '';
    
    // Clear any existing messages and buttons
    const existingElements = document.querySelectorAll('.hint-message, .instruction-message, .error-message, .win-message, .word-found-message, .hint-button');
    existingElements.forEach(el => el.remove());

    // Define valid words
    const validWords = [
        'ESCAPE', // Main solution
        'FROG',   // Easter egg
        'PLAY',   // Theme words
        'YEAR',
        'PACK',
        'FAJITA'
    ];

    // Create the scrabble board (15x15)
    for (let i = 0; i < 225; i++) {
        const cell = document.createElement('div');
        cell.className = 'scrabble-cell';
        cell.dataset.index = i;
        board.appendChild(cell);
    }

    // Add starting letters on the board to form some thematic words
    const startingLetters = {
        111: 'P', // Center of board - forms PLAY
        112: 'L',
        113: 'A',
        114: 'Y',
        126: 'A', // Below - forms PACK
        129: 'E',
        141: 'C', 
        144: 'A',
        156: 'K',
        159: 'R',
        98: 'T',
        83: 'I',
        68: 'J',
        53: 'A',
        38: 'F',
    };

    // Keep track of found words to prevent repeating messages
    let foundWordsSet = new Set(JSON.parse(localStorage.getItem('foundWords') || '[]'));
    // Keep track of whether ESCAPE has been found
    let escapeFound = localStorage.getItem('scrabbleSolved') === 'true';
    // Keep track of frog easter egg
    let frogFound = localStorage.getItem('frogFound') === 'true';

    // Place starting letters
    Object.entries(startingLetters).forEach(([index, letter]) => {
        const cell = board.children[parseInt(index)];
        const tile = createLetterTile(letter, false);
        cell.appendChild(tile);
    });

    // Restore saved board state
    const savedBoardState = JSON.parse(localStorage.getItem('scrabbleBoardState') || '{}');
    Object.entries(savedBoardState).forEach(([index, letter]) => {
        const cell = board.children[parseInt(index)];
        if (!cell.hasChildNodes()) { // Only place if cell is empty
            const tile = createLetterTile(letter, false);
            cell.appendChild(tile);
        }
    });

    let tryAgainButtonExists = false;
    let collectedLettersCount = 0;

    // Initialize the player's collected letters
    const collectedLettersArray = JSON.parse(localStorage.getItem('collectedScrabbleLetters') || '[]');
    collectedLettersArray.forEach(letter => {
        const tile = createLetterTile(letter);
        collectedLetters.appendChild(tile);
    });

    // Add hint button
    if (!localStorage.getItem('scrabbleSolved')) {
        const existingHintButton = document.querySelector('.hint-button');
        if (existingHintButton) {
            existingHintButton.remove();
        }
        const hintButton = document.createElement('button');
        hintButton.textContent = 'Get Hint';
        hintButton.className = 'hint-button';
        hintButton.addEventListener('click', showHint);
        board.parentElement.insertBefore(hintButton, board);
    }

    let hintCount = 0;
    function showHint() {
        const hints = [
            "Look around the room for letters...",
            "There are some game-related words on the board...",
            "Try forming a word that means 'to get out'...",
            "The word you're looking for has 6 letters...",
            "It starts with 'E'...",
            "ESCAPE is the word you need!"
        ];
        
        const message = document.createElement('div');
        message.className = 'hint-message';
        message.textContent = hints[hintCount % hints.length];
        board.parentElement.insertBefore(message, board);
        
        setTimeout(() => message.remove(), 3000);
        hintCount++;
    }

    // Initialize drag and drop
    initializeDragAndDrop();

    function createLetterTile(letter, isDraggable = true) {
        const tile = document.createElement('div');
        tile.className = 'letter-tile' + (isDraggable ? ' draggable' : '');
        tile.textContent = letter;
        if (isDraggable) {
            tile.draggable = true;
            tile.dataset.letter = letter;
        }
        return tile;
    }

    function initializeDragAndDrop() {
        const draggables = document.querySelectorAll('.draggable');
        const dropZones = document.querySelectorAll('.scrabble-cell');

        // Add click-to-place functionality
        let selectedTile = null;
        
        draggables.forEach(tile => {
            tile.addEventListener('click', () => {
                // Deselect if already selected
                if (selectedTile === tile) {
                    selectedTile.classList.remove('selected');
                    selectedTile = null;
                    return;
                }
                
                // Remove selection from other tiles
                if (selectedTile) {
                    selectedTile.classList.remove('selected');
                }
                
                selectedTile = tile;
                tile.classList.add('selected');
            });
        });
        
        dropZones.forEach(zone => {
            zone.addEventListener('click', () => {
                if (selectedTile && !zone.hasChildNodes()) {
                    const letter = selectedTile.dataset.letter;
                    const tile = createLetterTile(letter, false);
                    zone.appendChild(tile);
                    
                    // Remove the letter from collected letters in localStorage
                    const collectedLetters = JSON.parse(localStorage.getItem('collectedScrabbleLetters') || '[]');
                    const index = collectedLetters.indexOf(letter);
                    if (index > -1) {
                        collectedLetters.splice(index, 1);
                        localStorage.setItem('collectedScrabbleLetters', JSON.stringify(collectedLetters));
                    }
                    
                    selectedTile.remove();
                    selectedTile = null;
                    checkForWords();
                    updateCollectedLetters(); // Update the display
                } else if (zone.firstChild) {
                    // Check if the letter is part of a completed word
                    const currentWords = findWords();
                    const completedWords = currentWords.filter(word => validWords.includes(word));
                    let isPartOfCompletedWord = false;

                    // Check each completed word
                    for (const word of completedWords) {
                        const wordCells = findWordCells(word);
                        if (wordCells.includes(zone)) {
                            isPartOfCompletedWord = true;
                            break;
                        }
                    }

                    if (!isPartOfCompletedWord) {
                        // Return letter to collection only if it's not part of a completed word
                        const letter = zone.firstChild.textContent;
                        const collectedLetters = JSON.parse(localStorage.getItem('collectedScrabbleLetters') || '[]');
                        collectedLetters.push(letter);
                        localStorage.setItem('collectedScrabbleLetters', JSON.stringify(collectedLetters));
                        
                        zone.removeChild(zone.firstChild);
                        updateCollectedLetters(); // Update the display
                        initializeDragAndDrop();
                    }
                }
            });
        });

        // Keep drag and drop as fallback
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', e => {
                draggable.classList.add('dragging');
                e.dataTransfer.setData('text/plain', draggable.dataset.letter);
            });

            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('dragging');
            });
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', e => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                if (!zone.hasChildNodes()) {
                    const letter = e.dataTransfer.getData('text/plain');
                    const tile = createLetterTile(letter, false);
                    zone.appendChild(tile);
                    
                    // Remove the letter from collected letters in localStorage
                    const collectedLetters = JSON.parse(localStorage.getItem('collectedScrabbleLetters') || '[]');
                    const index = collectedLetters.indexOf(letter);
                    if (index > -1) {
                        collectedLetters.splice(index, 1);
                        localStorage.setItem('collectedScrabbleLetters', JSON.stringify(collectedLetters));
                    }
                    
                    // Remove the dragged tile
                    const draggedTile = document.querySelector('.dragging');
                    if (draggedTile) draggedTile.remove();
                    
                    checkForWords();
                    updateCollectedLetters(); // Update the display
                }
            });
        });
    }

    function checkForWords() {
        const words = findWords();
        const foundWords = words.filter(word => validWords.includes(word));
        
        if (foundWords.length > 0) {
            foundWords.forEach(word => {
                // Skip if word is already found (including FROG)
                if (foundWordsSet.has(word)) return;
                
                foundWordsSet.add(word);
                // Save found words to localStorage
                localStorage.setItem('foundWords', JSON.stringify([...foundWordsSet]));
                
                // Save the current board state
                const boardState = {};
                board.childNodes.forEach((cell, index) => {
                    if (cell.firstChild && cell.firstChild.textContent) {
                        boardState[index] = cell.firstChild.textContent;
                    }
                });
                localStorage.setItem('scrabbleBoardState', JSON.stringify(boardState));
                
                if (['PLAY', 'YEAR', 'PACK', 'FAJITA'].includes(word)) return;
                
                const achievements = JSON.parse(localStorage.getItem('gameAchievements') || '[]');
                if (word === 'ESCAPE' && !achievements.includes('Master Wordsmith')) {
                    triggerWinAnimation();
                    escapeFound = true;
                    // Hide hint button after solving
                    const hintButton = document.querySelector('.hint-button');
                    if (hintButton) hintButton.remove();
                } else if (word === 'FROG' && !localStorage.getItem('frogFound')) {
                    triggerFrogEasterEgg();
                    localStorage.setItem('frogFound', 'true');
                } else {
                    showWordFoundMessage(word);
                }
            });
        } else if (!tryAgainButtonExists) {
            addTryAgainButton();
            tryAgainButtonExists = true;
        }
    }

    function findWords() {
        const words = [];
        const cells = Array.from(board.children);
        
        // Check horizontal words
        for (let row = 0; row < 15; row++) {
            let word = [];
            for (let col = 0; col < 15; col++) {
                const cell = cells[row * 15 + col];
                const letter = cell.textContent;
                if (letter) {
                    word.push({ letter, index: row * 15 + col });
                } else if (word.length > 1) {
                    words.push(word.map(w => w.letter).join(''));
                    words.push(...findConnectedWords(word));
                    word = [];
                }
            }
            if (word.length > 1) {
                words.push(word.map(w => w.letter).join(''));
                words.push(...findConnectedWords(word));
            }
        }

        // Check vertical words
        for (let col = 0; col < 15; col++) {
            let word = [];
            for (let row = 0; row < 15; row++) {
                const cell = cells[row * 15 + col];
                const letter = cell.textContent;
                if (letter) {
                    word.push({ letter, index: row * 15 + col });
                } else if (word.length > 1) {
                    words.push(word.map(w => w.letter).join(''));
                    words.push(...findConnectedWords(word));
                    word = [];
                }
            }
            if (word.length > 1) {
                words.push(word.map(w => w.letter).join(''));
                words.push(...findConnectedWords(word));
            }
        }

        return [...new Set(words)]; // Remove duplicates
    }

    function findConnectedWords(wordTiles) {
        const cells = Array.from(board.children);
        const connectedWords = [];

        wordTiles.forEach(({ letter, index }) => {
            // Check for vertical words from this letter
            if (index % 15 === index % 15) { // If it's in the same column
                let verticalWord = [];
                // Check upwards
                for (let i = index; i >= 0; i -= 15) {
                    const cell = cells[i];
                    if (!cell || !cell.textContent) break;
                    verticalWord.unshift(cell.textContent);
                }
                // Check downwards
                for (let i = index + 15; i < 225; i += 15) {
                    const cell = cells[i];
                    if (!cell || !cell.textContent) break;
                    verticalWord.push(cell.textContent);
                }
                if (verticalWord.length > 1) {
                    connectedWords.push(verticalWord.join(''));
                }
            }

            // Check for horizontal words from this letter
            const row = Math.floor(index / 15);
            const rowStart = row * 15;
            const rowEnd = rowStart + 14;
            let horizontalWord = [];
            // Check leftwards
            for (let i = index; i >= rowStart; i--) {
                const cell = cells[i];
                if (!cell || !cell.textContent) break;
                horizontalWord.unshift(cell.textContent);
            }
            // Check rightwards
            for (let i = index + 1; i <= rowEnd; i++) {
                const cell = cells[i];
                if (!cell || !cell.textContent) break;
                horizontalWord.push(cell.textContent);
            }
            if (horizontalWord.length > 1) {
                connectedWords.push(horizontalWord.join(''));
            }
        });

        return connectedWords;
    }

    function showSolvedState() {
        // Show the solved puzzle state
        board.innerHTML = '';
        for (let i = 0; i < 225; i++) {
            const cell = document.createElement('div');
            cell.className = 'scrabble-cell';
            board.appendChild(cell);
        }

        // Display the winning word
        const solution = ['E', 'S', 'C', 'A', 'P', 'E'];
        solution.forEach((letter, index) => {
            const cell = board.children[112 + index];
            const tile = createLetterTile(letter, false);
            cell.appendChild(tile);
        });

        const message = document.createElement('div');
        message.className = 'win-message';
        message.textContent = "You've already solved this puzzle!";
        board.parentElement.insertBefore(message, board);

        board.style.opacity = '0.8';
        board.style.pointerEvents = 'none';
        playerTiles.style.display = 'none';
    }

    function triggerWinAnimation() {
        // Remove any existing win messages first
        const existingMessages = document.querySelectorAll('.win-message');
        existingMessages.forEach(msg => msg.remove());
        
        const winMessage = document.createElement('div');
        winMessage.className = 'win-message';
        winMessage.textContent = "Congratulations! You've solved the Scrabble puzzle!";
        board.parentElement.insertBefore(winMessage, board.nextSibling);

        localStorage.setItem('scrabbleSolved', 'true');
        showAchievement('Master Wordsmith', 'Solved the Scrabble puzzle by finding ESCAPE!');

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
    }

    function triggerFrogEasterEgg() {
        // Remove any existing frogs first
        const existingFrogs = document.querySelectorAll('.frog-easter-egg');
        existingFrogs.forEach(frog => frog.remove());
        
        showAchievement('Frog Finder', 'Found the secret frog by spelling FROG!');
        
        const frog = document.createElement('div');
        frog.className = 'frog-easter-egg';
        frog.innerHTML = '🐸';
        document.body.appendChild(frog);
        
        // Show a message
        const message = document.createElement('div');
        message.className = 'word-found-message';
        message.textContent = "You found the secret frog! 🐸";
        board.parentElement.insertBefore(message, board);
        setTimeout(() => message.remove(), 2000);
        
        // Add a small delay before starting the animation
        setTimeout(() => {
            frog.style.animation = 'jumpOut 2s cubic-bezier(0.5, 0, 0.5, 1) forwards';
            // Play a ribbit sound (optional)
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#90EE90', '#98FB98', '#32CD32']  // Green confetti
            });
            setTimeout(() => frog.remove(), 2000);
        }, 100);
    }

    function showWordFoundMessage(word) {
        const message = document.createElement('div');
        message.className = 'word-found-message';
        message.textContent = `Found word: ${word}!`;
        board.parentElement.insertBefore(message, board);
        setTimeout(() => message.remove(), 2000);
    }

    function addTryAgainButton() {
        const existingButton = document.querySelector('.try-again-button');
        if (existingButton) {
            existingButton.remove();
        }

        const tryAgainBtn = document.createElement('button');
        tryAgainBtn.textContent = 'Try Again';
        tryAgainBtn.className = 'try-again-button';
        tryAgainBtn.addEventListener('click', () => {
            // Clear the board but keep collected letters
            const cells = document.querySelectorAll('.scrabble-cell');
            cells.forEach(cell => {
                if (cell.firstChild) {
                    const letter = cell.firstChild.textContent;
                    collectedLettersCount = document.querySelectorAll('#collected-letters .letter-tile').length;
                    const tile = createLetterTile(letter);
                    collectedLetters.appendChild(tile);
                    cell.removeChild(cell.firstChild);
                }
            });
            tryAgainBtn.remove();
            tryAgainButtonExists = false;
            initializeDragAndDrop();
        });
        board.parentElement.insertBefore(tryAgainBtn, board.nextSibling);
    }

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

    // Update the collected letters display
    function updateCollectedLetters() {
        const collectedLettersDiv = document.getElementById('collected-letters');
        collectedLettersDiv.innerHTML = '';
        const collectedLettersArray = JSON.parse(localStorage.getItem('collectedScrabbleLetters') || '[]');
        collectedLettersArray.forEach(letter => {
            const tile = createLetterTile(letter);
            collectedLettersDiv.appendChild(tile);
        });
        
        // Reinitialize drag and drop after updating letters
        initializeDragAndDrop();
    }

    // Call this when initializing and after any letter collection
    updateCollectedLetters();

    // Add helper function to find cells containing a word
    function findWordCells(targetWord) {
        const cells = Array.from(board.children);
        
        // Check horizontal words
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const cellsInWord = [];
                let word = '';
                
                // Build word horizontally
                for (let i = 0; i < 15 - col; i++) {
                    const cell = cells[row * 15 + col + i];
                    if (!cell.firstChild) break;
                    word += cell.firstChild.textContent;
                    cellsInWord.push(cell);
                    
                    // Check if we found our target word
                    if (word === targetWord) {
                        return cellsInWord;
                    }
                }
            }
        }
        
        // Check vertical words
        for (let col = 0; col < 15; col++) {
            for (let row = 0; row < 15; row++) {
                const cellsInWord = [];
                let word = '';
                
                // Build word vertically
                for (let i = 0; i < 15 - row; i++) {
                    const cell = cells[(row + i) * 15 + col];
                    if (!cell.firstChild) break;
                    word += cell.firstChild.textContent;
                    cellsInWord.push(cell);
                    
                    // Check if we found our target word
                    if (word === targetWord) {
                        return cellsInWord;
                    }
                }
            }
        }
        
        return [];
    }
}

// Update the letter collection setup
document.addEventListener('DOMContentLoaded', () => {
    // Add all required letters for both ESCAPE and FROG
    const roomLetters = [
        { letter: 'S', top: '60%', left: '70%', rotate: '-10deg' },
        { letter: 'C', top: '35%', left: '80%', rotate: '5deg' },
        { letter: 'A', top: '20%', left: '25%', rotate: '15deg' },
        { letter: 'P', top: '45%', left: '15%', rotate: '-5deg' },
        { letter: 'E', top: '75%', left: '40%', rotate: '8deg' },
        { letter: 'R', top: '55%', left: '85%', rotate: '12deg' },
        { letter: 'O', top: '30%', left: '65%', rotate: '-8deg' },
        { letter: 'G', top: '85%', left: '55%', rotate: '7deg' }
    ];

    // Clear existing letters in room view
    const roomView = document.querySelector('#room-view');
    const existingLetters = roomView.querySelectorAll('.letter-tile');
    existingLetters.forEach(letter => letter.remove());

    // Add letters to the room
    roomLetters.forEach(({letter, top, left, rotate}) => {
        const tile = document.createElement('div');
        tile.className = 'interactive-item letter-tile';
        tile.dataset.letter = letter;
        tile.textContent = letter;
        tile.style.top = top;
        tile.style.left = left;
        tile.style.transform = `rotate(${rotate})`;
        roomView.appendChild(tile);

        // Check if this letter was already collected or if puzzle is solved
        const collectedLetters = JSON.parse(localStorage.getItem('collectedScrabbleLetters') || '[]');
        const isPuzzleSolved = localStorage.getItem('scrabbleSolved') === 'true';
        if (collectedLetters.includes(letter) || isPuzzleSolved) {
            tile.style.visibility = 'hidden';
        }
    });

    // Add click handlers to all letter tiles
    const allLetterTiles = document.querySelectorAll('.letter-tile[data-letter]');
    allLetterTiles.forEach(tile => {
        tile.addEventListener('click', () => {
            // Don't allow collection if puzzle is solved
            if (localStorage.getItem('scrabbleSolved') === 'true') {
                return;
            }

            const letter = tile.dataset.letter;
            const collectedLetters = JSON.parse(localStorage.getItem('collectedScrabbleLetters') || '[]');
            
            if (!collectedLetters.includes(letter)) {
                collectedLetters.push(letter);
                localStorage.setItem('collectedScrabbleLetters', JSON.stringify(collectedLetters));
                tile.style.visibility = 'hidden';
                
                // Show collection animation
                const notification = document.createElement('div');
                notification.className = 'collection-notification';
                notification.textContent = `Collected letter ${letter}!`;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 2000);

                // Refresh the scrabble board if it's open
                if (!document.getElementById('scrabble-puzzle').classList.contains('hidden')) {
                    initializeScrabble();
                }
            }
        });
    });
}); 