const { Jimp } = require('jimp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'Aldea-San-Antonio-With-Text.png');
const outputPath = path.join(__dirname, '..', 'public', 'Aldea-San-Antonio-White.png');

Jimp.read(inputPath)
  .then(image => {
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      const alpha = this.bitmap.data[idx + 3];

      // Any pixel that is not fully transparent, and is dark (representing the text)
      // The colored icon has R/G/B values where at least one of them is bright.
      // Dark grey text has r, g, b all low (< 120).
      if (alpha > 0 && red < 120 && green < 120 && blue < 120) {
        // Change text pixels to white, keeping the original alpha transparency for antialiasing
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
      }
    });

    return image.write(outputPath);
  })
  .then(() => {
    console.log('Logo converted successfully!');
  })
  .catch(err => {
    console.error('Error processing image:', err);
  });
