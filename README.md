# QuickDrop LAN

QuickDrop LAN is a lightweight, real-time text-sharing application designed for local network use. It allows users to share text and code snippets instantly over a LAN, with syntax highlighting for code and a clean, modern interface. Built with Node.js, Express, and Socket.IO, it provides a seamless experience for quick communication.

## Features

- **Real-time Text Sharing**: Send and receive text or code instantly within a local network.
- **Syntax Highlighting**: Automatically detects and highlights code snippets using Highlight.js.
- **Copy to Clipboard**: Easily copy shared text or code with a single click.
- **Responsive Design**: Clean, modern UI with a dark theme, optimized for all devices.
- **Timestamped Messages**: Each message includes a timestamp for context.
- **LAN-Based**: No internet required; works entirely within your local network.

## Directory Structure

```
QuickDrop-LAN/
├── public/
│   ├── index.html  # Main HTML file
│   ├── script.js   # Client-side JavaScript
│   └── style.css   # CSS styles
├── server.js       # Node.js server with Socket.IO
├── package.json    # Node.js dependencies and scripts
└── README.md       # Project documentation
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/winzepz/QuickDrop-LAN.git
   cd QuickDrop-LAN
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Server**:
   ```bash
   node server.js
   ```

4. **Access the Application**:
   Open a browser and navigate to `http://localhost:3000`. If running on a different machine in the LAN, replace `localhost` with the server's local IP address (e.g., `http://192.168.1.100:3000`).

## Usage

1. **Open the Web Interface**: Access the app in your browser.
2. **Enter Text or Code**: Type or paste your text/code into the textarea.
3. **Send**: Click the "Send" button or press `Enter` to share the content.
4. **View Messages**: Shared text or code appears in the message area with syntax highlighting (if code is detected).
5. **Copy Content**: Click the "Copy" button next to any message to copy its content to your clipboard.

## Technologies Used

- **Backend**:
  - Node.js
  - Express.js
  - Socket.IO
- **Frontend**:
  - HTML/CSS/JavaScript
  - Highlight.js (for syntax highlighting)
- **Styling**:
  - Custom CSS with a GitHub-inspired dark theme

## Development

To modify or extend the project:

1. **Frontend**:
   - Edit `/public/index.html` for HTML structure.
   - Update `/public/script.js` for client-side logic.
   - Modify `/public/style.css` for styling.

2. **Backend**:
   - Update `server.js` for server-side logic or additional Socket.IO events.

3. **Run in Development**:
   ```bash
   node server.js
   ```

## Troubleshooting

- **Server Not Starting**:
  - Ensure Node.js and npm are installed.
  - Verify that port `3000` is not in use (`lsof -i :3000` on Linux/Mac).
  - Check for missing dependencies (`npm install`).

- **Clients Can't Connect**:
  - Ensure all devices are on the same LAN.
  - Use the correct IP address of the server machine.
  - Check firewall settings to allow traffic on port `3000`.

- **Syntax Highlighting Issues**:
  - Ensure Highlight.js scripts are loaded correctly in `index.html`.
  - Verify the code pattern regex in `script.js` matches your use case.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Make your changes and commit (`git commit -m "Add your feature"`).
4. Push to your branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Socket.IO](https://socket.io/) for real-time communication.
- [Highlight.js](https://highlightjs.org/) for syntax highlighting.
- [Express.js](https://expressjs.com/) for the server framework.

---

# QuickShare Local

A real-time file sharing and chat application that works over LAN and internet.

## Features

- Real-time messaging
- File sharing
- Voice messages
- User profiles
- Message encryption
- Message pinning
- Message threading
- Read status
- Dark/Light theme

## Deployment on Render

1. Fork this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `PORT`: 3001 (or your preferred port)

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3001 in your browser

## Environment Variables

- `PORT`: The port number the server will listen on (default: 3001)

## Dependencies

- Node.js >= 14.0.0
- Express
- Socket.IO

## License

MIT
