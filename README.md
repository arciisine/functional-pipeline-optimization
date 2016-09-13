**Running**

* Install NodeJS v 6.0.0 or later
* `npm install`
* `./build.sh`
* `npm run eval:gnuplot impl.evaluate.loader [scenario] [inputSize range]x[iterations range]`

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