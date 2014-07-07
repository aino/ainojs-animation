
var requestFrame = require('ainojs-requestframe')
var EventMixin = require('ainojs-events')

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

  for ( var prop in options )
    this.config[prop] = options[prop]

  this.value = this.config.from
  this.distance = this.config.to - this.value
  this.timer = 0
  this.pausedAt = 0
}

EventMixin.call(Animation.prototype)

Animation.prototype.start = function() {
  if ( this.isRunning )
    return
  this.isRunning = true
  this.timer = +new Date()
  this.tick()
}

Animation.prototype.tick = function() {

  if ( !this.isRunning )
    return

  var elapsed = +new Date() - this.timer + this.pausedAt

  var noDistance = Math.abs( this.config.to-this.value ) <= Math.min( 1, Math.abs(this.config.to-this.config.from)/1000 )

  if ( elapsed > this.config.duration || noDistance )
    return this.end()

  this.value = this.config.easing(null, elapsed, this.config.from, this.distance, this.config.duration)
  this.trigger('frame', {
    value: this.value,
    factor: (this.value-this.config.from)/this.distance
  })

  requestFrame(this.tick.bind(this))

  return this
}

Animation.prototype.stop = function() {
  this.pausedAt += +new Date() - this.timer
  this.isRunning = false
}

Animation.prototype.update = function(to) {
  // TODO
}

Animation.prototype.end = function() {
  this.trigger('frame', {
    value: this.config.to,
    factor: 1
  })
  this.trigger('complete')
  this.isRunning = false
  this.pausedAt = 0
  this.value = this.config.from
  return this
}

module.exports = Animation