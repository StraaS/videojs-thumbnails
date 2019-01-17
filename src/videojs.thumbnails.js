// create the thumbnail
const defaults = {
  0: {
    src: 'example-thumbnail.png',
  },
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

  static getComputedStyle(el, prop, pseudo = null) {
    if (window.getComputedStyle) {
      return window.getComputedStyle(el, pseudo)[prop]
    }

    return el.currentStyle[prop]
  }

  static offsetParent(el) {
    if (el.nodeName !== 'HTML' && Thumbnails.getComputedStyle(el, 'position') === 'static') {
      return Thumbnails.offsetParent(el.offsetParent)
    }
    return el
  }

  static getVisibleWidth(el, width) {
    let clip = null

    if (width) {
      return parseFloat(width)
    }

    clip = Thumbnails.getComputedStyle(el, 'clip')
    if (clip !== 'auto' && clip !== 'inherit') {
      clip = clip.split(/(?:\(|\))/)[1].split(/(?:,| )/)
      if (clip.length === 4) {
        return (parseFloat(clip[1]) - parseFloat(clip[3]))
      }
    }
    return 0
  }

  static getScrollOffset() {
    if (window.pageXOffset) {
      return {
        x: window.pageXOffset,
        y: window.pageYOffset,
      }
    }
    return {
      x: document.documentElement.scrollLeft,
      y: document.documentElement.scrollTop,
    }
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
        this.img.style.left = `-${(this.img.naturalWidth / 2)}px`
      }
    }

    const { progressControl } = this.player.controlBar

    // add the thumbnail to the player
    progressControl.el().appendChild(this.div)
  }

  installListeners() {
    const { progressControl } = this.player.controlBar

    // update the thumbnail while hovering
    progressControl.on('mousemove', this.moveOnProgressControl)
    progressControl.on('touchmove', this.moveOnProgressControl)

    // move the placeholder out of the way when not hovering
    progressControl.on('mouseout', this.moveCancel)
    progressControl.on('touchcancel', this.moveCancel)
    progressControl.on('touchend', this.moveCancel)

    this.player.on('userinactive', this.moveCancel)
  }

  updateOptions(options) {
    this.settings = { ...this.settings, ...options }
  }

  addFakeActivePseudoClass() {
    // Android doesn't support :active and :hover on non-anchor and non-button elements
    // so, we need to fake the :active selector for thumbnails to show up.
    if (navigator.userAgent.toLowerCase().indexOf('android') === -1) {
      return
    }

    const { progressControl } = this.player.controlBar

    function addFakeActive() {
      progressControl.addClass('fake-active')
    }

    function removeFakeActive() {
      progressControl.removeClass('fake-active')
    }

    progressControl.on('touchstart', addFakeActive)
    progressControl.on('touchend', removeFakeActive)
    progressControl.on('touchcancel', removeFakeActive)
  }

  moveOnProgressControl(event) {
    const { progressControl } = this.player.controlBar

    let mouseTime = 0
    let active = 0
    let left = 0
    let setting = {}
    let width = 0
    let halfWidth = 0
    const pageXOffset = Thumbnails.getScrollOffset().x
    const clientRect = Thumbnails.offsetParent(progressControl.el()).getBoundingClientRect()
    const right = (clientRect.width || clientRect.right) + pageXOffset
    const pageX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX

    // find the page offset of the mouse
    left = pageX || (event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft)
    // subtract the page offset of the positioned offset parent
    left -= Thumbnails.offsetParent(progressControl.el()).getBoundingClientRect().left + pageXOffset

    // apply updated styles to the thumbnail if necessary
    // mouseTime is the position of the mouse along the progress control bar
    // `left` applies to the mouse position relative to the player so we need
    // to remove the progress control's left offset to know the mouse position
    // relative to the progress control
    mouseTime = Math.floor(
      (
        (left - progressControl.el().offsetLeft) / progressControl.width()
        // eslint-disable-next-line
      ) * this.player.duration()
    )

    Object.keys(this.settings).forEach((displayTime) => {
      if (mouseTime > displayTime) {
        active = Math.max(active, displayTime)
      }
    })
    setting = this.settings[active]

    if (setting.src && this.img.src !== setting.src) {
      this.img.src = setting.src
    }

    if (setting.style) {
      Object.keys(setting.style).forEach((styleProp) => {
        this.img.style[styleProp] = setting.style[styleProp]
      })
    }

    width = Thumbnails.getVisibleWidth(this.img, setting.width || this.settings[0].width)
    halfWidth = width / 2

    // make sure that the thumbnail doesn't fall off the right side of the left side of the player
    if ((left + halfWidth) > right) {
      left -= (left + halfWidth) - right
    } else if (left < halfWidth) {
      left = halfWidth
    }

    this.div.style.left = `${left}px`
  }

  moveCancel() {
    this.div.style.left = '-1000px'
  }
}

/**
 * register the thubmnails plugin
 */
videojs.plugin('thumbnails', function thumbnails(options) {
  const thumbnailInstance = new Thumbnails(this, options)

  videojs.thumbnails = {
    updateOptions: thumbnailInstance.updateOptions.bind(thumbnailInstance),
  }
})
