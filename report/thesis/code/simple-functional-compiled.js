function __compiled(data, context, closed) {
  let __thisId = closed[0], count = closed[1];
  let __pos_1 = 0;
  let __pos_2 = 0;
  let out = [];
  let specialFilter = context[3][0];
  let specialFilterObject = context[3][1];

  fullLoop:
  for (let i = 0; i < data.length; i++) {
    let el = data[i];
    el = el * 2;
    if (!(el > __thisId.limit)) continue fullLoop;
    count += 1;
    el = Math.pow(el, __pos_1);
    __pos_1 ++;
    if (!(specialFilter.call(specialFilterObject, el, __pos_2))) continue fullLoop;
    __pos_2++;
    out.push(el);
  }
  return {
    value : out,
    assigned : [count] 
  }
}