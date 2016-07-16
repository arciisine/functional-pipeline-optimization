**Running**

* Install NodeJS v 6.0.0 or later
* `npm install`
* `./build.sh`
* `node dist/src/test/basic`

**Outstanding Tasks**

* Handle Closed Variables
    * Differentiate closed variables from non-local functions in Analysis (right now mingled)
* Handle Object Patterns and Spread Elements
    * Need a cohesive story for visiting and for marking
* Properly identify function context in chain  
    * When aliasing the context, make sure to have the properly defined context
* Chain
    * Handle closed functions by invoking call to original fn, vs discarding chain
* Calculate Access Levels
    * Allow User to set minimum threshold for access level (defaults to no external dependences)
    * Apply access level verification
* Ensure generated code is ES5 compliant