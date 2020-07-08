const express = require('express')
const app = express()
const { createWorker, createScheduler } = require('tesseract.js')
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

const scheduler = createScheduler();

let worker1 = createWorker({
    langPath: path.join(__dirname, './', 'lang-data'),
    logger: m => console.log(m),
})

let worker2 = createWorker({
    langPath: path.join(__dirname, './', 'lang-data'),
    logger: m => console.log(m),
})

let worker3 = createWorker({
    langPath: path.join(__dirname, './', 'lang-data'),
    logger: m => console.log(m),
})

let worker4 = createWorker({
    langPath: path.join(__dirname, './', 'lang-data'),
    logger: m => console.log(m),
})

let worker5 = createWorker({
    langPath: path.join(__dirname, './', 'lang-data'),
    logger: m => console.log(m),
})

let worker6 = createWorker({
    langPath: path.join(__dirname, './', 'lang-data'),
    logger: m => console.log(m),
})

let worker7 = createWorker({
    langPath: path.join(__dirname, './', 'lang-data'),
    logger: m => console.log(m),
})



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

// Parse Mrz to Text
app.post('/api/parseMrz', upload.array('file'), async (req, response) => {
    try {
        const files = req.files
        const result = []
        await worker1.load();
        await worker1.loadLanguage('mrz');
        await worker1.initialize('mrz');
        await worker1.setParameters(TESSERACT_CONFIG);
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
        worker1.recognize(`./uploads/${files[0].originalname}`).then(res1 => {
            result.push(parseMrz(res1.data))
            if (files[1]) {
                worker1.recognize(`./uploads/${files[1].originalname}`).then(res2 => {
                    result.push(parseMrz(res2.data))
                    if (files[2]) {
                        worker1.recognize(`./uploads/${files[2].originalname}`).then(res3 => {
                            result.push(parseMrz(res3.data))
                            if (files[3]) {
                                worker1.recognize(`./uploads/${files[3].originalname}`).then(res4 => {
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

// Parse from full Passport Image to Text
app.post('/api/parsePassport', upload.array('file'), async (req, response) => {
    console.log('called')
    try {
        const files = req.files
        for (let i = 0; i < files.length; i++) {
            await detect(`./uploads/${files[i].originalname}`)
        }

        await worker1.load();
        await worker2.load();
        await worker3.load();
        await worker4.load();
        await worker5.load();
        await worker6.load();
        await worker7.load();

        await worker1.loadLanguage('mrz');
        await worker2.loadLanguage('mrz');
        await worker3.loadLanguage('mrz');
        await worker4.loadLanguage('mrz');
        await worker5.loadLanguage('mrz');
        await worker6.loadLanguage('mrz');
        await worker7.loadLanguage('mrz');

        await worker1.initialize('mrz');
        await worker2.initialize('mrz');
        await worker3.initialize('mrz');
        await worker4.initialize('mrz');
        await worker5.initialize('mrz');
        await worker6.initialize('mrz');
        await worker7.initialize('mrz');

        await worker1.setParameters(TESSERACT_CONFIG);
        await worker2.setParameters(TESSERACT_CONFIG);
        await worker3.setParameters(TESSERACT_CONFIG);
        await worker4.setParameters(TESSERACT_CONFIG);
        await worker5.setParameters(TESSERACT_CONFIG);
        await worker6.setParameters(TESSERACT_CONFIG);
        await worker7.setParameters(TESSERACT_CONFIG);

        scheduler.addWorker(worker1);
        scheduler.addWorker(worker2);
        scheduler.addWorker(worker3);
        scheduler.addWorker(worker4);
        scheduler.addWorker(worker5);
        scheduler.addWorker(worker6);
        scheduler.addWorker(worker7);

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
            greyscaleImage(`./uploads/out/crop/${files[0].originalname}`, 1, async (results) => {
                const resultss = await Promise.all(results.map((item) => (
                    scheduler.addJob('recognize', item)
                  )))
                let tempData = []
                resultss.map(item => tempData.push(item.data))
                console.log(tempData)
                handleRequest(tempData.map((item, index) => ({...parseMrz(item), preprocessingImage: results[index]})))
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