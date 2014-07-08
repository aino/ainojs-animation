
var requestFrame = require('ainojs-requestframe')
var EventMixin = require('ainojs-events')

var extend = function(obj, mix) {
  for ( var prop in mix )
    obj[prop] = mix[prop]
}

var Animation = function(options) {

  options = options || {}

  this.config = {
    from: 0,
    to: 1,
    easing: function(x,t,b,c,d) {
      return -c * ((t=t/d-1)*t*t*t - 1) + b // easeOutQuart
    },
    duration: 400
  }

  extend(this.config, options)

  this.params = {}
  this.value = this.config.from
  this.distance = this.config.to - this.value
  this.timer = 0
  this.pausedAt = 0
}

EventMixin.call(Animation.prototype)

Animation.prototype.start = function() {

  if ( this.isRunning )
    return

  // copy configs into params to allow run-time changes (if not resuming from pause)
  if ( !this.pausedAt ) {
    extend( this.params, this.config )
    this.distance = this.config.to - this.config.from
  }

  this.isRunning = true
  this.timer = +new Date()
  this.tick()
  return this
}

Animation.prototype.tick = function() {

  if ( !this.isRunning )
    return

  var elapsed = +new Date() - this.timer + this.pausedAt

  var noDistance = Math.abs( this.params.to-this.value ) <= Math.min( 1, Math.abs(this.params.to-this.params.from)/1000 )

  if ( elapsed > this.params.duration || noDistance )
    return this.end()

  this.value = this.params.easing(null, elapsed, this.params.from, this.distance, this.params.duration)
  this.trigger('frame', {
    value: this.value,
    factor: (this.value-this.params.from)/this.distance
  })

  requestFrame(this.tick.bind(this))

  return this
}

Animation.prototype.isAnimating = function() {
  return !!this.isRunning
}

Animation.prototype.stop = function() {
  this.pausedAt += +new Date() - this.timer
  this.isRunning = false
  return this
}

Animation.prototype.updateTo = function(to) {
  extend(this.params, {
    from: this.value,
    to: to,
    duration: this.params.duration - (+new Date() - this.timer + this.pausedAt)
  })
  this.distance = to - this.value
  this.timer = +new Date()
  this.pausedAt = 0
  return this
}

Animation.prototype.end = function() {
  this.trigger('frame', {
    value: this.params.to,
    factor: 1
  })
  this.trigger('complete')
  this.isRunning = false
  this.pausedAt = 0
  this.value = this.params.from
  return this
}

module.exports = Animation