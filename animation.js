
var requestFrame = require('ainojs-requestframe')
var EventMixin = require('ainojs-events')

// util for current timestamp
var now = function() {
  return +new Date()
}

// util for checking threshold
var checkDistance = function(anim) {
  return Math.abs( anim.to-anim.value ) <= Math.min( 1, Math.abs(anim.to-anim.from)/1000 )
}

var Animation = function(options) {

  options = options || {}

  this.config = {
    easing: function(x,t,b,c,d) {
      return -c * ((t=t/d-1)*t*t*t - 1) + b // easeOutQuart
    },
    duration: 400
  }

  for (var i in options)
    this.config[i] = options[i]

  this.animations = {}
  this.obj = {}
  this.timer = 0
  this.elapsed = 0
  this.duration = this.config.duration
  return this
}

var proto = Animation.prototype

EventMixin.call(proto)

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
  return this
}

proto.animateTo = function(destinationValues) {

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
  this.tick()
  return this
}

proto.tick = function() {

  if ( !this.isRunning )
    return

  this.elapsed += now() - this.timer
  this.timer = now()

  var noDistance = false
  for (var i in this.animations) {
    if ( checkDistance(this.animations[i]) ) {
      noDistance = true
      break
    }
  }

  if ( this.elapsed > this.duration || noDistance )
    return this.end()

  for ( var i in this.animations ) {
    var a = this.animations[i]
    a.value = this.config.easing(null, this.elapsed, a.from, a.distance, this.duration)
    this.obj[i] = a.value
  }

  this.trigger('frame', {
    values: this.obj
  })

  requestFrame(this.tick.bind(this))

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
  return this.tick()
}

proto.updateTo = function(destinationValues) {
  this.duration -= this.elapsed
  if ( this.duraton > 0 )
    this.animateTo(destinationValues)
  return this
}

proto.end = function() {
  this.trigger('frame', {
    values: this.obj
  })
  this.trigger('complete')
  this.isRunning = false
  this.duration = this.config.duration
  return this
}

module.exports = Animation