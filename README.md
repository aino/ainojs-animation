Animation
----------

Simple tool for animating from one value to another using requestframe

Usage:

    var animation = new Animation(options)

Methods:
  
    animation.animateTo(value) // starts the animation based on current value or initialValue
    animation.pause()          // pauses the animation
    animation.resume()         // resumes the animation after pause
    animation.end()            // stops and force completes the animation
    animation.updateTo(value)  // updates the destination while animating (within the same timeline)
    animation.isAnimating()    // returns true/false if the animation is running

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

- initialValue (0) - initial starting value for the animation value
- easing (function) - easing function (use ainojs-easing)
- duration (400) - duration in ms