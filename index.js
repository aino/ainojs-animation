var requestFrame = require('raf')
var EventMixin = require('ainojs-events')

var now = function() { return +new Date() }
var noop = function() {}
var document = window.document

// detect prefix for CSS helper
var getPrefix = function() {
  if ( this.prefix )
    return this.prefix
  if ( !document.body )
    return null
  var el = document.createElement('i')
  el.style.position = 'absolute'
  var has3d
  var transforms = {
    'MozTransform':'-moz-transform',
    'transform':'transform',
    'webkitTransform':'-webkit-transform',
    'msTransform':'-ms-transform',
    'OTransform':'-o-transform'
  }
  document.body.appendChild(el, null)
  for (var t in transforms) {
    if ( typeof el.style[t] != 'undefined' ) {
      el.style[t] = 'translate3d(1px,1px,1px)'
      has3d = window.getComputedStyle(el).getPropertyValue(transforms[t])
      if (has3d !== undefined && has3d.length > 0 && has3d !== "none") {
        this.prefix = t
        break
      }
    }
  }
  document.body.removeChild(el)
  return this.prefix || null
}

// collect animations
var isSleeping = true
var sleep = function() { isSleeping = true }
var tickers = []
var tick = function() {
  var willTick = false
  var n = now()
  tickers.forEach(function(anim, i) {
    if ( anim.isRunning ) {
      willTick = true
      anim.elapsed += n - anim.timer
      anim.timer = n
      if ( anim.elapsed > anim.duration )
        return anim.end()
      anim.eachAnims(function(a, i) {
        a.value = anim.obj[i] = anim.config.easing(null, anim.elapsed, a.from, a.distance, anim.duration)
      })
      anim.trigger('frame', {
        values: anim.obj
      })
    }
  })
  if( willTick ) {
    isSleeping = false
    requestFrame(tick)
  } else 
    sleep()
}
var wake = function() { isSleeping && tick() }

// constructor

var Animation = function(options) {

  options = options || {}

  this.config = {
    easing: function(x,t,b,c,d) {
      return -c * ((t=t/d-1)*t*t*t - 1) + b // easeOutQuart
    },
    duration: 400,
    delay: 0,
    repeat: false,
    yoyo: false
  }

  this.setOptions(options)

  this.uid = Math.round(Math.random()*Math.pow(9,9))

  this.animations = {}
  this.obj = {}
  this.timer = 0
  this.elapsed = 0
  this.duration = this.config.duration
  this.intialized = false

  // events interface mixin
  EventMixin.call(this)

  return this
}

var proto = Animation.prototype

proto.setOptions = function(options) {
  for (var i in options)
    this.config[i] = options[i]
  if ( options.duration && !this.isRunning )
    this.duration = options.duration
}

proto.eachAnims = function(fn) {
  for( var i in this.animations )
    fn.call(this, this.animations[i], i)
},

proto.init = function(initialValues) {
  if ( this.intialized )
    return
  this.intialized = true
  for (var i in initialValues) {
    if ( typeof this.animations[i] != 'object' )
      this.animations[i] = { value: initialValues[i] }
  }
  this.obj = initialValues
  this.trigger('frame', {
    values: initialValues
  })
  this.isRunning = false
  tickers.push(this)
  return this
}

proto.moveTo = function(newValues) {
  for (var i in newValues) {
    var a = this.animations[i]
    if ( typeof a != 'undefined') {
      this.obj[i] = a.value = a.from = a.to = newValues[i]
      a.distance = 0
    }
  }
  if ( this.isRunning ) {
    this.trigger('complete')
    this.isRunning = false
    this.duration = this.config.duration
  }
  this.trigger('frame', {
    values: this.obj
  })
}

proto.animateTo = function(destinationValues, skipDelay) {

  if ( this.config.delay && !skipDelay && !this.isRunning ) {
    var args = [].slice.call(arguments).concat([true])
    setTimeout(function() {
      this.animateTo.apply(this, args)
    }.bind(this), this.config.delay)
    return
  }

  if ( typeof destinationValues == 'undefined' )
    throw 'No destination values'

  for (var i in destinationValues) {
    var a = this.animations[i]
    if ( typeof a == 'undefined')
      throw 'Animation "'+i+'" has not been initialized. Use animation.init() to set default values'
    a.from = a.value
    a.to = destinationValues[i]
    a.distance = a.to - a.value
  }

  this.isRunning = true
  this.timer = now()
  this.elapsed = 0
  wake()
  return this
}

proto.isAnimating = function() {
  return !!this.isRunning
}

proto.pause = function() {
  this.isRunning = false
  return this
}

proto.resume = function() {
  this.isRunning = true
  this.timer = now()
  wake()
  return this
}

proto.updateTo = function(destinationValues) {
  this.duration -= this.elapsed
  if ( this.duration > 0 )
    this.animateTo(destinationValues)
  return this
}

proto.end = function() {
  var end = {}
  this.eachAnims(function(a, i) {
    end[i] = a.to
  })
  this.trigger('frame', {
    values: end
  })
  this.trigger('complete')
  this.isRunning = false
  this.duration = this.config.duration
  if ( this.config.yoyo ) {
    var start = {}
    this.eachAnims(function(a, i) {
      start[i] = a.from
    })
    this.animateTo(start)
  } else if ( this.config.repeat ) {
    this.eachAnims(function(a, i) {
      this.obj[i] = a.value = a.from
    })
    this.animateTo(end)
  }

  return this
}

proto.destroy = function() {
  this.isRunning = false
  tickers.forEach(function(tick, i) {
    if ( this.uid === tick.uid )
      tickers.splice(i, 1)
  }.bind(this))
}

// static utils

// clears all animations
Animation.cleanUp = function() {
  tickers = []
}

// helper for simple animation
Animation.simple = function(from, to, options) {
  return new Animation(options)
    .init({val: from})
    .on('frame', function(e) {
      options.frame && options.frame.call(this, e.values.val)
    })
    .on('complete', function() {
      options.complete && options.complete.apply(this, arguments)
      this.destroy()
    })
    .animateTo({val: to})
}

// helper for creating optimized styles
Animation.optimizeCSS = function(obj) {

  var x, y

  if (obj.hasOwnProperty('top'))
    y = parseFloat(obj.top)

  if (obj.hasOwnProperty('left'))
    x = parseFloat(obj.left)

  if ( typeof x != 'number' || typeof y != 'number' )
    return

  obj[getPrefix()] = 'translate3d('+x+'px,'+y+'px,0)'
  delete obj.top
  delete obj.left

}

module.exports = Animation