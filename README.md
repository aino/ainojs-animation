Animate
------

Simple tool for animating from one value to another using requestframe

Usage:

    var animation = Animate(elem, options)

Options:

- from (0) - start value
- to (0) - to value
- threshold (1) - margin for when the animation can safely stop
- easing (function) - easing function (use ainojs-easing)
- step (function) - callback for each frame, arguments: value, factor (0-1)
- complete (function) - callback for when animation is complete
- duration (400) - duration in ms

Api:

- stop() - stops the animation
- stop(true) - stops the animation and finnish immediately