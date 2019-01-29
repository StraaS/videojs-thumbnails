Video.js Thumbnails
===================
A plugin that allows you to configure thumbnails to display when the user is hovering over the progress bar or dragging it to seek.

[![Build Status](https://travis-ci.org/brightcove/videojs-thumbnails.svg?branch=master)](https://travis-ci.org/brightcove/videojs-thummbnails)


Using the Plugin
----------------
The plugin automatically registers itself when you include video.thumbnails.js in your page:

```html
<script src='videojs.thumbnails.js'></script>
```

You probably want to include the default stylesheet, too. It handles showing and hiding thumbnails while hovering over the progress bar and a quick animation during the transition:

```html
<link href="videojs.thumbnails.css" rel="stylesheet">
```

After calling "videojs" function to create the video, you can activate the thumbnail plugin by specifying the options which schema lists as follows:

```javascript
videojs.thumbnails({
  preload: true,
  grid: {
    src: "the url of image source",
    tileWidth: 100,
    tileHeight: 100,
    leftToRightAllocation: [{
      src: "this image source will override the parent's src property",
      columnNumber: 3,
      rowNumber: 3,
      interval: 5,
      startPosition: 0,
    }],
    tileSettings: [
      {
        position: 10,
        columnIndex: 0,
        rowIndex: 0
      }
    ]
  }
})
```

The src key of grid object is an URL pointing to an image that composed of small tile images to form a grid; each tile has the same width and height and can be accessed by the index of column and row.

To display the tile image at the correct time, specifying the position value which ranges from 0 to the video duration.

When the position of the cursor on the progress bar is equal to or greater than the position of the specific tile setting, that tile will display on the progress bar.

If the position of each tile has the same interval, and the order of tiles is from left to right, top to bottom, considering use "leftToRightAllocation" instead of specifying each tile option.

Assign the preload property to true will fetch all the image sources when the document is ready to improve the user experience, this is done by injecting link elements with "rel" attribute which assigned to "preload" value.

Reference:
https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content
