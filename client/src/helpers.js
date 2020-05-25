
export const dataURLtoFile = (dataurl, filename) => {
    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode
    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia
  
    var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n)
  
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    let file = null
    if (isIE || isEdge) {
      file = new Blob([u8arr], { type: 'image/jpeg' })// new File([u8arr], filename, { type: mime })
    } else {
      file = new File([u8arr], filename, { type: mime })
    }
  
    return file
  }