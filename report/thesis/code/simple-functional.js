function simple(specialFilter) {
  this.limit = 4;
  let count = 0;
  [1, 2, 3] //pipeline target
    .map(x => x * 2)  //pipeline start
    .filter(x => x > this.limit)
    .map((x, i) => {
      count++;
      return Math.pow(x, i + 1)
    })
    .filter(specialFilter) //pipeline end
}