**Running**

* Install NodeJS v 6.0.0 or later
* `npm install`
* `./build.sh`
* `node dist/src/test/basic`

**Outstanding Tasks**

* Handle Object Patterns and Spread Elements
    * Need a cohesive story for visiting and for marking as read/declare/write/invoke
* Handle Closed Variables
    * Differentiate closed variables from non-local functions in Analysis (right now mingled)
    * Safe whitelist
* Calculate Access Levels
    * Allow User to set minimum threshold for access level (defaults to no external dependences)
    * Apply access level verification