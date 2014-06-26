var detect = require('ainojs-detect')

// shortcuts
var document = window.document,
    abs = Math.abs,
    comp = window.getComputedStyle,
    html = document.documentElement

// short event bindings
var bind = function(elem, type, handler) {
  elem.addEventListener(type, handler, false)
}
var unbind = function(elem, type, handler) {
  elem.removeEventListener(type, handler, false)
}

var tracker = []

var getWidth = function(elem) {

  var w = Math.ceil( ("getBoundingClientRect" in elem) ?
    elem.getBoundingClientRect().width :
    elem.offsetWidth )

  if ( !w && comp )
    w = comp(elem, null).width.replace('px','')

  return w
}

// request animation shim
var requestFrame = (function(){
  var r = 'RequestAnimationFrame'
  return window.requestAnimationFrame ||
         window['webkit'+r] ||
         window['moz'+r] ||
         window['o'+r] ||
         window['ms'+r] ||
         function( callback ) {
           window.setTimeout(callback, 1000 / 60)
         }
}())

///

var Finger = function(elem, options) {

  // test for basic js support
  if ( !document.addEventListener || !Array.prototype.forEach )  {
    return
  }

  if ( !(this instanceof Finger) )
    return new Finger(elem, options)

  // default options
  this.config = {
    start: 0,
    duration: 340,
    onchange: function() {},
    oncomplete: function() {},
    easing: function(x,t,b,c,d) {
      return -c * ((t=t/d-1)*t*t*t - 1) + b // easeOutQuart
    },
    bounceEasing: function (x, t, b, c, d, s) {
      if (s == undefined) s = 2.0158;
      return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
    }
  }

  if ( !elem.firstChild ) {
    return
  }

  var self = this

  // extend options
  if ( options ) {
    for(var key in options) {
      this.config[key] = options[key]
    }
  }

  this.elem = elem
  this.child = elem.firstChild
  this.to = this.pos = 0
  this.touching = false
  this.start = {}
  this.index = this.config.start
  this.anim = 0

  if ( !detect.translate3d ) {
    this.child.style.position = 'absolute'
    this.elem.style.position = 'relative'
  }

  // Bind event handlers to context
  ;['ontouchstart','ontouchmove','ontouchend','setup'].forEach(function(fn) {
    self[fn] = (function(caller) {
      return function() {
        caller.apply( self, arguments )
      }
    }(self[fn]))
  })

  // the physical animator
  this.setX = function() {

    var style = self.child.style

    if (!detect.translate3d) {
      // this is actually faster than CSS3 translate
      return style.left = self.pos+'px'
    }
    return style.MozTransform = style.msTransform = style.transform = style.webkitTransform = 'translate3d(' + self.pos + 'px,0,0)'
  }

  // bind events
  bind(elem, 'touchstart', this.ontouchstart)
  bind(window, 'resize', this.setup)
  bind(window, 'orientationchange', this.setup)

  // set up width
  this.setup()

}

Finger.prototype = {

  constructor: Finger,

  setup: function() {
    this.width = getWidth( this.elem )
    this.length = Math.ceil( getWidth(this.child) / this.width )
    if ( this.index !== 0 ) {
      this.index = Math.max(0, Math.min( this.index, this.length-1 ) )
      this.pos = this.to = -this.width*this.index
    }
  },

  ontouchstart: function(e) {

    var touch = e.touches

    this.start = {
      pageX: touch[0].pageX,
      pageY: touch[0].pageY,
      time:  +new Date(),
      pos:   this.pos || 0
    }

    this.isScrolling = null
    this.touching = true
    this.deltaX = 0

    bind(document, 'touchmove', this.ontouchmove)
    bind(document, 'touchend', this.ontouchend)

    this.loop()
  },

  ontouchmove: function(e) {

    var touch = e.touches

    // ensure swiping with one touch and not pinching
    if( touch && touch.length > 1 || e.scale && e.scale !== 1 ) return

    this.deltaX = touch[0].pageX - this.start.pageX

    // determine if scrolling test has run - one time test
    if ( this.isScrolling === null ) {
      this.isScrolling = !!(
        this.isScrolling ||
        abs(this.deltaX) < abs(touch[0].pageY - this.start.pageY)
      )
    }

    // if user is not trying to scroll vertically
    if (!this.isScrolling) {

      // prevent native scrolling
      e.preventDefault()

      // increase resistance if first or last slide
      this.deltaX /= ( (!this.index && this.deltaX > 0 || this.index == this.length - 1 && this.deltaX < 0 ) ?
         ( abs(this.deltaX) / this.width + 1.8 )  : 1 )
      this.to = this.deltaX - this.index * this.width

      // track the valocity
      var touch = e.touches

      tracker.push({
        pageX: touch[0].pageX - this.start.pageX,
        time: +new Date() - this.start.time
      })

      tracker = tracker.slice(-5)
    }

    e.stopPropagation()
  },

  ontouchend: function(e) {

    this.touching = false

    // determine if slide attempt triggers next/prev slide
    var isValidSlide = +new Date() - this.start.time < 250 &&
          abs(this.deltaX) > 40 ||
          abs(this.deltaX) > this.width/2,

        isPastBounds = !this.index && this.deltaX > 0 ||
          this.index == this.length - 1 && this.deltaX < 0

    // if not scrolling vertically
    if ( !this.isScrolling ) {
      this.show( this.index + ( isValidSlide && !isPastBounds ? (this.deltaX < 0 ? 1 : -1) : 0 ) )
    }

    unbind(document, 'touchmove', this.ontouchmove)
    unbind(document, 'touchend', this.ontouchend)
  },

  show: function( index ) {
    if ( index != this.index ) {
      this.config.onchange.call(this, index)
    }
    this.to = -( index*this.width )
    this.index = index
  },

  loop: function() {

    var distance = this.to - this.pos
    var loop = true

    // if distance is short or the user is touching, do a 1-1 animation
    if ( this.touching || abs(distance) <= 1 ) {
      this.pos = this.to
      if ( this.anim ) {
        this.config.oncomplete( this.index )
        loop = false
      }
      this.anim = 0
    } else {
        if ( !this.anim ) {

            // save animation parameters
            // extract velocity first
            var velocity = 0.6
            var last = tracker[tracker.length-1]
            var travel = (last.pageX - tracker[0].pageX)
            velocity = travel / (last.time - tracker[0].time)
            tracker = []

            // detect bounce
            var isEdge = abs(this.start.pos) == abs(this.index*this.width)
            var bounce = !isEdge && abs(velocity) > 2.3 && abs(travel) / this.width > 0.3

            this.anim = { 
              position: this.pos, 
              distance: distance,
              time: +new Date(), 
              duration: this.config.duration, 
              isEdge: isEdge,
              easing: bounce ? this.config.bounceEasing : this.config.easing
            }
        }
        // apply easing
        this.pos = this.anim.easing(null, +new Date() - this.anim.time, this.anim.position, this.anim.distance, this.anim.duration)

    }
    this.setX()
    if ( loop )
      requestFrame(this.loop.bind(this))
  }
}

module.exports = Finger