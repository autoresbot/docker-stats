const { exec } = require('child_process');

exec('df -h', (err, stdout, stderr) => {
  if (err || stderr) {
    console.error(`Error: ${err || stderr}`);
    return;
  }

  // Parsing output df -h
  const lines = stdout.split('\n');

  let storageInfo;
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
      return; // Hentikan setelah mendapatkan data pertama
    }
  }
});
