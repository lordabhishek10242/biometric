const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

class PythonBridge {
    constructor() {
        this.pythonProcess = null;
        this.rl = null;
        this.pendingRequests = new Map();
        this.requestIdCounter = 0;
        this.isReady = false;
    }

    start() {
        const bridgePath = path.join(__dirname, 'service_bridge.py');
        // Using absolute path to Anaconda python where dependencies are installed
        this.pythonProcess = spawn('/opt/anaconda3/bin/python3', [bridgePath]);

        this.rl = readline.createInterface({
            input: this.pythonProcess.stdout,
            terminal: false
        });

        this.rl.on('line', (line) => {
            try {
                const response = JSON.parse(line);
                // We use a simple FIFO queue for now as the bridge is single-threaded stdin/stdout
                const resolve = this.pendingRequests.shift();
                if (resolve) {
                    resolve(response);
                }
            } catch (err) {
                console.error('Failed to parse Python bridge output:', line, err);
            }
        });

        this.pythonProcess.stderr.on('data', (data) => {
            const output = data.toString();
            // Filter out system logs/warnings from MediaPipe/TFLite
            if (output.includes('INFO:') || output.includes('I0000') || output.includes('W0000') || output.includes('E0000')) {
                // Log as info/debug rather than error to avoid alarming the user
                console.log(`Python Bridge (System): ${output.trim()}`);
            } else {
                console.error(`Python Bridge Error: ${output.trim()}`);
            }
        });

        this.pythonProcess.on('close', (code) => {
            console.log(`Python Bridge process closed with code ${code}`);
            this.isReady = false;
        });

        // Simple hack to handle the queue
        this.pendingRequests = [];
        this.isReady = true;
        console.log('Python Bridge started');
    }

    sendCommand(command, params = {}) {
        return new Promise((resolve) => {
            if (!this.isReady) {
                return resolve({ status: 'ERROR', message: 'Bridge not started' });
            }
            this.pendingRequests.push(resolve);
            this.pythonProcess.stdin.write(JSON.stringify({ command, params }) + '\n');
        });
    }

    stop() {
        if (this.pythonProcess) {
            this.pythonProcess.kill();
        }
    }
}

// Singleton instance
const bridge = new PythonBridge();
bridge.start();

module.exports = bridge;
