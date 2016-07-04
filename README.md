**Running**

* Install NodeJS v 6.0.0 or later
* `npm install`
* `./build.sh`
* `node dist/src/test/basic`

**Outstanding Tasks**

* Handle Closed Variables
    * This context
    * Reduce's init value
    * Any allowed variables from the scope
* Calculate Access Levels
    * Allow User to set minimum threshold for access level (defaults to no external dependences)
    * Apply access level verification
* Chained Call Analysis 
    * Find expression ranges for `arr.filter().map().filter().reduce()...`
    * Collect available globals per filter
    * Assign globals on inbound
    * Restore globals on outbound
    * Do an `Array.isArray` check at runtime to determine if we should run the code
    * If the input to `reduce` is an Array literal, consider allowing chaining of self