class ChessBoardController {
  constructor() {
    // Find the main board element
    this.board = document.querySelector('#board-layout-chessboard');
    if (!this.board) {
      console.error('Chessboard container not found!');
      throw new Error('Chessboard container not found!');
    }
    
    // Find the actual chess board component
    this.chessBoard = this.board.querySelector('wc-chess-board');
    if (!this.chessBoard) {
      console.error('Chess board component not found!');
      throw new Error('Chess board component not found!');
    }
  }

  getSquare(notation) {
    // Convert chess notation (e.g., 'e4') to square number
    const file = notation.charAt(0).toLowerCase();
    const rank = parseInt(notation.charAt(1));
    
    // Calculate square number (1-64)
    const fileNumber = file.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
    const squareNumber = (8 - rank) * 8 + fileNumber;
    
    // Find square using the calculated number
    return this.chessBoard.querySelector(`.square-${squareNumber}`);
  }

  clickSquare(square) {
    if (!square) {
      console.error('Square not found!');
      return false;
    }

    try {
      // Create and dispatch mousedown event
      const clickEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      square.dispatchEvent(clickEvent);

      // Actual click
      square.click();
      return true;
    } catch (error) {
      console.error('Error clicking square:', error);
      return false;
    }
  }
}

class VoiceController {
  constructor(options = {}) {
    this.options = {
      activationKey: 'v',
      language: 'en-US',
      ...options
    };

    this.initializeSpeechRecognition();
    if (this.recognition) {
      this.boardController = new ChessBoardController();
      this.setupRecognition();
      this.setupKeyboardShortcut();
      this.addStatusIndicator();
      this.numberWords = this.initializeNumberWords();
    }
  }

  initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showError('Speech recognition is not supported in your browser.');
      return;
    }
    this.recognition = new SpeechRecognition();
  }

  initializeNumberWords() {
    return {
      'one': '1', '1': '1', 'first': '1',
      'two': '2', '2': '2', 'second': '2',
      'three': '3', '3': '3', 'third': '3',
      'four': '4', '4': '4', 'fourth': '4',
      'five': '5', '5': '5', 'fifth': '5',
      'six': '6', '6': '6', 'sixth': '6',
      'seven': '7', '7': '7', 'seventh': '7',
      'eight': '8', '8': '8', 'eighth': '8'
    };
  }

  setupRecognition() {
    this.recognition.continuous = false;
    this.recognition.lang = this.options.language;

    this.recognition.onstart = () => {
      this.showStatus('Listening...', 'listening');
    };

    this.recognition.onend = () => {
      this.hideStatus();
      this.recognition.isStarted = false;
    };

    this.recognition.onerror = (event) => {
      this.showError(`Error: ${event.error}`);
      this.recognition.isStarted = false;
    };

    this.recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      this.processCommand(command);
    };
  }

  processCommand(command) {
    this.showStatus(`Heard: ${command}`, 'processing');
    
    if (command.includes('cancel') || command.includes('stop')) {
      this.hideStatus();
      return;
    }

    const square = this.parseSquare(command);
    if (square) {
      this.showStatus(`Moving to: ${square}`, 'success');
      const squareElement = this.boardController.getSquare(square);
      if (squareElement && this.boardController.clickSquare(squareElement)) {
        setTimeout(() => this.hideStatus(), 1000);
      } else {
        this.showError(`Could not find square ${square}`);
      }
    } else {
      this.showError('Invalid command. Try saying a square like "e4" or "e four"');
    }
  }

  parseSquare(command) {
    command = command.replace(/\s+/g, ' ')
                    .replace(/please|move|to|square|the/g, '')
                    .trim();

    const file = command.match(/[a-h]/i);
    const rank = command.match(/\d|one|two|three|four|five|six|seven|eight|first|second|third|fourth|fifth|sixth|seventh|eighth/i);

    if (file && rank) {
      const fileStr = file[0].toLowerCase();
      const rankStr = this.numberWords[rank[0].toLowerCase()];
      return fileStr + rankStr;
    }

    // Fall back to direct coordinate matching
    const direct = command.match(/[a-h][1-8]/i);
    return direct ? direct[0].toLowerCase() : null;
  }

  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === this.options.activationKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        this.startListening();
      }
    });
  }

  addStatusIndicator() {
    this.statusElement = document.createElement('div');
    this.statusElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 5px;
      z-index: 9999;
      display: none;
      font-family: Arial, sans-serif;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(this.statusElement);
  }

  showStatus(message, type = 'info') {
    const colors = {
      info: '#2196F3',
      listening: '#4CAF50',
      processing: '#FFC107',
      success: '#4CAF50',
      error: '#F44336'
    };

    this.statusElement.style.background = colors[type];
    this.statusElement.textContent = message;
    this.statusElement.style.display = 'block';
  }

  showError(message) {
    this.showStatus(message, 'error');
    setTimeout(() => this.hideStatus(), 3000);
  }

  hideStatus() {
    this.statusElement.style.display = 'none';
  }

  startListening() {
    if (!this.recognition) {
      this.showError('Speech recognition is not supported');
      return;
    }

    if (this.recognition.isStarted) {
      console.warn('Already listening!');
      return;
    }

    try {
      this.recognition.start();
      this.recognition.isStarted = true;
    } catch (error) {
      this.showError('Failed to start speech recognition');
      console.error('Speech recognition error:', error);
    }
  }
}

// Initialize the voice controller
const voiceController = new VoiceController({
  activationKey: 'v',
  language: 'en-US'
});