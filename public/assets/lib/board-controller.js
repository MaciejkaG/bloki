class GameController {
    constructor(canvasId) {
        const canvas = document.getElementById(canvasId);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Board and block settings
        this.rows = 20; // Standard rows
        this.cols = 10; // Standard columns
        this.cellSize = canvas.height / this.rows; // Auto-size cells
        this.board = this.createEmptyBoard(); // Logical representation of the grid
        this.blockRadius = 5; // Block border radius

        // Block management
        this.blocks = this.getBlocks();
        this.currentPiece = this.getRandomBlock();
        this.queue = Array(5).fill(null).map(() => this.getRandomBlock());

        // Position and movement
        this.currentX = Math.floor(this.cols / 2) - 2; // Start at top-center
        this.currentY = 0;
        this.rotationState = 0; // Track rotation state (0-3)

        // Bind input
        document.addEventListener("keydown", (e) => this.handleInput(e));

        this.gameLoopTimeouts = [];
        // Start the game loop
        this.gameLoop();
    }

    // Create empty grid
    createEmptyBoard() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    // Block shapes
    getBlocks() {
        return {
            I: {
                shape: [[1, 1, 1, 1]],
                colour: '#31c0e0',
            },
            J: {
                shape: [
                    [1, 0, 0],
                    [1, 1, 1],
                ],
                colour: '#1e5ee8',
            },
            L: {
                shape: [
                    [0, 0, 1],
                    [1, 1, 1],
                ],
                colour: '#d66e1e',
            },
            O: {
                shape: [
                    [1, 1],
                    [1, 1],
                ],
                colour: '#d1c719',
            },
            S: {
                shape: [
                    [0, 1, 1],
                    [1, 1, 0],
                ],
                colour: '#14a322',
            },
            T: {
                shape: [
                    [0, 1, 0],
                    [1, 1, 1],
                ],
                colour: '#6324a6',
            },
            Z: {
                shape: [
                    [1, 1, 0],
                    [0, 1, 1],
                ],
                colour: '#cf2d3e',
            },
        };
    }

    // Generate random Block
    getRandomBlock() {
        const keys = Object.keys(this.blocks);
        const block = this.blocks[keys[Math.floor(Math.random() * keys.length)]];
        return {
            shape: block.shape,
            colour: block.colour, // Random colour
        };
    }

    // Draw the current board and piece
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the board
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawCell(x, y, this.board[y][x]);
                }
            }
        }

        // Draw preview
        this.drawPreview();

        // Draw current piece
        this.drawPiece();
    }

    drawPreview() {
        const landingY = this._calculateLandingY();

        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Semi-transparent border
        this.ctx.lineWidth = 2;

        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    const x = (this.currentX + dx) * this.cellSize;
                    const y = (landingY + dy) * this.cellSize;

                    // Draw a rounded border for the preview
                    this.ctx.beginPath();
                    this.ctx.moveTo(x + this.blockRadius, y);
                    this.ctx.lineTo(x + this.cellSize - this.blockRadius, y);
                    this.ctx.quadraticCurveTo(x + this.cellSize, y, x + this.cellSize, y + this.blockRadius);
                    this.ctx.lineTo(x + this.cellSize, y + this.cellSize - this.blockRadius);
                    this.ctx.quadraticCurveTo(
                        x + this.cellSize,
                        y + this.cellSize,
                        x + this.cellSize - this.blockRadius,
                        y + this.cellSize
                    );
                    this.ctx.lineTo(x + this.blockRadius, y + this.cellSize);
                    this.ctx.quadraticCurveTo(x, y + this.cellSize, x, y + this.cellSize - this.blockRadius);
                    this.ctx.lineTo(x, y + this.blockRadius);
                    this.ctx.quadraticCurveTo(x, y, x + this.blockRadius, y);
                    this.ctx.closePath();
                    this.ctx.stroke();
                }
            });
        });
    }

    _calculateLandingY() {
        let landingY = this.currentY;
        while (this.isValidMove(this.currentPiece.shape, 0, landingY - this.currentY + 1)) {
            landingY++;
        }
        return landingY;
    }

    drawCell(x, y, colour) {
        const size = this.cellSize - 1; // Slight padding
        const cx = x * this.cellSize;
        const cy = y * this.cellSize;

        this.ctx.fillStyle = colour;
        this.ctx.beginPath();
        this.ctx.moveTo(cx + this.blockRadius, cy);
        this.ctx.lineTo(cx + size - this.blockRadius, cy);
        this.ctx.quadraticCurveTo(cx + size, cy, cx + size, cy + this.blockRadius);
        this.ctx.lineTo(cx + size, cy + size - this.blockRadius);
        this.ctx.quadraticCurveTo(cx + size, cy + size, cx + size - this.blockRadius, cy + size);
        this.ctx.lineTo(cx + this.blockRadius, cy + size);
        this.ctx.quadraticCurveTo(cx, cy + size, cx, cy + size - this.blockRadius);
        this.ctx.lineTo(cx, cy + this.blockRadius);
        this.ctx.quadraticCurveTo(cx, cy, cx + this.blockRadius, cy);
        this.ctx.closePath();
        this.ctx.fill();
    }


    drawPiece() {
        this.ctx.fillStyle = this.currentPiece.colour;
        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.drawCell(this.currentX + dx, this.currentY + dy, this.currentPiece.colour);
                }
            });
        });
    }

    // Check collisions
    isValidMove(shape, offsetX, offsetY) {
        return shape.every((row, dy) =>
            row.every((value, dx) => {
                const x = this.currentX + dx + offsetX;
                const y = this.currentY + dy + offsetY;
                return (
                    value === 0 ||
                    (x >= 0 && x < this.cols && y < this.rows && !this.board[y]?.[x])
                );
            })
        );
    }

    // Merge current piece into the board
    placePiece() {
        this.currentPiece.shape.forEach((row, dy) => {
            row.forEach((value, dx) => {
                if (value) {
                    this.board[this.currentY + dy][this.currentX + dx] = this.currentPiece.colour;
                }
            });
        });
        this.processLineClears();
        this.spawnNextPiece();
    }

    processLineClears() {
        this.board.forEach((line, i) => { // Iterate all lines of the board
            if (!line.includes(0)) { // If the line is full
                const emptyLine = Array(this.cols).fill(0);

                this.board[i] = emptyLine;
                for (let j = i; j >= 0; j--) {
                    this.board[j] = this.board[j - 1];
                }

                this.board[0] = emptyLine;
            }
        });
    }

    spawnNextPiece() {
        this.currentPiece = this.queue.shift();
        this.queue.push(this.getRandomBlock());
        this.currentX = Math.floor(this.cols / 2) - 2;
        this.currentY = 0;

        this.resetGameLoop();

        if (!this.isValidMove(this.currentPiece.shape, 0, 0)) {
            alert("Game Over!");
            this.board = this.createEmptyBoard();
        }
    }

    handleInput(event) {
        switch (event.key) {
            case "ArrowLeft":
                if (this.isValidMove(this.currentPiece.shape, -1, 0)) this.currentX--;
                break;
            case "ArrowRight":
                if (this.isValidMove(this.currentPiece.shape, 1, 0)) this.currentX++;
                break;
            case "ArrowDown":
                if (this.isValidMove(this.currentPiece.shape, 0, 1)) this.currentY++;
                break;
            case "ArrowUp":
                this.rotatePiece(true); // Clockwise rotation
                break;
            case "z":
                this.rotatePiece(false); // Counterclockwise rotation
                break;
            case " ":
                this.hardDrop();
                break;
        }
        this.draw();
    }

    rotatePiece(clockwise = true) {
        const originalShape = this.currentPiece.shape;

        // Rotate the piece
        const rotated = clockwise
            ? this.currentPiece.shape[0].map((_, i) =>
                this.currentPiece.shape.map((row) => row[i]).reverse()
            )
            : this.currentPiece.shape[0].map((_, i) =>
                this.currentPiece.shape.map((row) => row[row.length - 1 - i]).reverse()
            );

        const kicks = [
            [0, 0],   // No offset
            [-1, 0],  // Left 1 cell
            [1, 0],   // Right 1 cell
            [0, -1],  // Up 1 cell
            [-1, -1], // Diagonal left-up
            [1, -1]   // Diagonal right-up
        ];

        for (const [xOffset, yOffset] of kicks) {
            if (this.isValidMove(rotated, xOffset, yOffset)) {
                this.currentPiece.shape = rotated;
                this.currentX += xOffset;
                this.currentY += yOffset;
                return true; // Successful rotation
            }
        }

        // If all kicks fail, reset to original
        this.currentPiece.shape = originalShape;
        return false;
    }

    // Wall kick offsets based on piece type and rotation state
    getWallKickOffsets() {
        // Simplified example offsets for demonstration
        return [
            [0, 0],  // No offset
            [-1, 0], // Left 1 cell
            [1, 0],  // Right 1 cell
            [0, -1], // Up 1 cell
            [-1, -1] // Diagonal left-up
        ];
    }

    hardDrop() {
        while (this.isValidMove(this.currentPiece.shape, 0, 1)) {
            this.currentY++;
        }
        this.placePiece();
    }

    // Main game loop
    gameLoop() {
        if (this.isRunning) return; // Prevent multiple loops
        this.isRunning = true;

        let loop = () => {
            let timeout = setTimeout(() => {
                if (this.isValidMove(this.currentPiece.shape, 0, 1)) {
                    this.currentY++;
                } else {
                    this.placePiece();
                    this.resetGameLoop(); // Reset loop only after placing
                    return; // Exit to prevent further execution
                }
                this.draw();
                loop(); // Continue game loop
            }, 500);

            this.gameLoopTimeouts.push(timeout);
        };

        loop();
    }

    // Restart gameLoop
    resetGameLoop() {
        this.gameLoopTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.gameLoopTimeouts = [];
        this.isRunning = false; // Reset running flag
        this.gameLoop();
    }
}