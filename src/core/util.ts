declare var window;
declare var global;

if (global) {
  [global.process.stdout, global.process.stderr].forEach((s:any) => {
    s && s.isTTY && s._handle && s._handle.setBlocking &&
      s._handle.setBlocking(true)
    });
}

export class Util {
  static global = global || window;
}

export const GLOBAL_SCHEMA = {
  /*Global : {
    properties : ['Infinity', 'NaN'],
    methods : [
      'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'decodeURI', 'decodeURIComponent', 
      'encodeURI', 'encodeURIComponent' 
    ],
  },*/
  console : {
    methods : ['log', 'error']
  },
  String : {
    methods : ['fromCharCode','fromCodePoint', 'raw'],
    prototype : [
      'anchor', 'big', 'blink', 'bold', 'charAt', 'charCodeAt','codePointAt',
      'concat', 'endsWith', 'fixed', 'fontcolor', 'fontsize', 'includes',
      'indexOf', 'italics', 'lastIndexOf', 'link', 'localeCompare', 'match',
      'normalize', 'padEnd', 'padStart', 'quote', 'repeat', 'replace', 'search',
      'slice', 'small', 'split', 'startsWith', 'strike', 'sub', 'substr',
      'substring', 'sup', 'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase',
      'toSource', 'toString', 'toUpperCase', 'trim', 'trimLeft', 'trimRight', 'valueOf'
    ], 
  },
  Function : {
    prototype : [ 'apply', 'bind', 'call', 'isGenerator', 'toSource', 'toString' ]
  },
  Object : {
    methods : [
      'assign', 'create', 'defineProperties', 'defineProperty', 'entries', 'freeze',
      'getNotifier', 'getOwnPropertyDescriptor', 'getOwnPropertyDescriptors', 'getOwnPropertyNames',
      'getOwnPropertySymbols', 'getPrototypeOf', 'is', 'isExtensible', 'isFrozen', 'isSealed',
      'keys', 'preventExtensions', 'seal', 'setPrototypeOf', 'unobserve', 'values',      
    ],
    prototype : [
      'eval', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString',
      'toSource', 'toString',  'valueOf'
    ]
  },
  Math   : {
    properties : ['E','LN2','LN10','LOG2E','LOG10E','PI','SQRT1_2', 'SQRT2'],
    methods : [
      'abs','acos','acosh','asin','asinh','atan','atanh', 'atan2','cbrt','ceil','clz32',
      'cos','cosh','exp','expm1','floor','fround','hypot','imul','log','log1p','log10',
      'log2','max','min','pow','random','round','sign','sin','sinh','sqrt','tan','tanh',
      'trunc'
    ]
  },
  Number : {
    properties : [
      'EPSILON', 'MAX_SAFE_INTEGER', 'MAX_VALUE', 'MIN_SAFE_INTEGER', 'MIN_VALUE', 
      'NEGATIVE_INFINITY', 'NaN', 'POSITIVE_INFINITY'
    ],
    methods : ['isFinite', 'isInteger', 'isNaN', 'isSafeInteger', 'parseFloat', 'parseInt'],
    prototype : [ 'toExponential', 'toFixed', 'toLocaleString', 'toPrecision', 'toSource', 'toString', 'valueOf']
  },
  JSON : {
    methods : ['parse', 'stringify']
  },
  Array : {
    methods : [ 'from', 'isArray', 'of',],
    prototype : [
      'concat', 'copyWithin', 'entries', 'every', 'fill', 'filter', 'find', 'findIndex',
      'forEach', 'includes', 'indexOf', 'join', 'keys', 'lastIndexOf', 'map', 'pop',
      'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'some', 'sort',
      'splice', 'toLocaleString', 'toSource', 'toString', 'unshift', 'values',
    ]
  },
  Date : {
    methods : ['now', 'parse', 'UTC',],
    prototype : [
      'getDate', 'getDay', 'getFullYear', 'getHours', 'getMilliseconds', 'getMinutes', 'getMonth',
      'getSeconds', 'getTime', 'getTimezoneOffset', 'getUTCDate', 'getUTCDay', 'getUTCFullYear',
      'getUTCHours', 'getUTCMilliseconds', 'getUTCMinutes', 'getUTCMonth', 'getUTCSeconds',
      'getYear', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds', 'setMinutes',
      'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear', 'setUTCHours',
      'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds', 'setYear',
      'toDateString', 'toGMTString', 'toISOString', 'toJSON', 'toLocaleDateString',
      'toLocaleFormat',  'toLocaleString', 'toLocaleTimeString', 'toSource', 'toString', 'toTimeString', 'toUTCString', 'valueOf',
    ]
  }
}

type Instruction = [string, string|null, string[]|null]
const SCHEMA_INSTRUCTIONS:Instruction[] = [
  ['properties', null, null],
  ['methods', null, ['bind', 'call', 'apply']], 
  ['prototype', 'prototype', ['bind', 'call', 'apply']]
]

export const GLOBALS = Object
  .keys(GLOBAL_SCHEMA)
  .reduce((acc_a, k) => {
    acc_a[k] = SCHEMA_INSTRUCTIONS
      .reduce((acc_b, [prop, sub, suffixes]) => {
        let out = acc_b;
        if (!!sub) {
          out = out[sub] || (out[sub] = {}); 
        }

        let obj = (GLOBAL_SCHEMA[k][prop]||[]).reduce((acc_c, p) => {
          return (acc_c[p] = (suffixes||[]).reduce((acc_d, suff) => {
            return (acc_d[suff] = 1) && acc_d 
          }, {})) && acc_c; 
        }, {});
        
        for (let k of Object.keys(obj)) {
          out[k] = obj[k];
        }

        return acc_b;
      }, {});
    return acc_a;
  }, {});