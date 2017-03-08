import Heap from 'heap'

function main (num) {
  var list = []
  var timeout

  function sendResult () {
    chrome.runtime.sendMessage({
      msg: 'PHOTOS',
      title: document.title,
      href: window.location.href,
      photos: Heap.nlargest(list, num, (a, b) => a.width * a.height - b.width * b.height)
    })
  }

  function getImgSize (src) {
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = function () {
        resolve({
          src: this.src,
          width: this.naturalWidth,
          height: this.naturalHeight
        })
      }
      img.onerror = (e) => reject(e)
      img.src = src
    })
  }

  function gatherImgSrcs (doc) {
    const extChecker = /(\.jpg)|(\.jpeg)|(\.png)|(\.gif)/i
    return Array.from(doc.querySelectorAll('*'))
      .reduce((set, el) => {
        if (/^img$/i.test(el.tagName) && extChecker.test(el.src)) {
          set.add(el.src)
        }
        let prop = window.getComputedStyle(el, null).getPropertyValue('background-image')
        let match = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i.exec(prop)
        if (match && extChecker.test(match[1])) {
          set.add(match[1])
        }
        return set
      }, new Set())
  }

  function entry (doc) {
    gatherImgSrcs(doc).forEach(src => {
      getImgSize(src).then(imgObj => {
        list.push(imgObj)
        if (timeout) { clearTimeout(timeout) }
        timeout = setTimeout(sendResult, 500)
      }, () => {})
    })
  }

  entry(document)
  loopIframes(document)

  function loopIframes (doc) {
    // search images in all iframes
    doc.querySelectorAll('iframe')
      .forEach(el => {
        entry(el.contentDocument || el.contentWindow.document)
        loopIframes(doc)
      })
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.msg) {
    case 'REQUEST_PHOTOS': return main(request.num || 80)
    case 'REQUEST_PAGE_INFO': return sendResponse({title: document.title, href: window.location.href})
  }
})
