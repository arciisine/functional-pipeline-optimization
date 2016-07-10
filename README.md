**Running**

* Install NodeJS v 6.0.0 or later
* `npm install`
* `./build.sh`
* `node dist/src/test/basic`

**Outstanding Tasks**
* Bootstrapping
    * Figure out how to bootstrap config globally
* Handle Closed Variables
    * This context
    * Reduce's init value
* Calculate Access Levels
    * Allow User to set minimum threshold for access level (defaults to no external dependences)
    * Apply access level verification
* Chained Call Analysis 
    * Collect available globals per filter
    * If the input to `reduce` is an Array literal, consider allowing chaining of self