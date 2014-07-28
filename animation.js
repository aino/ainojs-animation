
var requestFrame = require('ainojs-requestframe')
var EventMixin = require('ainojs-events')

// util for current timestamp
var now = function() {
  return +new Date()
}

// collect animations
var isSleeping = true
var sleep = function() {
  isSleeping = true
}
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

var wake = function() {
  isSleeping && tick()
}

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

  for (var i in options)
    this.config[i] = options[i]

  this.uid = Math.round(Math.random()*Math.pow(9,9))

  this.animations = {}
  this.obj = {}
  this.timer = 0
  this.elapsed = 0
  this.duration = this.config.duration
  this.kill = false

  // events interface mixin
  EventMixin.call(this)

  return this
}

var proto = Animation.prototype

proto.eachAnims = function(fn) {
  for( var i in this.animations )
    fn.call(this, this.animations[i], i)
},

proto.init = function(initialValues) {
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

Animation.cleanUp = function() {
  tickers = []
}

module.exports = Animation