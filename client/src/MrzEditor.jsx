import React, { Component } from 'react'
import 'cropperjs/dist/cropper.css'
import Cropper from 'react-cropper'
import { Modal, Button, Upload, Icon, message } from 'antd'
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

// import './marvin'
/* global FileReader */
// const src = 'https://www.itjobs.com.vn/Upload/AriaDirect-banner.jpg'
const RandomKey = Math.random()

function convertImgToBase64URL(url, callback) {
    var img = new Image()
    img.onload = function () {
        var canvas = document.createElement('CANVAS')
        let ctx = canvas.getContext('2d'), dataURL
        canvas.height = img.height
        canvas.width = img.width

        ctx.drawImage(img, 0, 0, img.width, img.height);

        var imgPixels = ctx.getImageData(0, 0, img.width, img.height);

        // computeAdaptiveThreshold(imgPixels, 1, url,  (result) => {
        //   // imgPixels.data = result
        //   ctx.putImageData(result, 0, 0, 0, 0, imgPixels.width, imgPixels.height);


        // // ctx.drawImage(img, 0, 0)
        // // console.log(canvas)
        // dataURL = canvas.toDataURL('image/jpeg')
        // // console.log(dataURL)
        // callback(dataURL)
        // canvas = null
        // })

        // console.log(imgPixels)

        // console.log(otsu(imgPixels.data, imgPixels.data.length))

        function getAvg(grades) {
            const total = grades.reduce((acc, c) => acc + c, 0);
            return total / grades.length;
        }
        const avgT = getAvg(imgPixels.data) > 185 ? 160 : 99
        console.log(avgT)

        for (var y = 0; y < imgPixels.height; y++) {
            for (var x = 0; x < imgPixels.width; x++) {
                // var i = (y * imgPixels.width) + x ;
                var i = (y * 4) * imgPixels.width + x * 4;
                // if(i < 100) {
                //   console.log(i)
                // }
                var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
                // if(imgPixels.data[i] < 48) {
                //   avg=0
                // } else {
                //   avg=255
                // }
                if (avg < avgT) {
                    avg = 0
                } else {
                    avg = 255
                }
                imgPixels.data[i] = avg;
                imgPixels.data[i + 1] = avg;
                imgPixels.data[i + 2] = avg;
            }
        }

        ctx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);


        // ctx.drawImage(img, 0, 0)
        // console.log(canvas)
        dataURL = canvas.toDataURL('image/jpeg')
        // console.log(dataURL)
        callback(dataURL)
        canvas = null
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
            preProcessingImage: null
        }
        this.cropImage = this.cropImage.bind(this)
        // this.onChange = this.onChange.bind(this)
        this.useDefaultImage = this.useDefaultImage.bind(this)
    }

    UNSAFE_componentWillMount() {
        const { initialFile, initialPreProcessingFile } = this.props
        this.onDragger(initialFile)
        if (initialPreProcessingFile) {
            const reader = new FileReader()
            reader.onload = () => {
                this.setState({ preProcessingImage: reader.result})
            }
            reader.readAsDataURL(initialPreProcessingFile)
        }
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

    cropImage = () => {
        const { getImage } = this.props
        let { filename, rawFile } = this.state
        // rawFile.name = `${'ariadirect'}.png`
        // console.log(rawFile)
        try {
            console.log(this[RandomKey].getCropBoxData())
            this.mrz.setCropBoxData(this[RandomKey].getCropBoxData())
            // const randomName = Math.random()
            const file = dataURLtoFile(this['mrz'].getCroppedCanvas().toDataURL(), `${'ariadirect'}.png`)
            console.log(this['mrz'].getCroppedCanvas().toDataURL())
            this.setState({ cropResult: this['mrz'].getCroppedCanvas().toDataURL() })
            const preview = URL.createObjectURL(file)
            getImage(preview, this['mrz'].getCroppedCanvas().toDataURL(), file)
            // console.log(file)
            // console.log(this[RandomKey].getCropBoxData())
            // console.log(preview)
            // console.log(this[RandomKey].getCroppedCanvas().toDataURL())
            // getPixelsToData(this[RandomKey].getCroppedCanvas().toDataURL())
            // convertImgToBase64URL(this[RandomKey].getCroppedCanvas().toDataURL(), (result) => {
            //   getImage(preview, result, file)

            // })
            // this.resize(file, 1080, 1080, (fileUrl) => {
            //   getImage(preview, fileUrl, dataURLtoFile(fileUrl, `${randomName}.png`))
            //   // convertImgToBase64URL(fileUrl, (result) => {
            //     // console.log(result)
            //   // })
            // })
            // let filesize = file.size / 1024
            // let fileTest = file
            // while(filesize < 150) {

            // }
            // if (file.size / 1024 > 500) {
            //     // console.log('resize')
            //     this.resize(file, 1080, 1080, (fileUrl) => {
            //         convertImgToBase64URL(fileUrl, (result) => {
            //             getImage(preview, result, file, rawFile)

            //         })
            //     })
            // } else {
            //     convertImgToBase64URL(this[RandomKey].getCroppedCanvas().toDataURL(), (result) => {
            //         getImage(preview, result, file, rawFile)
            //     })
            // }
            // console.log(preview)
            // console.log(this[RandomKey].getCroppedCanvas().toDataURL())
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
            // this[RandomKey].getData()
            console.log(this[RandomKey].getImageData())
            this['mrz'].setData(this[RandomKey].getData())
            this['mrz'].setCropBoxData(this[RandomKey].getCropBoxData())
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
        this['mrz'].rotate(-90);
    }

    rotateRight = () => {
        this[RandomKey].rotate(90);
        this['mrz'].rotate(90);
    }

    zoomIn = () => {
        this[RandomKey].zoom(0.1);
        this['mrz'].zoom(0.1);
    }

    zoomOut = () => {
        this[RandomKey].zoom(-0.1);
        this['mrz'].zoom(-0.1);
    }

    moveUp = () => {
        this[RandomKey].move(0, -20);
        this['mrz'].move(0, -20);
    }

    moveDown = () => {
        this[RandomKey].move(0, 20);
        this['mrz'].move(0, 20);
    }

    moveLeft = () => {
        this[RandomKey].move(-20, 0);
        this['mrz'].move(-20, 0);
    }

    moveRight = () => {
        this[RandomKey].move(20, 0);
        this['mrz'].move(20, 0);
    }

    reset = () => {
        this[RandomKey].reset()
        this['mrz'].reset()
    }

    onDragger = file => {
        console.log(file)
        const reader = new FileReader()
        reader.onload = () => {
            this.setState({ src: reader.result, filename: file.name, rawFile: file })
        }
        reader.readAsDataURL(file)
    }

    render() {
        const { type } = this.props
        let acceptFileType = 'image/png,image/jpg,image/jpeg'
        return (
            <div className="image-editor-modal">
                <Row>
                    <Col md={6}>
                        <div style={{ width: '100%' }}>
                            {this.state.src ?
                                <Cropper
                                    movable={false}
                                    zoomable={false}
                                    rotatable={false}
                                    style={{ height: 400, width: '100%' }}
                                    preview=".img-preview"
                                    guides={false}
                                    src={this.state.src}
                                    ref={cropper => { this[RandomKey] = cropper }}
                                    movable
                                // rotatable
                                /> :
                                <>
                                    <Upload.Dragger
                                        name='file'
                                        multiple={false}
                                        accept={acceptFileType}
                                        action='https://www.mocky.io/v2/5cc8019d300000980a055e76'
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
                                {/* <Button
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
                                */}
                                <Button
                                    type="primary"
                                    onClick={() => this.cropImage()}
                                    className="upload-iamge-label-button"
                                >
                                    {'Ok'}
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => this.cropWithData()}
                                    className="upload-iamge-label-button"
                                >
                                    {'Crop With Available Data'}
                                </Button>
                            </Col>
                        </Row>

                    </Col>
                    <Col md={6} >
                        <Row>
                            <img
                                style={{
                                    maxWidth: '90%',
                                    border: '1px solid #ddd'
                                }}
                                src={this.state.cropResult}
                            />
                        </Row>
                        <Row>
                            {/* {this.state.src &&
                                <Button
                                    type="primary"
                                    onClick={() => this.setState({ src: null })}
                                    className="upload-iamge-label-button"
                                >
                                    {'Remove'}
                                </Button>} */}
                            {/* <input type="file" onChange={this.onChange} id="upload-image-input-field" style={{ display: 'none' }} />
                <label htmlFor="upload-image-input-field" className="upload-iamge-label-button" >
                  Select Image
                </label> */}

                        </Row>
                    </Col>
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            zIndex: -1,
                            // position: 'fixed',
                            // top: '-700px'
                        }}
                    >
                        <Cropper
                            className={"mrz-preprocessing"}
                            style={{ height: 400, width: '100%' }}
                            preview=".img-preview"
                            movable={false}
                            zoomable={false}
                            rotatable={false}
                            guides={false}
                            src={this.state.preProcessingImage}
                            ref={cropper => { this.mrz = cropper }}
                            movable
                        // rotatable
                        />
                    </div>
                </Row>
            </div>
        )
    }
}

export default (ImageEditor)
