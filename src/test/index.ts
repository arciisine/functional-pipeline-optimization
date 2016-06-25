let data:number[] = null
function getData() {
  if (data) return data;
  
  data = []
  for (let i = 0; i < 100000; i++) {
    data.push(parseInt('' + (Math.random() * 255)));
  }
  return data
}

function test(...tests:((nums:number[])=>void)[]) {
  let counts = {};
  tests.forEach(t => counts[t.name] = []);

  let time = 0;
  let data = getData();

  for (let i = 0; i < 100; i++) {
    let op = tests[parseInt(Math.random()*tests.length as any)];
    time = Date.now()
    op(data)
    counts[op.name].push(Date.now() - time);
  }
  let out:{[key:string]:{min:number,max:number,n:number,avg:number}} = {};
  tests.forEach(k => {
    out[k.name] = {
      min : Math.min.apply(null, counts[k.name]),
      max : Math.max.apply(null, counts[k.name]),
      n : counts[k.name].length,
      avg : counts[k.name].reduce((acc, v) => acc+v, 0)/counts[k.name].length
    }
  });
  return out;
}

function log(title, o){
  console.log(title)
  console.log('='.repeat(20)) 
  console.log(JSON.stringify(o, null, 2))
  console.log()
}

export function doTest(...tests:((nums:number[])=>void)[]) {
  let out:any[][] = [];
  tests.forEach(t => {
    out.push([`All ${t.name}`, test(t)])
  })
  out.push(['Mixed', test(...tests)]);

  out.forEach(p => {
    log(p[0], p[1]);
  })

  for (let i = 1; i < tests.length; i++) {
    let a = tests[i-1](data)[0];
    let b = tests[i](data)[0];

    let eq = areEqual(a,b); 
    if (!eq) {
      console.log(a);
      console.log("===============")
      console.log(b);
    }
    console.log(eq);
  }
} 

function areEqual(a, b):boolean {
  if (typeof a !== typeof b) {
    return false;
  }
  switch (typeof a) {
    case 'string':
      return a === b
    case 'number':
      return a === b;
    case 'function':
      return areEqual(a.toString(), b.toString());
    default:
      if (Array.isArray(a)) {
        if (!Array.isArray(b) || !(a.length === b.length)) {
          return false;
        }
        let res = true;
        for (let i = 0; res && i < a.length; i++) {
          res = res && areEqual(a[i], b[i]);
        }
        return res;
      } else { //Object
        let keys = Object.keys(a);
        let bkeys = Object.keys(b);
        if (!areEqual(keys, bkeys)) {
          return false;
        }
        let res = true;
        for (let i = 0; i < keys.length; i++) {
          res = res && areEqual(a[keys[i]], b[keys[i]])
        }
        return res;
      }       
  }
}