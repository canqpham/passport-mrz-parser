const express = require('express')
const app = express()
const fs = require('fs')
const multer = require('multer')
const { createWorker } = require('tesseract.js')
// const fileExample = require('./data')
const path = require('path')
const http = require('http')
const cors = require('cors')
const savePixels = require('save-pixels')
const getPixels = require('get-pixels')
const adaptiveThreshold = require('adaptive-threshold')
const { parse } = require('mrz')
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

const handle = (url, callback) => {
    try {
        getPixels(url, (err, pixels) => {
            try {
                if (err) {
                    console.log('cang 2')
                    console.error('err  ', err)
                    callback(null)
                }
                // console.log(pixels)
                let data = ''
                var chunks = [];
                let thresholded = adaptiveThreshold(pixels, { compensation: 37, size: 100 })

                // savePixels(thresholded, 'png', { quality: 100 }).pipe(fs.createWriteStream('test.png'))
                savePixels(thresholded, 'png', { quality: 100 }).on('data', function (chunk) {
                    chunks.push(chunk);
                })

                savePixels(thresholded, 'png', { quality: 100 }).on('end', async function () {
                    console.log('PreProcessing ok')
                    var result = Buffer.concat(chunks);
                    callback('data:image/png;base64, ' + result.toString("base64"), 'data:image/png;base64, ' + result.toString("base64"))
                });
            } catch (e) {
                // console.log('cang 3   ', base64)
                console.log(e)
                callback(null)
            }
        })

    } catch (e) {
        console.log('cang 1')
        callback(null)
    }
}

app.use('/api', router.post('/upload', async (req, res) => {
    const base64 = req.body.fileBase64 || null
    console.log('cang')
    try {
        upload(req, res, (err => {
            // console.log('req.data  ', req.fileBase64)
            handle(`./uploads/${req.file.originalname}`, async (image) => {
                try {
                    fs.unlinkSync(`./uploads/${req.file.originalname}`)
                    //file removed
                    return res.json({ processedImage: image })
                } catch (err) {
                    console.error(err)
                }

            })
        }))
    } catch (e) {
        console.log(e)
    }
}));
app.use('/api', router.post('/parse', async (req, res) => {
    const base64 = req.body.base64 || null
    console.log(base64)
    try {
        await worker.load();
        await worker.loadLanguage('test');
        await worker.initialize('test');
        await worker.setParameters(TESSERACT_CONFIG);
        // console.log(image || base64 || `./uploads/${req.file.originalname}`)
        const { data } = await worker.recognize(base64)
        // await worker.terminate()
        // console.log('req.body  ', req.body.name)
        return res.json({ ...data })
    } catch (e) {
        console.log(req.file.originalname, '  parse error')
        return res.json(null)
    }
}));


const server = http.createServer(app);

const PORT = 5000 || process.env.PORT

server.listen(PORT, () => console.log('Listening on port ' + PORT))