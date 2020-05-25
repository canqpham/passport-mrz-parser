import React, { useEffect, useState } from 'react';
import './App.css';
import { Input, Button } from 'antd'
import ImageEditor from './ImageEditor'
import { parse } from 'mrz'
import createFetch from './fetch'



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

  const doOCR = async (url, base64, file, rawFile) => {
    try {
      console.log(file)
      console.log(base64)
      let body = new FormData();
      body.append('file', file);
      body.append('fileBase64', base64);


      const res = await createFetch().post('http://localhost:5000/api/upload', body)
      // const { data } = await parsePassport(file)
      console.log(res)
      if(!res.data) {
        alert('Cannot parse ....')
      }
      setPreProcessingImage(((res.data || {}).processedImage))
      let lines = res.data.lines
        .map(line => line.text)
        .map(text => text.replace(/ |\r\n|\r|\n/g, ""))
      console.log(lines)
      let text1 = lines[lines.length - 2]
      let text2 = lines[lines.length - 1]
      if(text1.length < 44) {
        console.log('text1 < 44: ', 44 -  text1.length)
        for(let i = 0; i < 44 -  text1.length; i ++) {
          text1 = text1 + '<'
        }
      } else {
        if(text1.length > 44) {
          console.log('text1 > 44')
          for(let i = 0; i < text1.length - 44 ; i ++) {
            text1 = text1.slice(0, 43)
          }
        }
      }
      if(text2.length < 44) {
        console.log('text2 < 44: ', 44 -  text2.length)
        for(let i = 0; i < 44 -  text2.length; i ++) {
          text2 = text2 + '<'
        }
      } else {
        if(text2.length > 44) {
          console.log('text1 > 44')
          for(let i = 0; i < text2.length - 44 ; i ++) {
            text2 = text2.slice(0, 43)
          }
        }
      }
      setText1(text1)
      setText2(text2)
      contentArea = lines.join("\r\n");
      console.log(contentArea);
      check(lines[0], lines[1])
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

  const test = (url, base64, file, rawFile) => {
    setOcr('Recognizing...')
    setPreview(url)
    setPreProcessingImage(null)
    doOCR(url, base64, file, rawFile)
  }

  return (
    <div className="App">
      <ImageEditor
        getImage={(image, base64, file, rawFile) => test(image, base64, file, rawFile)}
      />
      <p>{ocr && ocr}</p>
      {preview && <p>Passport MRZ</p>}
      {preview && <img style={{maxWidth: "65%"}} src={preview} alt="" />}
      {preProcessingImage && <p>Image after processing</p>}
      {preProcessingImage && <img style={{maxWidth: "65%"}} src={preProcessingImage} alt="" />}
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
      <Button onClick={check}>Parse</Button>
      {result && result.details.map((item, index) => {
        return (
          <p key={index}>{item.label}:&nbsp;{item.value}</p>
        )
      })}
      <p>{error && 'Please change again'}</p>
    </div>
  );
}

export default App;
