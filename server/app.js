const express = require('express')
const app = express()
const fs = require('fs')
const multer = require('multer')
const { createWorker } = require('tesseract.js')
const path = require('path')
const http = require('http')
const cors = require('cors')
const savePixels = require('save-pixels')
const getPixels = require('get-pixels')
const adaptiveThreshold = require('adaptive-threshold')

// const cv = require('opencv4nodejs')

// const image = new MarvinImage()
// const http = require('http')
var router = express.Router()

// const {Tesses} = require('tesseract.js')
let worker
try {
    worker = createWorker({
        langPath: path.join(__dirname, './', 'lang-data'),
        logger: m => console.log(m),
    })

} catch (e) {
    console.log('cang 5')
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})


const upload = multer({ storage: storage }).single('file')

app.set("view engine", "ejs")

app.get('/', (req, res) => {
    res.render('index')
})

const upload1 = multer({ storage });

app.use(upload1.single('file'))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())

const TESSERACT_CONFIG = {
    lang: "OCRB",
    load_system_dawg: "F",
    load_freq_dawg: "F",
    load_unambig_dawg: "F",
    load_punc_dawg: "F",
    load_number_dawg: "F",
    load_fixed_length_dawgs: "F",
    load_bigram_dawg: "F",
    wordrec_enable_assoc: "F",
    tessedit_pageseg_mode: "6",
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<"
};

const handle = (url, base64, callback) => {
    try {
        // console.log(base64.base64)
        getPixels(url, (err, pixels) => {
            try {
                if (err) {
                    console.log('cang 2')
                    console.error('err  ', err)
                    callback(null, base64)
                }
                // console.log(pixels)
                let data = ''
                var chunks = [];
                let thresholded = adaptiveThreshold(pixels, { compensation: 37, size: 100 })

                savePixels(thresholded, 'png', { quality: 90 }).pipe(fs.createWriteStream('test.png'))
                savePixels(thresholded, 'png', { quality: 90 }).on('data', function (chunk) {
                    chunks.push(chunk);
                })

                savePixels(thresholded, 'png', { quality: 90 }).on('end', async function () {
                    console.log('PreProcessing ok')
                    var result = Buffer.concat(chunks);
                    callback('data:image/png;base64, ' + result.toString("base64"), 'data:image/png;base64, ' + result.toString("base64"))
                });
            } catch (e) {
                // console.log('cang 3   ', base64)
                console.log(e)
                callback(null, base64)
            }
        })

    } catch (e) {
        console.log('cang 1')
        callback(null, base64)
    }
}

app.use('/api', router.post('/upload', async (req, res) => {
    const base64 = req.body.fileBase64 || null
    // console.log(req.body.fileBase64)
    try {
        upload(req, res, (err => {
            // console.log('req.data  ', req.fileBase64)
            handle(`./uploads/${req.file.originalname}`, base64, async (image, preprocessing) => {
                console.log('parrre  ', image)
                try {
                    await worker.load();
                    await worker.loadLanguage('test');
                    await worker.initialize('test');
                    await worker.setParameters(TESSERACT_CONFIG);
                    // console.log(image || base64 || `./uploads/${req.file.originalname}`)
                    const { data } = await worker.recognize(image || base64 || `./uploads/${req.file.originalname}`)
                    // await worker.terminate()
                    // console.log('req.body  ', req.body.name)
                    return res.json({ ...data, processedImage: preprocessing })
                } catch (e) {
                    console.log(e)
                    console.log(req.file.originalname, '  parse error')
                    return res.json(null)
                }

            })
        }))
    } catch (e) {
        console.log(e)
    }
}));


const server = http.createServer(app);

const PORT = 5000 || process.env.PORT

server.listen(PORT, () => console.log('Listening on port ' + PORT))