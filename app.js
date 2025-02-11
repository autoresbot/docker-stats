const WebSocket = require('ws');
const { exec } = require('child_process');
const os = require('os');
const wss = new WebSocket.Server({ port: 7000 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Fungsi untuk mendapatkan statistik Docker
    function getDockerStats(callback) {
        const command = `docker stats --no-stream --format "{{.Container}}\t{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | sed 's/%//' | sort -k3 -nr | head -n 20`

        exec(command, (err, stdout, stderr) => {
            if (err || stderr) {
                console.error('Docker stats error:', err || stderr);
                return callback(`Error: ${err || stderr}`);
            }
            callback(stdout);
        });
    }

    // Fungsi untuk mendapatkan informasi sistem
    function getSystemInfo(callback) {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
    
        exec('df -h', (err, stdout, stderr) => {
            if (err || stderr) {
                return callback(`Error: ${err || stderr}`);
            }
    
            // Parsing output df -h
            const lines = stdout.split('\n');
            let storageInfo = null; // Set default null jika tidak ada data
            for (let line of lines) {
                if (line.includes('/dev/')) {
                    const data = line.split(/\s+/);
                    storageInfo = {
                        device: data[0],
                        size: data[1],
                        used: data[2],
                        available: data[3],
                        percentUsed: data[4]
                    };
                    break;
                }
            }
    
            // Pastikan callback selalu terpanggil
            callback(null, {
                ram: {
                    total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                    free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB'
                },
                storage: storageInfo
            });
        });
    }
    

    // Fungsi untuk mengirim data ke client
    const sendStats = () => {
        getDockerStats((dockerData) => {
            const dockerStats = parseDockerStats(dockerData);

            getSystemInfo((err, systemInfo) => {
                if (err) {
                    console.error(err);
                    return;
                }

                const payload = {
                    type: 'stats',
                    docker_stats: dockerStats,
                    system_info: systemInfo
                };
                try {
                    console.log('Success send data');
                    ws.send(JSON.stringify(payload));
                } catch (sendError) {
                    console.error('Failed to send data:', sendError);
                }

            });
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
    console.log('data masuk di parseDockerStats()')
    console.log(data);
    console.log('------------------------')

    // 132d4e348af6  3e4fa375-f6ac-495a-9db0-769c8c8899a1    87.49   109.4MiB / 5.795GiB
    // 1b215fd38a43  f969b94e-0792-4741-9a82-b50501361d6f    10.61   2.56GiB / 5.795GiB
    // 6ff8c697210e  a53cd185-fffc-4c8f-bf07-fb141f7e5af6    0.01    93.48MiB / 5.795GiB
    
    const lines = data.split('\n'); // Header tetap disertakan
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
