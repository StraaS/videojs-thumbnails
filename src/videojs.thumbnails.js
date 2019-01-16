// create the thumbnail
const defaults = {
  0: {
    src: 'example-thumbnail.png'
  }
}
const div = document.createElement('div')
const img = document.createElement('img')

// keep track of the duration to calculate correct thumbnail to display
let duration = 0
let progressControl = null
let player = null
let settings = {}

function getComputedStyle(el, pseudo) {
  return function (prop) {
    if (window.getComputedStyle) {
      return window.getComputedStyle(el, pseudo)[prop]
    } else {
      return el.currentStyle[prop]
    }
  }
}

function offsetParent(el) {
  if (el.nodeName !== 'HTML' && getComputedStyle(el)('position') === 'static') {
    return offsetParent(el.offsetParent)
  }
  return el
}

function getVisibleWidth(el, width) {
  var clip

  if (width) {
    return parseFloat(width)
  }

  clip = getComputedStyle(el)('clip')
  if (clip !== 'auto' && clip !== 'inherit') {
    clip = clip.split(/(?:\(|\))/)[1].split(/(?:,| )/)
    if (clip.length === 4) {
      return (parseFloat(clip[1]) - parseFloat(clip[3]))
    }
  }
  return 0
}

function getScrollOffset() {
  if (window.pageXOffset) {
    return {
      x: window.pageXOffset,
      y: window.pageYOffset
    }
  }
  return {
    x: document.documentElement.scrollLeft,
    y: document.documentElement.scrollTop
  }
}

function updateOptions(options) {
  settings = { ...settings, ...options }
}

function addFakeActivePseudoClass() {
  var progressControl, addFakeActive, removeFakeActive
  // Android doesn't support :active and :hover on non-anchor and non-button elements
  // so, we need to fake the :active selector for thumbnails to show up.
  if (navigator.userAgent.toLowerCase().indexOf("android") !== -1) {
    progressControl = player.controlBar.progressControl

    addFakeActive = function () {
      progressControl.addClass('fake-active')
    }
    removeFakeActive = function () {
      progressControl.removeClass('fake-active')
    }

    progressControl.on('touchstart', addFakeActive)
    progressControl.on('touchend', removeFakeActive)
    progressControl.on('touchcancel', removeFakeActive)
  }
}

function moveOnProgressControl(event) {
  let mouseTime = 0
  let time = 0
  let active = 0
  let left = 0
  let setting = {}
  let width = 0
  let halfWidth = 0
  let pageXOffset = getScrollOffset().x
  let clientRect = offsetParent(progressControl.el()).getBoundingClientRect()
  let right = (clientRect.width || clientRect.right) + pageXOffset
  let pageX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX

  // find the page offset of the mouse
  left = pageX || (event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)
  // subtract the page offset of the positioned offset parent
  left -= offsetParent(progressControl.el()).getBoundingClientRect().left + pageXOffset

  // apply updated styles to the thumbnail if necessary
  // mouseTime is the position of the mouse along the progress control bar
  // `left` applies to the mouse position relative to the player so we need
  // to remove the progress control's left offset to know the mouse position
  // relative to the progress control
  mouseTime = Math.floor((left - progressControl.el().offsetLeft) / progressControl.width() * duration)
  for (time in settings) {
    if (mouseTime > time) {
      active = Math.max(active, time)
    }
  }
  setting = settings[active]

  if (setting.src && img.src != setting.src) {
    img.src = setting.src
  }

  if (setting.style) {
    for (let styleProp of Object.keys(setting.style)) {
      img.style[styleProp] = setting.style[styleProp]
    }
  }

  width = getVisibleWidth(img, setting.width || settings[0].width)
  halfWidth = width / 2

  // make sure that the thumbnail doesn't fall off the right side of the left side of the player
  if ((left + halfWidth) > right) {
    left -= (left + halfWidth) - right
  } else if (left < halfWidth) {
    left = halfWidth
  }

  div.style.left = left + 'px'
}

function moveCancel(event) {
  div.style.left = '-1000px'
}

function setupDuration() {
  duration = player.duration()

  // when the container is MP4
  player.on('durationchange', function (event) {
    duration = player.duration()
  })

  // when the container is HLS
  player.on('loadedmetadata', function (event) {
    duration = player.duration()
  })
}

/**
 * register the thubmnails plugin
 */
videojs.plugin('thumbnails', function (options) {
  player = this
  progressControl = player.controlBar.progressControl

  settings = { ...defaults, ...options }

  videojs.thumbnails = {
    updateOptions
  }

  addFakeActivePseudoClass()
  setupDuration()

  div.className = 'vjs-thumbnail-holder'
  div.appendChild(img)
  img.src = settings['0'].src
  img.className = 'vjs-thumbnail'

  img.style = { ...img.style, ...settings['0'].style }

  // center the thumbnail over the cursor if an offset wasn't provided
  if (!img.style.left && !img.style.right) {
    img.onload = function () {
      img.style.left = -(img.naturalWidth / 2) + 'px'
    }
  }

  // add the thumbnail to the player
  progressControl.el().appendChild(div)

  // update the thumbnail while hovering
  progressControl.on('mousemove', moveOnProgressControl)
  progressControl.on('touchmove', moveOnProgressControl)

  // move the placeholder out of the way when not hovering
  progressControl.on('mouseout', moveCancel)
  progressControl.on('touchcancel', moveCancel)
  progressControl.on('touchend', moveCancel)
  player.on('userinactive', moveCancel)
})
