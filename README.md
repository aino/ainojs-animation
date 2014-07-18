Animation
=========

Microtool for animating multiple values using requestAnimationFrame. This does not do any parsing or modification of DOM nodes or styles, it simply animates values.

Installation:
-------------

Using npm:

    npm install ainojs-animation

In the browser:

- Download a release at https://github.com/aino/ainojs-animation/releases
- Include the compiled file: ``<script src="ainojs-animation/dist/ainojs-animation.min.js"></script>``

Usage example:
--------------

    var animation = new Animation({
      duration: 2000 // two seconds
    })

    var node = document.getElementById('foo')

    animation.on('frame', function(e) {
      node.style.left = e.values.left,
      node.style.top = e.values.top
    })

    animation.init({
      top: 100,
      left: 0
    })

    animation.animateTo({
      top: 200,
      left: 400
    })

React usage example:
--------------------

    var App = React.createClass({

      getInitialState: function() {
        return { left: 0, top: 100 }
      },

      componentWillMount: function() {
        this.animation = new Animation({
          duration: 2000 // two seconds
        })
        this.animation.on('frame', this.onFrame)
        this.animation.init(this.state)
      },

      onFrame: function(e) {
        this.setState(e.values)
      },

      componentDidMount: function() {
        this.animation.animateTo({
          top: 200,
          left: 400
        })
      },

      render: function() {
        var style = {
          width: 100,
          height: 100,
          position: 'absolute',
          left: this.state.left,
          top: this.state.top,
          background: '#000'
        }
        return (
          <div style={style} />
        )
      }
    })

    React.renderComponent(App(), document.body)

Methods:
--------
    
    animation.init(initialValues)    // sets initial values
    animation.animateTo(values)      // starts the animation starting from current values
    animation.pause()                // pauses the animation
    animation.resume()               // resumes the animation after pause
    animation.end()                  // stops and force completes the animation
    animation.updateTo(newValues)    // updates the destinations while animating (within the same timeline)
    animation.isAnimating()          // returns true/false if the animation is running
    animation.destroy()              // kill animation and clear memory

Static Methods:
---------------

    Animation.cleanUp()  // destroys all animations and clears memory

Animation implemenets the ainojs-events interface. Example:
  
    // callback for each frame:
    animation.on('frame', function(e) {
      console.log(e.values) // animation values
    })

    // callback for animation complete:
    animation.on('complete', function() {
      // animation is complete
    })

The object passed into ``animation.init()`` will be mutated in the animation. 
You can use that to retrieve the values in another callback, F.ex:

    var obj = { left: 0 }
    var animation = new Animation()
    animation.init(obj).animateTo({ left:100 })
    setTimeout(function() {
      console.log(obj)
    },100)

Events:
-------

- frame - triggers every frame. Event properties: *values*
- complete - triggers when animation is complete.

Options:
--------

- easing (function) - easing function (use ainojs-easing)
- duration (400) - duration in ms
- repeat (false) - repeats the animation in a loop
- yoyo (false) - loops the animation back & forth
- delay (0) - ms of delay before the animation starts. If it is looped, the delay will be applied on each loop.
