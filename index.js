const { exec } = require('child_process');

exec('df -h', (err, stdout, stderr) => {
  if (err || stderr) {
    console.error(`Error: ${err || stderr}`);
    return;
  }

  // Parsing output df -h
  const lines = stdout.split('\n');
  lines.forEach(line => {
    // Cek perangkat yang terpasang pada root '/'
    if (line.includes('/dev/') && line.includes('/')) {
      const data = line.split(/\s+/);
      const storageInfo = {
        device: data[0],
        size: data[1],
        used: data[2],
        available: data[3],
        percentUsed: data[4]
      };
      console.log(storageInfo);
      return;  // Hentikan pencarian setelah menemukan perangkat root
    }
  });
});
