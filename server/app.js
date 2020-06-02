const express = require('express')
const app = express()
const { createWorker } = require('tesseract.js')
// const fileExample = require('./data')
const path = require('path')
const http = require('http')
const cors = require('cors')
const {parse} = require('mrz')
const multer = require('multer')
const fs = require('fs')
var router = express.Router()

let worker

try {
    worker = createWorker({
        langPath: path.join(__dirname, './', 'lang-data'),
        logger: m => console.log(m),
    })
} catch (e) {
    console.log(e)
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({storage: storage}).single('file')

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


app.use('/api', router.post('/parse', async (req, res) => {
    try {
        upload(req, res, async (err) => {
            await worker.load();
            await worker.loadLanguage('mrz');
            await worker.initialize('mrz');
            await worker.setParameters(TESSERACT_CONFIG);
            const { data } = await worker.recognize(`./uploads/${req.file.originalname}`)
            fs.unlink(`./uploads/${req.file.originalname}`, (err) => {
                if (err) {
                    console.error(err)
                    return
                  }
            })
            let lines = [];
            (data.lines || []).map(item => {
                if (!(item.length < 10)) {
                    lines.push(item)
                }
            })
            lines = lines.map(line => line.text)
                .map(text => text.replace(/ |\r\n|\r|\n/g, ""))
            console.log(lines)
            let text1 = lines[lines.length - 2]
            let text2 = lines[lines.length - 1]
            text1 = text1 + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
            text1 = text1.slice(0, 44)
            text2 = text2 + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
            text2 = text2.slice(0, 44)
            const result = lines ? parse([text1, text2]) : { valid: false };
            return res.json({ ...result, text1, text2 })
            // console.log(req.file)
        })
    } catch (e) {
        console.log(req.file.originalname, '  parse error')
        return res.json(null)
    }
}));


const server = http.createServer(app);

const PORT = 5000 || process.env.PORT

server.listen(PORT, () => console.log('Listening on port ' + PORT))