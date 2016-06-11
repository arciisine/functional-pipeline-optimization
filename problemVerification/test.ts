let data:number[] = null
function getData() {
  if (data) return data;
  
  data = []
  for (let i = 0; i < 100000; i++) {
    data.push(parseInt('' + (Math.random() * 255)));
  }
  return data
}

function functional() {
    
  let hist = getData()
    .filter(x => x > 65 && x < 91 || x >= 97 && x < 123)
    .map(x => x > 91 ? x - 32 : x)
    .map(x => String.fromCharCode(x))
    .reduce((acc, x) => {
      acc[x] = (acc[x] || 0) + 1;
      return acc;
    }, {} as {[key:string]:number});
      
  let count = getData()
    .filter(x => x > 100)
    .map(function(x) {
      return x - 10
    })
    .reduce((acc, x) => acc + x, 0);

  let evens = getData().filter(x => x % 2 === 0).map(x => x << 2);
      
  return [hist, count, evens];
}

function procedural() {
  let data = getData()
  let hist:{[key:string]:number} = {}
  for (let i = 0; i < data.length; i++) {
    let x = data[i]
    if (x >= 65 && x < 91 || x >= 97 && x < 123) {
      if (x > 91) {
        x = x - 32
      }
      let ch = String.fromCharCode(x)
      hist[ch] = (hist[ch] || 0) + 1;
    }
  } 

  let count = 0
  for (let i = 0; i < data.length; i++) {
    let x = data[i]
    if (x > 100) {
      x -= 10
      count += x
    }
  }

  let evens = []
  for (let i = 0; i < data.length; i++) {
    let x = data[i]
    if (x % 2 === 0) {
      evens.push(x << 2);
    }
  }

  return [hist, count, evens]
}

function test(delta = .5) {
  let counts = {};
  counts[functional.name] = [];
  counts[procedural.name] = [];

  let time = 0;

  for (let i = 0; i < 100; i++) {
    let op = Math.random() >= delta ? functional : procedural;
    time = Date.now()
    op()
    counts[op.name].push(Date.now() - time);
  }
  let out:{[key:string]:{min:number,max:number,n:number,avg:number}} = {};
  [functional, procedural].filter(k => counts[k.name].length > 0).forEach(k => {
    out[k.name] = {
      min : Math.min.apply(null, counts[k.name]),
      max : Math.max.apply(null, counts[k.name]),
      n : counts[k.name].length,
      avg : counts[k.name].reduce((acc, v) => acc+v, 0)/counts[k.name].length
    }
  })
  return out;
}

function log(title, o){
  console.log(title)
  console.log('='.repeat(20)) 
  console.log(JSON.stringify(o, null, 2))
  console.log()
}

log("Mixed", test())
log("All Procdedural", test(1))
log("All Functional", test(0))