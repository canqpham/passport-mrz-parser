import React, { useEffect, useState } from 'react';
import './App.css';
import { Input, Button, Modal } from 'antd'
import ImageEditor from './ImageEditor'
import MrzEditor from './MrzEditor'
import { parse } from 'mrz'
import createFetch from './fetch'
import {dataURLtoFile} from './helpers'
import {get} from 'lodash'

function App() {
  const [ocr, setOcr] = useState(null);
  const [text1, setText1] = useState(null);
  const [text2, setText2] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  const [preProcessingImage, setPreProcessingImage] = useState(null);

  // const worker = createWorker({
  //   langPath: path.join(__dirname, '..', 'lang-data'),
  //   // gzip: false,
  //   logger: m => console.log(m),
  // });

  let contentArea = "";
  const [preProcessingFile, setPreProcessingFile] = useState(null)
  const [initialFile, setInitialFile] = useState(null)
  const [openModal, setOpenModal] = useState(false)

  const openCropMrzModal = (url) => {
    if(url) {
      const file = dataURLtoFile(url)
      setPreProcessingFile(file)
      setOpenModal(true)
    }
  }

  const uploadPassport = async (url, base64, file, rawFile) => {
    try {
      console.log(url)
      console.log(file)
      console.log(base64)

      setInitialFile(file)
      let body = new FormData();
      body.append('file', file);
      // body.append('fileBase64', base64);


      const res = await createFetch().post('http://localhost:5000/api/upload', body)
      // const { data } = await parsePassport(file)
      console.log(res)
      if(!res.data) {
        alert('Cannot parse ....')
      }
      openCropMrzModal(((res.data || {}).processedImage))
      
      
    } catch (e) {
      console.log(e)
    }
  };

  const check = (const1, const2) => {
    const lines = contentArea.split("\n");
    // console.log(lines);
    try {
      const result = lines ? parse([text1, text2]) : { valid: false };
      console.log(result)
      setResult(result);
      setError(false)
    } catch (e) {
      console.log(e.message)
      setError(true)
    }
  };

  // useEffect(() => {
  //   doOCR();
  // });

  const [preview, setPreview] = useState(null)
  const [fileTest, setFile] = useState(null)

  const test = (url, base64, files, rawFile) => {
    setOcr('Recognizing...')
    setPreview(base64[0])
    setPreProcessingImage(null)
    setFile(files)
    console.log(files)
    // parseMrz(url, base64, file)
    // uploadPassport(url, base64, file, rawFile)
  }

  const parseMrz = async (url, base64, file, rawFile) => {
    console.log(fileTest)
    // setPreview(base64)
    let body = new FormData();
    
    body.append('file', fileTest[0]);
    body.append('file', fileTest[1]);
    body.append('file', fileTest[2]);
    body.append('file', fileTest[3]);

    // const res = await createFetch().post('http://localhost:5000/api/parse', body)
    const res = await createFetch().post('http://localhost:5000/api/parse', body)
    if(res.data) setOpenModal(false)
    console.log(res.data)
    setResult(res.data)
    setText1(get(res, 'data.text1'))
    setText2(get(res, 'data.text2'))
      // check(lines[0], lines[1])
  }
  // console.log(result)

  return (
    <div className="App">
      <ImageEditor
        getImage={(image, base64, file, rawFile) => test(image, base64, file, rawFile)}
        cropBoxData={{
          height: 99.43576049804688,
          left: 724.34033203125,
          top: 289.9609680175781,
          width: 640.2647094726562,
        }}
      />
      {openModal && 
      <Modal
      
      visible={openModal}
      onCancel={() => setOpenModal(false)}
      width={1080}
      footer={false}
      >
        <MrzEditor
          initialPreProcessingFile={preProcessingFile}
          initialFile={initialFile}
          getImage={(image, base64, file, rawFile) => parseMrz(image, base64, file, rawFile)}
          // cropBoxData={{
          //   height: 99.43576049804688,
          //   left: 724.34033203125,
          //   top: 289.9609680175781,
          //   width: 640.2647094726562,
          // }}
        />

      </Modal>
      }
      <p>{ocr && ocr}</p>
      {preview && <p>Passport MRZ</p>}
      {preview && <img style={{maxWidth: "800px", minWidth: "700px"}} src={preview} alt="" />}
      {preProcessingImage && <p>Image after processing</p>}
      {preProcessingImage && <img style={{maxWidth: "600px"}} src={preProcessingImage} alt="" />}
      <br />
      <Button onClick={() => parseMrz(null, preview)}>Parse Image to MRZ</Button>
      <br />
      <em>Line 1 missing&nbsp;{44 - (text1 || '').length}</em>
      <Input
        value={text1}
        onChange={e => setText1(e.target.value)}
      />
      <em>Line 2 missing&nbsp;{44 - (text2 || '').length}</em>
      <Input
        value={text2}
        onChange={e => setText2(e.target.value)}
      />
      <Button onClick={() => check()}>Parse MRZ To Information</Button>
      {result && result.details  && result.details.map((item, index) => {
        return (
          <p key={index}>{item.label}:&nbsp;{item.value}</p>
        )
      })}
      <p>{error && 'Please change again'}</p>
    </div>
  );
}

export default App;
