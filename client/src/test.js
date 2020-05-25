const path = require('path');
const fs = require('fs')

const savePixels = require('save-pixels')
const getPixels = require('get-pixels')
const adaptiveThreshold = require('adaptive-threshold')

getPixels(path.join(__dirname, '..', 'images', '7.png'), (err, pixels) => {
    if (err) {
        console.error(err)
        return
    }
    console.log(pixels)
    // callback(pixels)
    let thresholded = adaptiveThreshold(pixels, {compensation: 37, size: 100})
    savePixels(thresholded, 'png', {quality: 90}).pipe(fs.createWriteStream(path.join(__dirname, '..', 'images', 'dist.png')))
})

// const TESSERACT_CONFIG = {
//     lang: "OCRB",
//     load_system_dawg: "F",
//     load_freq_dawg: "F",
//     load_unambig_dawg: "F",
//     load_punc_dawg: "F",
//     load_number_dawg: "F",
//     load_fixed_length_dawgs: "F",
//     load_bigram_dawg: "F",
//     wordrec_enable_assoc: "F",
//     tessedit_pageseg_mode: "6",
//     tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<"
//   };


// (async () => {
//     console.log('111')
//     await worker.load();
//     await worker.loadLanguage('tha');
//     await worker.initialize('tha');
//     await worker.setParameters(TESSERACT_CONFIG);
//     const { data: { text } } = await worker.recognize('');
//     console.log(text);
//     await worker.terminate();
//   })();

// async function main () {
//     await worker.load();
//     await worker.loadLanguage('test');
//     await worker.initialize('test');
//     const { data: { text } } = await worker.recognize(path.join(__dirname, '..', 'images', '2.png'));
//     console.log(text);
//     await worker.terminate();
// }

// main()
// const contddd = path.join(__dirname, '..', 'images', '2.png')
// const parsePassport = async (url) => {
//     console.log('passrt')
//     await worker.load();
//     await worker.loadLanguage('eng');
//     await worker.initialize('eng');
//     const { data: { text }, data } = await worker.recognize(path.join(__dirname, '..', 'images', '1.png'));
//     console.log(text);
//     await worker.terminate();
//     // return data
// }

// parsePassport(path.join(__dirname, '..', 'images', '2.png'))

// export default parsePassport
