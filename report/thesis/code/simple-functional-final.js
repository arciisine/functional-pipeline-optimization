function simple(specialFilter) {
  this.limit = 4;
  let count = 0;

  var __thisId = this;

  EXEC(
    [1,2,3]/* target*/,
    '__key_RANDOM_UUID', /* callsite id */,
    __operators__UUID,
    [ /* Chain inputs */
      [function __uuid1(x) { return  x * 2 }],
      [function __uuid2(x) { return x > __thisId.limit }]
      [function __uuid3(x,i) {
        count += 1
        return Math.pow(x, i+1)
      }],
      [specialFilter]
    ], 
    [__thisId, count], /* List of all closed variables */
    (__randomId) => { count = __randomId } /* Closure reassignment*/
  )
}


//Operators and flag to indicate inline vs static vs dynamic
var __operators__UUID = [
  ['map', 0],
  ['filter', 0],
  ['map', 0],
  ['filter', 1]
]