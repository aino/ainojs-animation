!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Animate=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

var requestFrame = _dereq_('ainojs-requestframe')

module.exports = function(options) {

  var defaults = {
    from: 0,
    to: 0,
    threshold: 1,
    easing: function(x,t,b,c,d) {
      return -c * ((t=t/d-1)*t*t*t - 1) + b // easeOutQuart
    },
    step: function(){},
    complete: function(){},
    duration: 400
  }

  for( var i in defaults ) {
    if ( !options.hasOwnProperty(i) )
      options[ i ] = defaults[ i ]
  }

  var animation = {
    isCanceled: false,
    value: options.from,
    loop: function() {
      var self = this,
          distance = options.to - this.value

      if ( !this.hasOwnProperty('distance') )
        this.distance = distance

      this.start = this.start || +new Date()

      var elapsed = +new Date() - this.start
      if ( elapsed > options.duration || Math.abs( distance ) <= options.threshold )
        return this.stop( true )

      this.value = options.easing(null, +new Date() - this.start, options.from, this.distance, options.duration)
      this.factor = (this.value-options.from)/this.distance;

      options.step.call(this, this.value, this.factor)
      if ( !this.isCanceled ) {
        requestFrame( function() {
          animation.loop.call(self)
        });
      }
      return this
    },
    stop: function( finish ) {
      this.isCanceled = true
      if ( finish ) {
        animation.value = options.to
        options.step.call(this, options.to, 1)
      }
      options.complete.call(animation)
      return this
    }
  }
  return animation.loop()
}
},{"ainojs-requestframe":2}],2:[function(_dereq_,module,exports){
module.exports = (function(){
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
},{}]},{},[1])
(1)
});