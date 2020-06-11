const express = require('express')
const app = express()
const { createWorker } = require('tesseract.js')
// const fileExample = require('./data')
const path = require('path')
const http = require('http')
const cors = require('cors')
const { parse } = require('mrz')
const multer = require('multer')
const fs = require('fs')
const { sum, compact } = require('lodash')
const detect = require('./src/detect')
var rimraf = require("rimraf");
const greyscaleImage = require('./src/helper')

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

const upload = multer({ storage: storage })

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

const parseMrz = (data) => {
    let lines = [];
    console.log(data.lines)
    if (!data) return {}
        (data.lines || []).map(item => {
            if (!(item.text.length < 10)) {
                lines.push(item)
            }
        })
    lines = data.lines.map(line => line.text.length > 30 && line.text)
        .map(text => text && text.replace(/ |\r\n|\r|\n/g, ""))
    console.log(lines)
    lines = compact(lines)
    let text1 = lines[lines.length - 2]
    let text2 = lines[lines.length - 1]
    text1 = text1 + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
    text1 = text1.slice(0, 44)
    text1.indexOf('F') == 0 ? text1 = text1.replace('F', 'P') : text1;
    text2 = text2 + '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
    text2 = text2.slice(0, 44)
    const result = lines ? parse([text1, text2]) : { valid: false };
    return { ...result, text1, text2 }
}

app.post('/api/parseMrz', upload.array('file'), async (req, response) => {
    try {
        const files = req.files
        const result = []
        await worker.load();
        await worker.loadLanguage('mrz');
        await worker.initialize('mrz');
        await worker.setParameters(TESSERACT_CONFIG);
        const handleRequest = () => {
            let bestData = {}
            let bestCount = 0
            result.map(item => {
                const count = sum(item.details.map(it => it.value && 1))
                console.log(count)
                if (count > bestCount) {
                    bestCount = count
                    bestData = item
                }
            })
            console.log('Files Count: ', files.length)
            response.json(bestData)
        }
        worker.recognize(`./uploads/${files[0].originalname}`).then(res1 => {
            result.push(parseMrz(res1.data))
            if (files[1]) {
                worker.recognize(`./uploads/${files[1].originalname}`).then(res2 => {
                    result.push(parseMrz(res2.data))
                    if (files[2]) {
                        worker.recognize(`./uploads/${files[2].originalname}`).then(res3 => {
                            result.push(parseMrz(res3.data))
                            if (files[3]) {
                                worker.recognize(`./uploads/${files[3].originalname}`).then(res4 => {
                                    console.log(res4.data.lines[0].text)
                                    console.log(res4.data.lines[1].text)
                                    result.push(parseMrz(res4.data))
                                    handleRequest()
                                })
                            } else {
                                handleRequest()
                            }
                        })
                    } else {
                        handleRequest()
                    }
                })

            } else {
                handleRequest()
            }
        })
    } catch (e) {
        console.log(e)
        response.json(null)
    }
    if (!req.files) {
        console.log('Cannot get file')
    }
})

app.post('/api/parsePassport', upload.array('file'), async (req, response) => {
    console.log('called')
    try {
        const files = req.files
        let result = []
        // cons
        for (let i = 0; i < files.length; i++) {
            await detect(`./uploads/${files[i].originalname}`)
        }
        const handleRequest = (results) => {
            let bestData = {}
            let bestCount = 0
            results.map(item => {
                const count = sum(item.details.map(it => it.value ? 1 : 0))
                console.log('count   ', count)
                if (count > bestCount) {
                    bestCount = count
                    bestData = item
                }
            })
            console.log('Files Count: ', results.length)
            console.log('bestCount   ', bestCount)
            response.json(bestData)
            rimraf('./uploads', () => {
                fs.mkdirSync('./uploads');
                console.log("done");
            })
        }
        if (fs.existsSync(`./uploads/out/crop/${files[0].originalname}`)) {
            await worker.load();
            await worker.loadLanguage('mrz');
            await worker.initialize('mrz');
            await worker.setParameters(TESSERACT_CONFIG);
            greyscaleImage(`./uploads/out/crop/${files[0].originalname}`, 1, async (results) => {
                for (let i = 0; i < results.length; i++) {
                    const { data } = await worker.recognize(results[i])
                    result.push({ ...parseMrz(data), preprocessingImage: results[i] })
                    const count = sum((data.details || []).map(it => it.value && 1))
                    if (count === 15) {
                        break;
                    }
                }
                handleRequest(result)
            })
        }
    } catch (e) {
        console.log(e)
        response.json(null)
    }
    if (!req.files) {
        console.log('Cannot get file')
    }
})



const server = http.createServer(app);

const PORT = 5001 || process.env.PORT

server.listen(PORT, () => console.log('Listening on port ' + PORT))