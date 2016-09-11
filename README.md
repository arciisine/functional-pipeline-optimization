**Running**

* Install NodeJS v 6.0.0 or later
* `npm install`
* `./build.sh`
* `node dist/src/test/basic`

**Research**

* Determine comprehensive baseline
* Collect metrics
    * Platforms (node/v8, firefox/spidermonkey, safari, chrome, Edge/chakra, IE 11)
    * Perhaps build a benchmark site that can record
        * browser
        * code version
        * Timings against a baseline
* Write Thesis
    * Research related material
    * Write it out

**Coding Tasks**
* Handle Closed Variables
    * Differentiate closed variables from non-local functions in Analysis (right now mingled)
* Calculate Access Levels
    * Allow User to set minimum threshold for access level (defaults to no external dependences)
    * Apply access level verification
    * Set via pragma
* Look for more performance enhancements
    * Look for way of inlining nested chains (must assume array)
    * If all operations are inline, compile immediately (must assume array) 

**Refactoring**

* Variable Visitor
    * Move it to core?