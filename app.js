const WebSocket = require('ws');
const { exec } = require('child_process');
const wss = new WebSocket.Server({ port: 7000 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Fungsi untuk mendapatkan statistik Docker
    function getDockerStats(callback) {
        const command = `
            docker stats --no-stream --format "table {{.Container}}\\t{{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}" |
            (head -n 1; sort -k3 -nr | head -n 20)
        `;
        exec(command, (err, stdout, stderr) => {
            if (err || stderr) {
                return callback(`Error: ${err || stderr}`);
            }
            callback(stdout);
        });
    }

    // Fungsi untuk mengirim data Docker stats ke client
    const sendStats = () => {
        getDockerStats((data) => {
            const stats = parseDockerStats(data);

            // Kirimkan data ke client
            ws.send(JSON.stringify({
                type: 'docker_stats',
                stats: stats
            }));
        });
    };

    // Kirimkan data setiap 10 detik
    const interval = setInterval(sendStats, 10000);

    // Kirim data pertama kali segera setelah client terhubung
    sendStats();

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval); // Hentikan interval saat client terputus
    });
});

// Fungsi untuk mengurai data dan mendapatkan statistik dalam satu daftar
function parseDockerStats(data) {
    const lines = data.split('\n').slice(1); // Hapus header
    const stats = [];

    lines.forEach((line) => {
        const columns = line.split(/\s+/);
        if (columns.length >= 4) { // Pastikan data valid
            stats.push({
                Container: columns[0],
                Name: columns[1],
                CPUPerc: columns[2],
                MemUsage: columns[3]
            });
        }
    });

    return stats;
}

console.log('WebSocket server running on ws://localhost:7000');
