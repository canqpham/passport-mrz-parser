const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { document } = (new JSDOM(`<!DOCTYPE html><p>Hello world</p>`)).window;
const Canvas = require('canvas')

function createImageData(width, height) {
    var canvas = document.createElement('canvas');
    return canvas.getContext('2d').createImageData(width, height);
}


function buildIntegral_Gray(sourceImageData) {
    var sourceData = sourceImageData.data;
    var width = sourceImageData.width;
    var height = sourceImageData.height;
    // should it be Int64 Array ??
    // Sure for big images 
    var integral = new Int32Array(width * height)
    // ... for loop
    var x = 0,
        y = 0,
        lineIndex = 0,
        sum = 0;
    for (x = 0; x < width; x++) {
        sum += sourceData[x << 2];
        integral[x] = sum;
    }

    for (y = 1, lineIndex = width; y < height; y++, lineIndex += width) {
        sum = 0;
        for (x = 0; x < width; x++) {
            sum += sourceData[(lineIndex + x) << 2];
            integral[lineIndex + x] = integral[lineIndex - width + x] + sum;
        }
    }
    return integral;
}

function getIntegralAt(integral, width, x1, y1, x2, y2) {
    var result = integral[x2 + y2 * width];
    if (y1 > 0) {
        result -= integral[x2 + (y1 - 1) * width];

        if (x1 > 0) {
            result += integral[(x1 - 1) + (y1 - 1) * width];
        }
    }
    if (x1 > 0) {
        result -= integral[(x1 - 1) + (y2) * width];
    }
    return result;
}


function computeAdaptiveThreshold(sourceImageData, ratio, callback) {
    var integral = buildIntegral_Gray(sourceImageData);
    var width = sourceImageData.width;
    var height = sourceImageData.height;
    var s = width >> 4; // in fact it's s/2, but since we never use s...

    var sourceData = sourceImageData.data;
    var result = createImageData(width, height);
    var resultData = result.data;
    var resultData32 = new Uint32Array(resultData.buffer);

    var x = 0,
        y = 0,
        lineIndex = 0;

    for (y = 0; y < height; y++, lineIndex += width) {
        for (x = 0; x < width; x++) {

            var value = sourceData[(lineIndex + x) << 2];
            var x1 = Math.max(x - s, 0);
            var y1 = Math.max(y - s, 0);
            var x2 = Math.min(x + s, width - 1);
            var y2 = Math.min(y + s, height - 1);
            var area = (x2 - x1 + 1) * (y2 - y1 + 1);
            var localIntegral = getIntegralAt(integral, width, x1, y1, x2, y2);
            if (y === x) {
            }
            if (value * area > localIntegral * ratio) {
                resultData32[lineIndex + x] = 0xFFFFFFFF;
            } else {
                resultData32[lineIndex + x] = 0xFF000000;
            }
        }
    }
    callback(result);
}

function greyscaleImage(url, ratio, callback) {
    var img = new Canvas.Image()
    img.onload = function () {
      var canvas = document.createElement('CANVAS')
      let ctx = canvas.getContext('2d')
      let dataURL
      canvas.height = img.height
      canvas.width = img.width
  
      ctx.drawImage(img, 0, 0, img.width, img.height);
  
      var imgPixels = ctx.getImageData(0, 0, img.width, img.height);
  
      function getAvg(grades) {
        const total = grades.reduce((acc, c) => acc + c, 0);
        return total / grades.length;
      }
      let avgBrightness = getAvg(imgPixels.data)
      let avgT = avgBrightness > 186 ? 0.80 : 0.73
      let arrayT = avgBrightness > 185 ? [0.6, 0.7, 0.8] : [0.4, 0.6, 0.7]
      if(avgBrightness > 210) {
        avgT = 0.85
      } 
      if(avgBrightness < 160) {
        avgT = 0.68
      }
      /**
       * Test
       */
      let results = [];
      [0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.85].map((item, index) => {
        computeAdaptiveThreshold(imgPixels, item, (result) => {
          // imgPixels.data = result
          ctx.putImageData(result, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
          // ctx.drawImage(img, 0, 0)
          const tee = canvas.toDataURL('image/jpeg')
          // const file = dataURLtoFile(tee, `${Math.random()}.jpg`)
          // if(imgPixels.width < 720) {
          //   resize(file, 1080, 1080, (res) => {
          //     results.push(res)
          //   })
          // } else {
          // }
          results.push(tee)
  
          // canvas = null
        })
      })
      if(results.length) {
        callback(results, avgBrightness, avgT)
      }
      
    }
    img.crossOrigin = 'Anonymous' //Use-Credentials
    img.src = url
    // // check if //ariadirect.com or http://ariadirect.com is a different origin
    // if (/^([\w]+\:)?\/\//.test(url) && url.indexOf(location.host) === -1) {
    //   img.crossOrigin = "anonymous"; // or "use-credentials"
    // }
  
  }

module.exports = greyscaleImage