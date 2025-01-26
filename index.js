const { exec } = require('child_process');

exec('df -h', (err, stdout, stderr) => {
  if (err || stderr) {
    console.error(`Error: ${err || stderr}`);
    return;
  }

  // Parsing output df -h
  const lines = stdout.split('\n');
  let storageInfo = {};

  lines.forEach(line => {
    // Memeriksa jika perangkat mengandung '/dev/'
    if (line.includes('/dev/')) {
      const data = line.split(/\s+/);
      const device = data[0];
      const info = {
        size: data[1],
        used: data[2],
        available: data[3],
        percentUsed: data[4]
      };
      
      // Gabungkan data dalam storageInfo objek
      storageInfo[device] = info;
    }
  });

  console.log(storageInfo);
});
