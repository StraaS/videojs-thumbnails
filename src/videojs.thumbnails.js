import * as _ from 'lodash'
import binarySearchRange from './binary-search-range'

import './videojs.thumbnails.css'

class Thumbnails {
  constructor(player, options) {
    Thumbnails.validateConstructorSettings(options)

    this.player = player
    this.settings = {}
    this.moveOnProgressControl = this.moveOnProgressControl.bind(this)
    this.moveCancel = this.moveCancel.bind(this)

    this.updateOptions(options)
    this.prepareUi()
    this.addFakeActivePseudoClass()
    this.installListeners()
  }

  static getImageSrc(options) {
    if (options && options.src) return options.src
    return this.settings && this.settings.grid && this.settings.grid.src
  }

  static validateConstructorSettings(options) {
    if (!_.isObject(options.grid)) {
      throw new Error('`options.grid` must be an object')
    }

    if (!_.isFinite(options.grid.tileWidth)) {
      throw new Error('`options.grid.tileWidth` must be a number')
    }

    if (!_.isFinite(options.grid.tileHeight)) {
      throw new Error('`options.grid.tileHeight` must be a number')
    }
  }

  static validateTileSettings(options) {
    if (!Array.isArray(options.grid.tileSettings)) {
      throw new Error('`options.grid.tileSettings` must be an array')
    }

    const validTileSettings = options.grid.tileSettings.filter(
      tileSetting =>
        _.isFinite(tileSetting.columnIndex)
        && _.isFinite(tileSetting.rowIndex)
        // eslint-disable-next-line comma-dangle
        && _.isFinite(tileSetting.position)
    )

    if (validTileSettings.length !== options.grid.tileSettings.length) {
      throw new Error('`each element of options.grid.tileSettings` must have columnIndex and rowIndex keys which both are numerical values')
    }
  }

  static parseLeftToRightTileAllocation(options) {
    if (!_.isObject(options.grid)) {
      return []
    }

    if (!_.isObject(options.grid.leftToRightAllocation)) {
      return []
    }

    const { grid } = options
    const { leftToRightAllocation } = grid

    if (!_.isFinite(leftToRightAllocation.columnNumber)) {
      throw new Error('`leftToRightAllocation.columnNumber` must be an number')
    }

    if (!_.isFinite(leftToRightAllocation.rowNumber)) {
      throw new Error('`leftToRightAllocation.rowNumber` must be an number')
    }

    if (!_.isFinite(leftToRightAllocation.interval)) {
      throw new Error('`leftToRightAllocation.interval` must be an number')
    }

    const { columnNumber, rowNumber, interval } = leftToRightAllocation
    const src = Thumbnails.getImageSrc(grid)

    let startPosition = (leftToRightAllocation.startPosition || 0) - interval

    const tileSettings = []

    for (let rowIndex = 0; rowIndex < rowNumber; ++rowIndex) {
      for (let columnIndex = 0; columnIndex < columnNumber; ++columnIndex) {
        startPosition += interval

        tileSettings.push({
          src,
          position: startPosition,
          columnIndex,
          rowIndex,
        })
      }
    }

    return tileSettings
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

  static mergeSettings(dest, src) {
    return _.mergeWith(dest, src, (objValue, srcValue, key) => {
      if (key === 'tileSettings') {
        return _.unionBy(objValue, srcValue, obj => obj.position)
      }

      return undefined
    })
  }

  setTileContainerBackground(url, left, top) {
    this.tileContainer.style.background = `url(${url})`
    this.tileContainer.style.backgroundPosition = `left ${left}px top ${top}px`
    this.tileContainer.style.backgroundRepeat = 'no-repeat'
  }

  prepareUi() {
    const { tileWidth, tileHeight } = this.settings.grid
    const imageSrc = Thumbnails.getImageSrc()

    this.tileContainer = document.createElement('div')

    this.tileContainer.className = 'vjs-thumbnail'
    this.tileContainer.style.width = `${tileWidth}px`
    this.tileContainer.style.height = `${tileHeight}px`
    this.setTileContainerBackground(imageSrc, 0, 0)

    const { progressControl } = this.player.controlBar

    // add the thumbnail to the player
    progressControl.el().appendChild(this.tileContainer)
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
    Thumbnails.validateConstructorSettings(options)

    let validatedOptions = options

    const tileSettings = Thumbnails.parseLeftToRightTileAllocation(options)
    if (tileSettings.length) {
      const newOptions = {
        grid: {
          tileSettings,
        },
      }

      validatedOptions = Thumbnails.mergeSettings(validatedOptions, newOptions)
    }

    this.settings = Thumbnails.mergeSettings(this.settings, validatedOptions)

    Thumbnails.validateTileSettings(this.settings)
    this.settings.grid.tileSettings.sort((a, b) => a.position - b.position)
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

  moveTileContainerBackground(currentTile) {
    const imageSrc = Thumbnails.getImageSrc(currentTile)
    const left = -1 * currentTile.columnIndex * this.settings.grid.tileWidth
    const top = -1 * currentTile.rowIndex * this.settings.grid.tileHeight

    this.setTileContainerBackground(imageSrc, left, top)
  }

  moveOnProgressControl(event) {
    const { progressControl } = this.player.controlBar

    let mouseTime = 0
    let left = 0
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

    const [tileIndex] = binarySearchRange(
      this.settings.grid.tileSettings,
      mouseTime,
      (list, index) => list[index].position,
    )

    this.moveTileContainerBackground(this.settings.grid.tileSettings[tileIndex])

    const halfWidth = this.settings.grid.tileWidth / 2

    // make sure that the thumbnail doesn't fall off the right side of the left side of the player
    if ((left + halfWidth) > right) {
      left -= (left + halfWidth) - right
    }
    else if (left < halfWidth) {
      left = halfWidth
    }

    this.tileContainer.style.left = `${left - halfWidth}px`
  }

  moveCancel() {
    this.tileContainer.style.left = '-1000px'
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
