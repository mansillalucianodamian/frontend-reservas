const { Jimp } = require('jimp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'Aldea-San-Antonio-With-Text.png');

Jimp.read(inputPath)
  .then(image => {
    let darkCount = 0;
    let totalOpaque = 0;
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      const a = this.bitmap.data[idx + 3];

      if (a > 20) {
        totalOpaque++;
        if (r < 150 && g < 150 && b < 150) {
          darkCount++;
        }
      }
    });

    console.log(`Image dimensions: ${image.bitmap.width}x${image.bitmap.height}`);
    console.log(`Total non-transparent pixels: ${totalOpaque}`);
    console.log(`Dark pixels (R/G/B < 150): ${darkCount}`);
  })
  .catch(err => {
    console.error(err);
  });
