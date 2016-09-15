import {TestUtil} from '../../../core';
import {md5 as Manual} from '../../../core/analyze/function/md5'

const HEX_CHR = '0123456789abcdef'.split('');
const FOUR = [0,1,2,3]
global['HEX_CHR'] = HEX_CHR;

const INITIAL_STATE = [1732584193, -271733879, -1732584194, 271733878];
const INITIAL_TAIL = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const FOPS = [
  [0, 7, -680876936],
  [1, 12, -389564586],
  [2, 17, 606105819],
  [3, 22, -1044525330],
  [4, 7, -176418897],
  [5, 12, 1200080426],
  [6, 17, -1473231341],
  [7, 22, -45705983],
  [8, 7, 1770035416],
  [9, 12, -1958414417],
  [10, 17, -42063],
  [11, 22, -1990404162],
  [12, 7, 1804603682],
  [13, 12, -40341101],
  [14, 17, -1502002290],
  [15, 22, 1236535329],
]

const GOPS = [
  [1,  5, -165796510],
  [6,  9, -1069501632],
  [11,  14, 643717713],
  [0,  20, -373897302],
  [5,  5, -701558691],
  [10,  9, 38016083],
  [15,  14, -660478335],
  [4,  20, -405537848],
  [9,  5, 568446438],
  [14,  9, -1019803690],
  [3,  14, -187363961],
  [8,  20, 1163531501],
  [13,  5, -1444681467],
  [2,  9, -51403784],
  [7,  14, 1735328473],
  [12,  20, -1926607734],
]

const HOPS = [
  [5,  4, -378558],
  [8,  11, -2022574463],
  [11,  16, 1839030562],
  [14,  23, -35309556],
  [1,  4, -1530992060],
  [4,  11, 1272893353],
  [7,  16, -155497632],
  [10,  23, -1094730640],
  [13,  4, 681279174],
  [0,  11, -358537222],
  [3,  16, -722521979],
  [6,  23, 76029189],
  [9,  4, -640364487],
  [12,  11, -421815835],
  [15,  16, 530742520],
  [2,  23, -995338651],
]

const IOPS = [
  [0,  6, -198630844],
  [7,  10, 1126891415],
  [14,  15, -1416354905],
  [5,  21, -57434055],
  [12,  6, 1700485571],
  [3,  10, -1894986606],
  [10,  15, -1051523],
  [1,  21, -2054922799],
  [8,  6, 1873313359],
  [15,  10, -30611744],
  [6,  15, -1560198380],
  [13,  21, 1309151649],
  [4,  6, -145523070],
  [11,  10, -1120210379],
  [2,  15, 718787259],
  [9,  21, -343485551],
]

type OpFn = (a:number,b:number,c:number,d:number,x:number,s:number,t:number) =>number; 

function add32(a:number, b:number):number {
  return (a + b) & 0xFFFFFFFF;
}

function cmn(q:number, a:number, b:number, x:number, s:number, t:number):number {
  a = add32(add32(a, q), add32(x, t));
  return add32((a << s) | (a >>> (32 - s)), b);
}

const OPS:[number[][], OpFn][] = [
  [FOPS, (a,b,c,d,x,s,t) => cmn((b & c) | ((~b) & d), a, b, x, s, t)],
  [GOPS, (a,b,c,d,x,s,t) => cmn((b & d) | (c & (~d)), a, b, x, s, t)],
  [HOPS, (a,b,c,d,x,s,t) => cmn(b ^ c ^ d, a, b, x, s, t)],
  [IOPS, (a,b,c,d,x,s,t) => cmn(c ^ (b | (~d)), a, b, x, s, t)]
];

let Functional = (function() {
  function md5cycle(x:number[], k:number[]) {
    let xorig = [x[0], x[1], x[2], x[3]];
    OPS.forEach((pair, z) => {
      var [ops, fn] = pair;
      ops.reduce((x, op, i) => { 
          let j = ((3-i%4)+1)%4;
          x[j] = fn(x[j], x[(j+1)%4], x[(j+2)%4], x[(j+3)%4], k[op[0]], op[1], op[2]);
          return x; 
      }, x)
    });
    FOUR.forEach(i => x[i] = add32(x[i], xorig[i]));
  }

  function md51(s) {
    const n = s.length;
    let state = INITIAL_STATE.slice(0);
    let tail = INITIAL_TAIL.slice(0);

    let i = 0;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    
    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    }
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);

    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) {
        tail[i] = 0;
      }
    }

    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }

  function md5blk(s) {
    let md5blks = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = FOUR.map(j => s.charCodeAt(i + j) << (8*j)).reduce((acc, x) => acc+x, 0);
    }
    return md5blks;
  }

  function rhex(n:number):string {
    return FOUR.map(j => HEX_CHR[(n >> (j * 8 + 4)) & 0x0F] + HEX_CHR[(n >> (j * 8)) & 0x0F]).join('');
  }

  return function md5(s) {
    return md51(s).map(rhex).join('');
  }
})();


let Optimized = (function() {
  "use optimize"

  function md5cycle(x:number[], k:number[]) {
    let xorig = [x[0], x[1], x[2], x[3]];
    OPS.forEach((pair, z) => {
      var [ops, fn] = pair;
      ops.reduce((x, op, i) => { 
          let j = ((3-i%4)+1)%4;
          x[j] = fn(x[j], x[(j+1)%4], x[(j+2)%4], x[(j+3)%4], k[op[0]], op[1], op[2]);
          return x; 
      }, x)
    });
    FOUR.forEach(i => (x[i] = add32(x[i], xorig[i])));
  }

  function md51(s) {
    const n = s.length;
    let state = INITIAL_STATE.slice(0);
    let tail = INITIAL_TAIL.slice(0);

    let i = 0;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);

    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    }
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);

    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) {
        tail[i] = 0;
      }
    }

    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }

  function md5blk(s) {
    let md5blks = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = FOUR.map(j => s.charCodeAt(i + j) << (8*j)).reduce((acc, x) => acc+x, 0);
    }
    return md5blks;
  }

  function rhex(n:number):string {
    return FOUR.map(j => HEX_CHR[(n >> (j * 8 + 4)) & 0x0F] + HEX_CHR[(n >> (j * 8)) & 0x0F]).join('');
  }

  return function md5(s) {
    return md51(s).map(rhex).join('');
  }
})();

let text = TestUtil.readFile(`${__dirname}/../resources/war-and-peace.txt.gz`).toLowerCase();

export default {
  tests        : {Manual, Functional, Optimized},
  data         : (n) => text.substring(0, n)
}