let data:number[] = null
function getData() {
  if (data) return data;
  
  data = []
  for (let i = 0; i < 100000; i++) {
    data.push(parseInt('' + (Math.random() * 255)));
  }
  return data
}

function test(tests:{[key:string]:(nums:number[])=>void}) {
  let counts = {};
  let keys = Object.keys(tests);
  keys.forEach(t => counts[t] = []);

  let time = 0;
  let data = getData();

  for (let i = 0; i < 100; i++) {
    let k = keys[parseInt(Math.random()*keys.length as any)];
    time = Date.now()
    tests[k](data)
    counts[k].push(Date.now() - time);
  }
  let out:{[key:string]:{min:number,max:number,n:number,avg:number}} = {};
  keys.forEach(k => {
    out[k] = {
      min : Math.min.apply(null, counts[k]),
      max : Math.max.apply(null, counts[k]),
      n : counts[k].length,
      avg : counts[k].reduce((acc, v) => acc+v, 0)/counts[k].length
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


export function doTest(tests:{[key:string]:(nums:number[])=>void}) {
  let out:any[][] = [];
  let keys = Object.keys(tests);
  keys.forEach(k => {
    let o:{[key:string]:(nums:number[])=>void} = {};
    o[k] = tests[k];
    out.push([`All ${k}`, test(o)])
  })
  out.push(['Mixed', test(tests)]);

  out.forEach(p => {
    log(p[0], p[1]);
  })

  let orig = tests[keys[0]](data);
  keys.slice(1).reduce((a,b) => {
    let cur = tests[b](data);
    let eq = areEqual(cur, orig);;
    if (!eq) {
      console.log(cur);
      console.log("===============")
      console.log(orig);
    }
    console.log(eq);
    return cur; 
  }, orig) 
} 