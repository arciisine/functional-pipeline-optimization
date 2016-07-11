**Running**

* Install NodeJS v 6.0.0 or later
* `npm install`
* `./build.sh`
* `node dist/src/test/basic`

**Outstanding Tasks**
* Bootstrapping
    * Figure out how to bootstrap config globally
* Handle Closed Variables
    * Pass in arguments as a context object 
        * This context
        * Reduce's init value
        * Original function
    * Differentiate closed variables from non-local functions in Analysis (right now mingled)
* Id management
    * Handle assignment patterns instead of just literals
* Chain
    * Handle closed functions by invoking call to original fn, vs discarding chain
* Calculate Access Levels
    * Allow User to set minimum threshold for access level (defaults to no external dependences)
    * Apply access level verification