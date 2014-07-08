
var requestFrame = require('ainojs-requestframe')
var EventMixin = require('ainojs-events')

var now = function() {
  return +new Date()
}

var Animation = function(options) {

  options = options || {}

  this.config = {
    initialValue: 0,
    easing: function(x,t,b,c,d) {
      return -c * ((t=t/d-1)*t*t*t - 1) + b // easeOutQuart
    },
    duration: 400
  }

  for (var i in options)
    this.config[i] = options[i]

  this.from = this.value = this.config.initialValue
  this.timer = 0
  this.elapsed = 0
  this.duration = this.config.duration
}

EventMixin.call(Animation.prototype)

Animation.prototype.animateTo = function(to) {

  if ( this.isRunning && typeof to == 'undefined' )
    return

  this.from = this.value
  this.to = to

  this.distance = to - this.from

  this.isRunning = true
  this.timer = now()
  this.elapsed = 0
  this.tick()
  return this
}

Animation.prototype.tick = function() {

  if ( !this.isRunning )
    return

  this.elapsed += now() - this.timer
  this.timer = now()

  var noDistance = Math.abs( this.to-this.value ) <= Math.min( 1, Math.abs(this.to-this.from)/1000 )

  if ( this.elapsed > this.duration || noDistance )
    return this.end()

  this.value = this.config.easing(null, this.elapsed, this.from, this.distance, this.duration)

  this.trigger('frame', {
    value: this.value,
    factor: (this.value-this.from)/this.distance
  })

  requestFrame(this.tick.bind(this))

  return this
}

Animation.prototype.isAnimating = function() {
  return !!this.isRunning
}

Animation.prototype.pause = function() {
  this.isRunning = false
  return this
}

Animation.prototype.resume = function() {
  this.isRunning = true
  this.timer = now()
  return this.tick()
}

Animation.prototype.updateTo = function(to) {
  this.duration -= this.elapsed
  return this.animateTo(to)
}

Animation.prototype.end = function() {
  this.trigger('frame', {
    value: this.to,
    factor: 1
  })
  this.trigger('complete')
  this.isRunning = false
  this.duration = this.config.duration
  return this
}

module.exports = Animation