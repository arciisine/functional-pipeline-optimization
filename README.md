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
* Calculate Transform Levels
    * Look for write dependences (function calls, assignments)
    * White list functions known to be pure (Globals, Math, String, etc)
    * Allow User to set minimum threshold for transform level (defaults to no external dependences)  
* Chained Call Analysis 
    * Find expression ranges for arr.filter().map().filter().reduce()....
    * Collect available globals per filter
    * Assign globals on inbound
    * Restore globals on outbound
    * Do an array.isarray check at runtime to determine if we should run the code