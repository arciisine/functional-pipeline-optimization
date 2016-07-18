**Running**

* Install NodeJS v 6.0.0 or later
* `npm install`
* `./build.sh`
* `node dist/src/test/basic`

**Outstanding Tasks**

* Handle Closed Variables
    * Differentiate closed variables from non-local functions in Analysis (right now mingled)
    * Allow whitelist via pragma
* Calculate Access Levels
    * Allow User to set minimum threshold for access level (defaults to no external dependences)
    * Apply access level verification
* Look for more performance enhancements