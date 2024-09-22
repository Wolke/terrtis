// Model
class TetrisModel {
    constructor() {
        this.board = [];
        this.currentPiece = null;
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.boardWidth = 10;
        this.boardHeight = 20;
    }

    initBoard() {
        this.board = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
    }

    createNewPiece() {
        const pieces = [
            [[1, 1, 1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1, 1], [0, 1, 0]],
            [[1, 1, 1], [1, 0, 0]],
            [[1, 1, 1], [0, 0, 1]],
            [[1, 1, 0], [0, 1, 1]],
            [[0, 1, 1], [1, 1, 0]]
        ];
        this.currentPiece = {
            shape: pieces[Math.floor(Math.random() * pieces.length)],
            x: Math.floor(this.boardWidth / 2) - 1,
            y: 0
        };
    }

    movePiece(direction) {
        const newX = this.currentPiece.x + (direction === 'left' ? -1 : 1);
        if (this.isValidMove(newX, this.currentPiece.y)) {
            this.currentPiece.x = newX;
            return true;
        }
        return false;
    }

    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((val, index) =>
            this.currentPiece.shape.map(row => row[index]).reverse()
        );
        if (this.isValidMove(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
            return true;
        }
        return false;
    }

    isValidMove(x, y, shape = this.currentPiece.shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] &&
                    (x + col < 0 || x + col >= this.boardWidth ||
                        y + row >= this.boardHeight ||
                        this.board[y + row][x + col])) {
                    return false;
                }
            }
        }
        return true;
    }

    mergePiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    this.board[this.currentPiece.y + row][this.currentPiece.x + col] = 1;
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        for (let row = this.boardHeight - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell === 1)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.boardWidth).fill(0));
                linesCleared++;
                row++;
            }
        }
        return linesCleared;
    }

    updateScore(clearedLines) {
        const points = [0, 40, 100, 300, 1200];
        this.score += points[clearedLines] * this.level;
        this.level = Math.floor(this.score / 1000) + 1;
    }

    moveDown() {
        if (this.isValidMove(this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            return true;
        }
        this.mergePiece();
        const clearedLines = this.clearLines();
        this.updateScore(clearedLines);
        this.createNewPiece();
        if (!this.isValidMove(this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver = true;
        }
        return false;
    }

    getCurrentBoard() {
        // 創建當前遊戲板的副本
        const boardCopy = this.board.map(row => [...row]);

        // 將當前方塊添加到副本中
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const boardY = this.currentPiece.y + y;
                        const boardX = this.currentPiece.x + x;
                        if (boardY >= 0 && boardY < this.boardHeight && boardX >= 0 && boardX < this.boardWidth) {
                            boardCopy[boardY][boardX] = 2; // 使用不同的值來表示當前方塊
                        }
                    }
                }
            }
        }

        return boardCopy;
    }
}

// View
class TetrisView {
    constructor() {
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.querySelector('#score span');
        this.levelElement = document.querySelector('#level span');
        this.startButton = document.getElementById('start-button');
    }

    renderBoard(board) {
        this.gameBoard.innerHTML = '';
        board.forEach(row => {
            row.forEach(cell => {
                const div = document.createElement('div');
                if (cell === 1) {
                    div.className = 'cell filled';
                } else if (cell === 2) {
                    div.className = 'cell current';
                } else {
                    div.className = 'cell';
                }
                this.gameBoard.appendChild(div);
            });
        });
    }

    updateScore(score) {
        this.scoreElement.textContent = score;
    }

    updateLevel(level) {
        this.levelElement.textContent = level;
    }
}

// Controller
class TetrisController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.intervalId = null;
        this.bindEvents();
    }

    bindEvents() {
        this.view.startButton.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    startGame() {
        this.model.initBoard();
        this.model.createNewPiece();
        this.updateView();
        this.startGameLoop();
    }

    handleKeyPress(e) {
        if (this.model.gameOver) return;
        switch (e.key) {
            case 'ArrowLeft':
                this.model.movePiece('left');
                break;
            case 'ArrowRight':
                this.model.movePiece('right');
                break;
            case 'ArrowDown':
                this.model.moveDown();
                break;
            case 'ArrowUp':
                this.model.rotatePiece();
                break;
        }
        this.updateView();
    }

    updateView() {
        this.view.renderBoard(this.model.getCurrentBoard());
        this.view.updateScore(this.model.score);
        this.view.updateLevel(this.model.level);
    }

    startGameLoop() {
        const gameSpeed = () => Math.max(100, 1000 - this.model.level * 100);
        this.intervalId = setInterval(() => {
            if (this.model.gameOver) {
                clearInterval(this.intervalId);
                alert('遊戲結束！您的得分是: ' + this.model.score);
                return;
            }
            this.model.moveDown();
            this.updateView();
        }, gameSpeed());
    }
}

// 初始化遊戲
const model = new TetrisModel();
const view = new TetrisView();
const controller = new TetrisController(model, view);