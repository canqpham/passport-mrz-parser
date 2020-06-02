import React, { Component } from 'react'
import 'cropperjs/dist/cropper.css'
import Cropper from 'react-cropper'
import { Modal, Button, Upload, Icon, message, Input, Form } from 'antd'
import { Row, Col } from 'reactstrap'
import RotateLeftIcon from 'mdi-react/RotateLeftIcon'
import RotateRightIcon from 'mdi-react/RotateRightIcon'
import ZoomInIcon from 'mdi-react/ZoomInIcon'
import ZoomOutIcon from 'mdi-react/ZoomOutIcon'
import ArrowUpIcon from 'mdi-react/ArrowUpIcon'
import ArrowDownIcon from 'mdi-react/ArrowDownIcon'
import ArrowLeftIcon from 'mdi-react/ArrowLeftIcon'
import ArrowRightIcon from 'mdi-react/ArrowRightIcon'
import LoadingIcon from 'mdi-react/LoadingIcon'
import { cloneDeep } from 'lodash'
import { dataURLtoFile } from './helpers'
import adaptiveThreshold from 'adaptive-threshold'
const getPixels = require('get-pixels')
const savePixels = require('save-pixels')
const fs = require('fs')
// import './marvin'
/* global FileReader */
// const src = 'https://www.itjobs.com.vn/Upload/AriaDirect-banner.jpg'
const RandomKey = Math.random()

function otsu(histData /* Array of 256 greyscale values */, total /* Total number of pixels */) {
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * histData[t];

  let sumB = 0;
  let wB = 0;
  let wF = 0;

  let varMax = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histData[t];               // Weight Background
    if (wB === 0) continue;

    wF = total - wB;                 // Weight Foreground
    if (wF === 0) break;

    sumB += t * histData[t];

    let mB = sumB / wB;            // Mean Background
    let mF = (sum - sumB) / wF;    // Mean Foreground

    // Calculate Between Class Variance
    let varBetween = wB * wF * (mB - mF) * (mB - mF);

    // Check if new maximum found
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }

  return threshold;
}

const getPixelsToData = (url) => {
  getPixels(url, (err, pixels) => {
    if (err) {
      console.error(err)
      return
    }
    console.log(pixels)
    // callback(pixels)
    let thresholded = adaptiveThreshold(pixels)
    savePixels(thresholded, 'png').pipe(fs.createWriteStream('dist.png'))
  })
}

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
  // console.log(integral)
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
        // console.log(localIntegral)
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
  var img = new Image()
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
    console.log(avgT)
    /**
     * Test
     */
    let results = [];
    [0.4, 0.6, 0.7, 0.8].map(item => {
      computeAdaptiveThreshold(imgPixels, item, (result) => {
        // imgPixels.data = result
        // console.log(result)
        // console.log(otsu(imgPixels.data, imgPixels.data.length))
        ctx.putImageData(result, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
        // ctx.drawImage(img, 0, 0)
        // console.log(canvas)
        const tee = canvas.toDataURL('image/jpeg')
        // console.log(dataURL)
        results.push(tee)
        // canvas = null
      })
    })
    if(results.length) {
      callback(results, avgBrightness, avgT)
    }
    // computeAdaptiveThreshold(imgPixels, ratio, (result) => {
    //   // imgPixels.data = result
    //   // console.log(result)
    //   // console.log(otsu(imgPixels.data, imgPixels.data.length))
    //   ctx.putImageData(result, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
    //   // ctx.drawImage(img, 0, 0)
    //   // console.log(canvas)
    //   dataURL = canvas.toDataURL('image/jpeg')
    //   // console.log(dataURL)
    //   callback(dataURL, avgBrightness, avgT)
    //   canvas = null
    // })
    // console.log(imgPixels)
    // console.log(otsu(imgPixels.data, imgPixels.data.length))

    /**
     * Available
     */
    // function getAvg(grades) {
    //   const total = grades.reduce((acc, c) => acc + c, 0);
    //   return total / grades.length;
    // }
    // const avgT = getAvg(imgPixels.data) > 185 ? 160 : 99
    // console.log(avgT)

    // for (var y = 0; y < imgPixels.height; y++) {
    //   for (var x = 0; x < imgPixels.width; x++) {
    //     // var i = (y * imgPixels.width) + x ;
    //     var i = (y * 4) * imgPixels.width + x * 4;
    //     // if(i < 100) {
    //     //   console.log(i)
    //     // }
    //     var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
    //     // if(imgPixels.data[i] < 48) {
    //     //   avg=0
    //     // } else {
    //     //   avg=255
    //     // }
    //     if(avg < avgT) {
    //       avg = 0
    //     } else {
    //       avg = 255
    //     }
    //     imgPixels.data[i] = avg;
    //     imgPixels.data[i + 1] = avg;
    //     imgPixels.data[i + 2] = avg;
    //   }
    // }

    // ctx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);


    // ctx.drawImage(img, 0, 0)
    // console.log(canvas)
    // dataURL = canvas.toDataURL('image/jpeg')
    // // console.log(dataURL)
    // callback(dataURL)
    // canvas = null
  }
  img.crossOrigin = 'Anonymous' //Use-Credentials
  img.src = url
  // // check if //ariadirect.com or http://ariadirect.com is a different origin
  // if (/^([\w]+\:)?\/\//.test(url) && url.indexOf(location.host) === -1) {
  //   img.crossOrigin = "anonymous"; // or "use-credentials"
  // }

}

class ImageEditor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      src: null,
      cropResult: null,
      loading: false,
      ratio: 1
    }
    this.cropImage = this.cropImage.bind(this)
    // this.onChange = this.onChange.bind(this)
    this.useDefaultImage = this.useDefaultImage.bind(this)
  }

  

  resize = (file, maxWidth, maxHeight, fn) => {
    const resizeImage = (image, maxWidth, maxHeight, quality) => {
      var canvas = document.createElement('canvas');

      var width = image.width;
      var height = image.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * maxHeight / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      var ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", quality);
    }
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (event) {
      var dataUrl = event.target.result;

      var image = new Image();
      image.src = dataUrl;
      image.onload = function () {
        var resizedDataUrl = resizeImage(image, maxWidth, maxHeight, 1);
        fn(resizedDataUrl);
      };
    };
  }

  componentDidMount() {
    // setTimeout(() => {
    // this[RandomKey].setCropBoxData({
      // height: 70.73828125,
      // left: 323.5,
      // top: 295.53125,
      // width: 480.1015625
    // })
    // }, 1000)
  }


  cropImage = (e) => {
    e && e.preventDefault()
    const { getImage } = this.props
    let { filename, rawFile, ratio } = this.state
    // rawFile.name = `${'ariadirect'}.png`
    console.log(rawFile)
    try {
      const randomName = Math.random()
      const file = dataURLtoFile(this[RandomKey].getCroppedCanvas().toDataURL(), `${'ariadirect'}.png`)
      const preview = URL.createObjectURL(file)
      // console.log(file)
      console.log(this[RandomKey].getCropBoxData())

      // Available
      // if (file.size / 1024 > 500) {
      //   console.log('resize')
      //   this.resize(file, 1080, 1080, (fileUrl) => {
      //     console.log(fileUrl)
      //     getImage(preview, fileUrl, dataURLtoFile(fileUrl, filename), rawFile) //dataURLtoFile(fileUrl, `${'ariadirect'}.png`)
      //   })
      // } else {
      //   getImage(preview, this[RandomKey].getCroppedCanvas().toDataURL(), file, rawFile)
      // }

      //Test
      greyscaleImage(this[RandomKey].getCroppedCanvas().toDataURL(), ratio, (results, avgBrightness, avgT) => {
        // const preFile = dataURLtoFile(result, `${'ariadirect'}.png`)
        console.log(results)
        const listFiles = (results || []).map(item => {
          const fileaaa = dataURLtoFile(item, `${Math.random()}.jpg`)
          return fileaaa
          // if (fileaaa.size / 1024 > 200) {
          //   return this.resize(fileaaa, 720, 720, (fileUrl) => {
          //     return (dataURLtoFile(fileUrl, `${Math.random()}.jpg`))
          //   })
          // } else {
          // }
        })
        getImage(preview, results, listFiles) //dataURLtoFile(fileUrl, `${'ariadirect'}.png`)
        // if (file.size / 1024 > 300) {
        //   this.resize(preFile, 720, 720, (fileUrl) => {
        //     console.log(dataURLtoFile(fileUrl, `${'ariadirect'}.jpg`))
        //   })
        // } else {
        //   console.log(preFile)
        //   getImage(preview, result, preFile)
        // }
        this.setState({ avgBrightness, avgT })
      })

    } catch (e) {
      console.log(e)
    }
  }

  cropWithData = () => {
    const { getImage, cropBoxData } = this.props
    let { filename, rawFile } = this.state
    // rawFile.name = `${'ariadirect'}.png`
    console.log(rawFile)
    try {
      this[RandomKey].setCropBoxData(cropBoxData)
      // const randomName = Math.random()
      // const file = dataURLtoFile(this[RandomKey].getCroppedCanvas().toDataURL(), `${'ariadirect'}.png`)
      // const preview = URL.createObjectURL(file)
      // if (file.size / 1024 > 500) {
      //   // console.log('resize')
      //   this.resize(file, 1080, 1080, (fileUrl) => {
      //     convertImgToBase64URL(fileUrl, (result) => {
      //       getImage(preview, result, file, rawFile)

      //     })
      //   })
      // } else {
      //   convertImgToBase64URL(this[RandomKey].getCroppedCanvas().toDataURL(), (result) => {
      //     getImage(preview, result, file, rawFile)
      //   })
      // }
    } catch (e) {
      console.log(e)
    }
  }

  useDefaultImage = (src) => {
    this.setState({ src })
  }

  rotateLeft = () => {
    this[RandomKey].rotate(-90);
  }

  rotateRight = () => {
    this[RandomKey].rotate(90);
  }

  zoomIn = () => {
    this[RandomKey].zoom(0.1);
  }

  zoomOut = () => {
    this[RandomKey].zoom(-0.1);
  }

  moveUp = () => {
    this[RandomKey].move(0, -20);
  }

  moveDown = () => {
    this[RandomKey].move(0, 20);
  }

  moveLeft = () => {
    this[RandomKey].move(-20, 0);
  }

  moveRight = () => {
    this[RandomKey].move(20, 0);
  }

  reset = () => {
    this[RandomKey].reset()
  }

  onDragger = file => {
    console.log(file)
    const reader = new FileReader()
    reader.onload = () => {
      this.setState({ src: reader.result, filename: file.name, rawFile: file })
    }
    reader.readAsDataURL(file)
  }

  changeRatio = (value) => {
    this.setState({ ratio: value }, () => {
      this.cropImage()
    })
  }

  scanMrz = () => {

  }

  render() {
    const { type } = this.props
    const { avgBrightness, avgT } = this.state
    let acceptFileType = 'image/png,image/jpg,image/jpeg'
    const dummyRequest = ({ file, onSuccess }) => {
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    };

    return (
      <div className="image-editor-modal">
        <Row>
          <Col md={6}>
            <div style={{ width: '100%' }}>
              {this.state.src ?
                <Cropper
                  style={{ height: 400, width: '100%' }}
                  preview=".img-preview"
                  guides={false}
                  src={this.state.src}
                  ref={cropper => { this[RandomKey] = cropper }}
                  movable
                  // data={{
                  //     height: 70.73828125,
                  //     left: 323.5,
                  //     top: 295.53125,
                  //     width: 1080.1015625
                  // }}
                // rotatable
                /> :
                <>
                  <Upload.Dragger
                    name='file'
                    multiple={false}
                    accept={acceptFileType}
                    // action='https://www.mocky.io/v2/5cc8019d300000980a055e76'
                    customRequest={dummyRequest}
                    onChange={(info) => {
                      const { status } = info.file;
                      // console.log(info.file)
                      if (status !== 'uploading') {
                      }
                      if (status === 'done') {
                        this.onDragger(info.file.originFileObj)

                      } else if (status === 'error') {
                        message.error(`${info.file.name} file upload failed.`);
                      }
                    }}
                    
                  >
                    <p className="ant-upload-drag-icon">
                      <Icon type="inbox" />
                    </p>
                    <p className="ant-upload-text">
                      {('Drag Drop Click Here To Upload')}
                    </p>
                  </Upload.Dragger>
                </>
              }
            </div>
            <Row>
              <Col md={12} className="button-group">
                <Button
                  // variant="contained"
                  type='primary'
                  // disableElevation
                  onClick={() => this.zoomIn()}
                  className="zoomIn"
                >
                  <ZoomInIcon />
                </Button>
                <Button
                  // variant="contained"
                  type='primary'
                  // disableElevation
                  onClick={() => this.zoomOut()}
                  className="zoomOut"
                >
                  <ZoomOutIcon />
                </Button>
                <Button
                  // variant="contained"
                  type='primary'
                  // disableElevation
                  onClick={() => this.moveUp()}
                  className="zoomOut"
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  // variant="contained"
                  type='primary'
                  // disableElevation
                  onClick={() => this.moveDown()}
                  className="zoomOut"
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  // variant="contained"
                  type='primary'
                  // disableElevation
                  onClick={() => this.moveLeft()}
                  className="zoomOut"
                >
                  <ArrowLeftIcon />
                </Button>
                <Button
                  // variant="contained"
                  type='primary'
                  // disableElevation
                  onClick={() => this.moveRight()}
                  className="zoomOut"
                >
                  <ArrowRightIcon />
                </Button>
                <Button
                  // variant="contained"
                  type='primary'
                  // disableElevation
                  onClick={() => this.rotateLeft()}
                  className="rotateLeft"
                >
                  <RotateLeftIcon />
                </Button>
                <Button
                  // variant="contained"
                  type='primary'
                  // disableElevation
                  onClick={() => this.rotateRight()}
                  className="rotateRight"
                >
                  <RotateRightIcon />
                </Button>
                <Button
                  type='primary'
                  // disableElevation
                  onClick={() => this.reset()}
                  className="reset"
                >
                  {('Reset')}
                </Button>
                {this.state.src &&
                  <Button
                    type="primary"
                    onClick={() => this.setState({ src: null })}
                    className="upload-iamge-label-button"
                  >
                    {'Remove'}
                  </Button>}

                {/* <Button
                  type="primary"
                  onClick={() => this.cropWithData()}
                  className="upload-iamge-label-button"
                >
                  {'Crop With Available Data'}
                </Button> */}
              </Col>
            </Row>

          </Col>
          <Col md={6} >
            <Form
              onSubmit={this.cropImage}
            >
              <p>Brightness: {avgBrightness}</p>
              <Row>
                Ratio
              <Input
                  defaultValue={this.state.ratio}
                  // value={avgT}
                  onChange={e => this.changeRatio(e.target.value)}
                  style={{ maxWidth: '600px' }}
                  type="number"
                  min="0"
                  // max="1"
                  step="0.05"
                  // disabled={true}
                />
              </Row>
              <Row>

                {this.state.src && <Button
                  type="primary"
                  // onClick={() => this.cropImage()}
                  className="upload-iamge-label-button"
                  htmlType="submit"
                >
                  {'Ok'}
                </Button>}
                {/* {this.state.src && <Button
                  type="primary"
                  onClick={() => this.scanMrz()}
                  className="upload-iamge-label-button"
                  // htmlType="submit"
                >
                  {'Scan MRZ'}
                </Button>} */}
              </Row>

            </Form>
            {/* <input type="file" onChange={this.onChange} id="upload-image-input-field" style={{ display: 'none' }} />
                <label htmlFor="upload-image-input-field" className="upload-iamge-label-button" >
                  Select Image
                </label> */}

          </Col>
        </Row>
      </div>
    )
  }
}

export default (ImageEditor)
