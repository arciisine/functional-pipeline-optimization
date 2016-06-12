let data:number[] = null
function getData() {
  if (data) return data;
  
  data = []
  for (let i = 0; i < 100000; i++) {
    data.push(parseInt('' + (Math.random() * 255)));
  }
  return data
}

function test(a:(nums:number[])=>void, b:(nums:number[])=>void, delta = .5) {
  let counts = {};
  counts[a.name] = [];
  counts[b.name] = [];

  let time = 0;
  let data = getData();

  for (let i = 0; i < 100; i++) {
    let op = Math.random() >= delta ? a : b;
    time = Date.now()
    op(data)
    counts[op.name].push(Date.now() - time);
  }
  let out:{[key:string]:{min:number,max:number,n:number,avg:number}} = {};
  [a, b].filter(k => counts[k.name].length > 0).forEach(k => {
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

export function doTest(a:(nums:number[])=>void, b:(nums:number[])=>void) {
  log("Mixed", test(a,b))
  log(`All ${a.name}`, test(a,b,0))
  log(`All ${b.name}`, test(a,b,1))

  console.log(a.name, a(data))
  console.log(b.name, b(data))
  console.log(a(data) === b(data))
} 
