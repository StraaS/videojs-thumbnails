// create the thumbnail
const defaults = {
  0: {
    src: 'example-thumbnail.png'
  }
}

class Thumbnails {
  constructor(player, options) {
    // keep track of the duration to calculate correct thumbnail to display
    this.player = player
    this.settings = { ...defaults, ...options }
    this.moveOnProgressControl = this.moveOnProgressControl.bind(this)
    this.moveCancel = this.moveCancel.bind(this)

    this.prepareUi()
    this.addFakeActivePseudoClass()
    this.installListeners()
  }

  prepareUi() {
    this.div = document.createElement('div')
    this.img = document.createElement('img')

    this.div.className = 'vjs-thumbnail-holder'
    this.div.appendChild(this.img)
    this.img.src = this.settings['0'].src
    this.img.className = 'vjs-thumbnail'
    this.img.style = { ...this.img.style, ...this.settings['0'].style }

    // center the thumbnail over the cursor if an offset wasn't provided
    if (!this.img.style.left && !this.img.style.right) {
      this.img.onload = () => {
        this.img.style.left = -(this.img.naturalWidth / 2) + 'px'
      }
    }

    const progressControl = this.player.controlBar.progressControl

    // add the thumbnail to the player
    progressControl.el().appendChild(this.div)
  }

  installListeners() {
    const progressControl = this.player.controlBar.progressControl

    // update the thumbnail while hovering
    progressControl.on('mousemove', this.moveOnProgressControl)
    progressControl.on('touchmove', this.moveOnProgressControl)

    // move the placeholder out of the way when not hovering
    progressControl.on('mouseout', this.moveCancel)
    progressControl.on('touchcancel', this.moveCancel)
    progressControl.on('touchend', this.moveCancel)

    this.player.on('userinactive', this.moveCancel)
  }

  getComputedStyle(el, pseudo) {
    return function (prop) {
      if (window.getComputedStyle) {
        return window.getComputedStyle(el, pseudo)[prop]
      } else {
        return el.currentStyle[prop]
      }
    }
  }

  offsetParent(el) {
    if (el.nodeName !== 'HTML' && this.getComputedStyle(el)('position') === 'static') {
      return this.offsetParent(el.offsetParent)
    }
    return el
  }

  getVisibleWidth(el, width) {
    var clip

    if (width) {
      return parseFloat(width)
    }

    clip = this.getComputedStyle(el)('clip')
    if (clip !== 'auto' && clip !== 'inherit') {
      clip = clip.split(/(?:\(|\))/)[1].split(/(?:,| )/)
      if (clip.length === 4) {
        return (parseFloat(clip[1]) - parseFloat(clip[3]))
      }
    }
    return 0
  }

  getScrollOffset() {
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

  updateOptions(options) {
    this.settings = { ...this.settings, ...options }
  }

  addFakeActivePseudoClass() {
    // Android doesn't support :active and :hover on non-anchor and non-button elements
    // so, we need to fake the :active selector for thumbnails to show up.
    if (navigator.userAgent.toLowerCase().indexOf("android") === -1) {
      return
    }

    const progressControl = this.player.controlBar.progressControl

    const addFakeActive = function () {
      progressControl.addClass('fake-active')
    }

    const removeFakeActive = function () {
      progressControl.removeClass('fake-active')
    }

    progressControl.on('touchstart', addFakeActive)
    progressControl.on('touchend', removeFakeActive)
    progressControl.on('touchcancel', removeFakeActive)

  }

  moveOnProgressControl(event) {
    const progressControl = this.player.controlBar.progressControl

    let mouseTime = 0
    let time = 0
    let active = 0
    let left = 0
    let setting = {}
    let width = 0
    let halfWidth = 0
    let pageXOffset = this.getScrollOffset().x
    let clientRect = this.offsetParent(progressControl.el()).getBoundingClientRect()
    let right = (clientRect.width || clientRect.right) + pageXOffset
    let pageX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX

    // find the page offset of the mouse
    left = pageX || (event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)
    // subtract the page offset of the positioned offset parent
    left -= this.offsetParent(progressControl.el()).getBoundingClientRect().left + pageXOffset

    // apply updated styles to the thumbnail if necessary
    // mouseTime is the position of the mouse along the progress control bar
    // `left` applies to the mouse position relative to the player so we need
    // to remove the progress control's left offset to know the mouse position
    // relative to the progress control
    mouseTime = Math.floor(
      ((left - progressControl.el().offsetLeft) / progressControl.width()) * this.player.duration()
    )

    for (time in this.settings) {
      if (mouseTime > time) {
        active = Math.max(active, time)
      }
    }
    setting = this.settings[active]

    if (setting.src && this.img.src != setting.src) {
      this.img.src = setting.src
    }

    if (setting.style) {
      for (let styleProp of Object.keys(setting.style)) {
        this.img.style[styleProp] = setting.style[styleProp]
      }
    }

    width = this.getVisibleWidth(this.img, setting.width || this.settings[0].width)
    halfWidth = width / 2

    // make sure that the thumbnail doesn't fall off the right side of the left side of the player
    if ((left + halfWidth) > right) {
      left -= (left + halfWidth) - right
    } else if (left < halfWidth) {
      left = halfWidth
    }

    this.div.style.left = left + 'px'
  }

  moveCancel() {
    this.div.style.left = '-1000px'
  }
}

/**
 * register the thubmnails plugin
 */
videojs.plugin('thumbnails', function (options) {
  const thumbnailInstance = new Thumbnails(this, options)

  videojs.thumbnails = {
    updateOptions: thumbnailInstance.updateOptions.bind(thumbnailInstance)
  }
})
