Animation
=========

Microtool for multiple animation values using requestAnimationFrame. This does not do any parsing or modification of DOM nodes or styles, it simply animates values.

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
    animation.getValues()            // retrieves the current values of the animation
    animation.isAnimating()          // returns true/false if the animation is running

Animation implemenets the ainojs-events interface. Example:
  
    // callback for each frame:
    animation.on('frame', function(e) {
      console.log(e.values) // animation values
    })

    // callback for animation complete:
    animation.on('complete', function() {
      // animation is complete
    })

Events:
-------

- frame - triggers every frame. Event object: *value* and *factor*
- complete - triggers when animation is complete.

Options:
--------

- easing (function) - easing function (use ainojs-easing)
- duration (400) - duration in ms
