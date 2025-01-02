const WebSocket = require('ws');
const { exec } = require('child_process');
const os = require('os');
const PORT = 7000;

// Fungsi untuk mendapatkan IP lokal
function getIp() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
}

const localIp = getIp() || 'localhost';

function getDockerStats(callback) {
    const command = `
    docker stats --no-stream --format "table {{.Container}}\\t{{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}" | 
    (head -n 1; sort -k3 -nr | head -n 10; echo ""; echo "TOP BY MEMORY:"; sort -k4 -hr | head -n 10)
    `;
    exec(command, (err, stdout, stderr) => {
        if (err || stderr) {
            return callback(`Error: ${err || stderr}`);
        }
        callback(stdout);
    });
}

function parseDockerStats(data) {
    const sections = data.trim().split('\n\n');
    const lines = sections[0].split('\n');
    const headers = lines[0].split('\t');
    const containers = lines.slice(1).map((line) => {
        const values = line.split('\t');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    });

    return {
        type: 'docker_stats',
        timestamp: new Date().toISOString(),
        top_by_cpu: containers.slice(0, 10),
        top_by_memory: sections[1]
            ?.split('\n')
            .slice(1)
            .map((line) => {
                const values = line.split('\t');
                return headers.reduce((obj, header, index) => {
                    obj[header] = values[index];
                    return obj;
                }, {});
            }),
    };
}

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
    console.log('Client connected');

    const sendStats = () => {
        getDockerStats((data) => {
            const parsedData = parseDockerStats(data);
            ws.send(JSON.stringify(parsedData));
        });
    };

    sendStats();

    const interval = setInterval(sendStats, 10000);

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});

console.log(`WebSocket server running on ws://${localIp}:${PORT}`);
