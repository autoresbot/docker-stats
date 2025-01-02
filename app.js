const WebSocket = require('ws');
const { exec } = require('child_process');
const wss = new WebSocket.Server({ port: 7000 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Fungsi untuk mendapatkan statistik Docker
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

    // Kirimkan data ke client setiap 10 detik
    setInterval(() => {
        getDockerStats((data) => {
            const topStats = parseDockerStats(data);

            // Kirimkan data ke client
            ws.send(JSON.stringify({
                type: 'docker_stats',
                stats: topStats
            }));
        });
    }, 10000);

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Fungsi untuk mengurai data dan mendapatkan statistik berdasarkan CPU dan Memory
function parseDockerStats(data) {
    const lines = data.split('\n');
    const stats = {
        top_by_cpu: [],
        top_by_memory: []
    };

    let section = null;
    lines.forEach((line) => {
        if (line.includes("TOP BY MEMORY")) {
            section = "memory";
        }

        // Jika baris memiliki lebih dari 3 kolom, itu adalah data yang valid
        if (line.split(/\s+/).length > 3) {
            const columns = line.split(/\s+/);
            if (section === "memory") {
                stats.top_by_memory.push({
                    Container: columns[0],
                    Name: columns[1],
                    CPUPerc: columns[2],
                    MemUsage: columns[3]
                });
            } else {
                stats.top_by_cpu.push({
                    Container: columns[0],
                    Name: columns[1],
                    CPUPerc: columns[2],
                    MemUsage: columns[3]
                });
            }
        }
    });

    return stats;
}

console.log('WebSocket server running on ws://localhost:7000');
