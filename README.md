**Running**

* Install NodeJS v 6.0.0 or later
* `npm install`
* `npm run rebuild`
* `npm run eval:console [path.to.loader] [scenario] [inputSize range]x[iterations range]`
* `npm run eval:gnuplot [path.to.loader] [scenario] [inputSize range]x[iterations range]`

**Research**

* Determine comprehensive baseline
    * CSV generator ?

**Coding Tasks**

* Calculate Access Levels
    * Allow User to set minimum threshold for access level (defaults to no external dependences)
    * Apply access level verification
    * Set via pragma
* Look for more performance enhancements
    * Look for way of inlining nested chains (must assume array)
    * If all operations are inline, compile immediately (must assume array) 
    * Allow for external optimizers (google-closure, etc.)
* Bugs
    * Rewrite needs to account for existing variables
       * Currently doing two passes (one with unique prefix, and one without)
       * Would like this to be a single pass

**Refactoring**

* Variable Visitor
    * Move it to core?