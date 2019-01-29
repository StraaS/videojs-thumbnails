import videojs from 'video.js'
import * as _ from 'lodash'
import binarySearchRange from './binary-search-range'

import './videojs.thumbnails.css'

class Thumbnails {
  constructor(player, options) {
    this.player = player
    this.settings = {}
    this.moveOnProgressControl = this.moveOnProgressControl.bind(this)
    this.moveCancel = this.moveCancel.bind(this)

    this.initSettings(options)
    this.prepareUi()
    this.addFakeActivePseudoClass()
    this.installListeners()
  }

  getImageSrc(...options) {
    return Thumbnails.getOptionValueByKey('src', '', this.settings && this.settings.grid, options)
  }

  getPreloadSetting(...options) {
    return Thumbnails.getOptionValueByKey('preload', '', this.settings, options)
  }

  static getOptionValueByKey(key, defaultValue, mustHaveOptions, optionsList) {
    optionsList = Array.isArray(optionsList) ? optionsList : [optionsList]
    optionsList.push(mustHaveOptions)
    const found = optionsList.find(option => option && option[key])

    return (found && found[key]) || defaultValue
  }

  static validateConstructorSettings(options, isInited = true) {
    if (!_.isObject(options.grid)) {
      throw new Error('`options.grid` must be an object')
    }

    if (isInited) {
      if (!_.isFinite(options.grid.tileWidth)) {
        throw new Error('`options.grid.tileWidth` must be a number')
      }

      if (!_.isFinite(options.grid.tileHeight)) {
        throw new Error('`options.grid.tileHeight` must be a number')
      }
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

  parseLeftToRightTileAllocation(options) {
    if (!_.isObject(options.grid)) {
      return []
    }

    const { grid } = options

    let { leftToRightAllocation } = options.grid
    if (!Array.isArray(leftToRightAllocation)) {
      leftToRightAllocation = [leftToRightAllocation]
    }

    const tileSettings = []

    leftToRightAllocation.forEach((allocation, index) => {
      if (!_.isObject(allocation)) {
        return
      }

      if (!_.isFinite(allocation.columnNumber)) {
        throw new Error(`\`leftToRightAllocation[${index}].columnNumber\` must be an number`)
      }

      if (!_.isFinite(allocation.rowNumber)) {
        throw new Error(`\`leftToRightAllocation[${index}].rowNumber\` must be an number`)
      }

      if (!_.isFinite(allocation.interval)) {
        throw new Error(`\`leftToRightAllocation[${index}].interval\` must be an number`)
      }

      const { columnNumber, rowNumber, interval } = allocation
      const src = this.getImageSrc(allocation, grid)

      let startPosition = (allocation.startPosition || 0) - interval


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
    })

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
    const imageSrc = this.getImageSrc()

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

  mergeOptions(options, isInited) {
    Thumbnails.validateConstructorSettings(options, isInited)

    let validatedOptions = options

    const tileSettings = this.parseLeftToRightTileAllocation(options)
    if (tileSettings.length) {
      const newOptions = {
        grid: {
          tileSettings,
        },
      }

      validatedOptions = Thumbnails.mergeSettings(validatedOptions, newOptions)
    }

    validatedOptions.grid.tileSettings.forEach((tileSetting) => {
      if (!tileSetting.src) {
        tileSetting.src = this.getImageSrc()
      }
    })

    this.settings = Thumbnails.mergeSettings(this.settings, validatedOptions)

    Thumbnails.validateTileSettings(this.settings)

    this.settings.grid.tileSettings.sort((a, b) => a.position - b.position)
  }

  initSettings(options) {
    this.mergeOptions(options, true)
  }

  updateOptions(options, controlUpdatingBehavior) {
    if (_.isObject(controlUpdatingBehavior)) {
      if (controlUpdatingBehavior.resetTileSettings) {
        this.settings.grid.tileSettings = []
      }
    }

    this.mergeOptions(options, false)
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

  setTileContainerActive(isActive) {
    if (isActive) {
      this.tileContainer.classList.add('active')
    }
    else {
      this.tileContainer.classList.remove('active')
    }
  }

  moveTileContainerBackground(currentTile) {
    const imageSrc = this.getImageSrc(currentTile)
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
    left -= progressControl.el().getBoundingClientRect().left + pageXOffset

    // apply updated styles to the thumbnail if necessary
    // mouseTime is the position of the mouse along the progress control bar
    mouseTime = Math.floor(
      (
        left / progressControl.width()
        // eslint-disable-next-line
      ) * this.player.duration()
    )

    const [tileIndex] = binarySearchRange(
      this.settings.grid.tileSettings,
      mouseTime,
      (list, index) => list[index].position,
    )

    if (tileIndex !== null) {
      this.setTileContainerActive(true)
      this.moveTileContainerBackground(this.settings.grid.tileSettings[tileIndex])
    }
    else {
      this.setTileContainerActive(false)
    }

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

const registerPlugin = videojs.registerPlugin || videojs.plugin
/**
 * register the thubmnails plugin
 */
registerPlugin.call(videojs, 'thumbnails', function thumbnails(options) {
  const thumbnailInstance = new Thumbnails(this, options)

  videojs.thumbnails = {
    updateOptions: thumbnailInstance.updateOptions.bind(thumbnailInstance),
  }
})
