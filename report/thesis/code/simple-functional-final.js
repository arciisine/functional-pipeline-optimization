function simple(specialFilter) {
  this.limit = 4;
  let count = 0;

  var __thisId = this;

  EXEC(
    [1,2,3]/* target*/,
    '__key_RANDOM_UUID', /* callsite id */,
    [  /* Chain operations  */
      'map',
      'filter',
      'map',
      'filter'
    ],
    [ /* Chain inputs */
      [function __inline_1(x) { return  x * 2 }],
      [function __inline_2(x) { return x > __thisId.limit }]
      [function __inline_3(x,i) {
        count += 1
        return Math.pow(x, i+1)
      }],
      [specialFilter]
    ], 
    [ /* Indicate if any chain functions were passed in as variables */
      false,
      false,
      false,
      true
    ],
    [__thisId, count], /* List of all closed variables */
    (__randomId) => { count = __randomId } /* Closure reassignment*/
  )
}