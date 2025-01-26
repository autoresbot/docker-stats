const si = require('systeminformation');

// Mendapatkan informasi tentang disk
si.diskLayout()
  .then(data => {
    console.log(data);
    data.forEach(disk => {
      console.log(`Disk: ${disk.device}`);
      console.log(`Size: ${disk.size / (1024 * 1024 * 1024)} GB`);  // Mengubah ukuran menjadi GB
      console.log(`Used: ${disk.used / (1024 * 1024 * 1024)} GB`);
      console.log(`Available: ${disk.available / (1024 * 1024 * 1024)} GB`);
      console.log(`Type: ${disk.type}`);
      console.log('---');
    });
  })
  .catch(error => console.error(error));
