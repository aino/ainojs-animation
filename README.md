Animation
----------

Simple tool for animating from one value to another using requestframe

Usage:

    var animation = new Animation(options)

Methods:
  
    animation.start()
    animation.stop() // pauses the animation. Use .start() again to continue
    animation.end() // stops and force completes the animation

Animation implemenets the ainojs-events interface. Example:
  
    // callback for each frame:
    animation.on('frame', function(e) {
      console.log(e.value) // animation value
      console.log(e.factor) // decimal value from 0-1
    })

    // callback for animation complete:
    animation.on('complete', function() {
      // animation is complete
    })

Events:

- frame - triggers every frame. Event object: *value* and *factor*
- complete - triggers when animation is complete.

Options:

- from (0) - start value
- to (1) - end value
- easing (function) - easing function (use ainojs-easing)
- duration (400) - duration in ms