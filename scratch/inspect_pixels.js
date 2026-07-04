const { Jimp } = require('jimp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'Aldea-San-Antonio.png');

Jimp.read(inputPath)
  .then(image => {
    const colors = {};
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];

      if (a > 50) {
        const key = `${r},${g},${b}`;
        colors[key] = (colors[key] || 0) + 1;
      }
    });

    // Print top 20 colors
    const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
    console.log('Top 30 colors (R,G,B: count):');
    console.log(sorted.slice(0, 30));
  })
  .catch(err => {
    console.error(err);
  });
