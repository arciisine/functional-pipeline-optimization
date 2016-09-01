import {TestUtil} from '../util';

function target(...args) {
  return args.length > 0;
}

function Inline(input) {
  return target(1,2,3,4,5,6,7,8);
}

function NestAr(input) {
  return target([[1],[2],[3],[4],[5],[6],[7],[8],[9],[10]]);
}

function NestArComp(input) {
  return target([1,[2, [3,[4]]]])
}

function NestArShort(input) {
  return target([[1],[2],[3],[4],[5],[6],[7],[8]]);
}

function NestArLong(input) {
  return target([[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18],[19],[20]]);
}

function Real(text, limit) {
  return target(text, '__key65671005', [
        'filter',
        'reduce'
    ], [
        [function __gen4071003(word) {
                return word.length >= null;
            }],
        [
            function __gen271004(check, word) {
                let count = check.all[word] = (check.all[word] || 0) + 1;
                if (count > null) {
                    check.common[word] = count;
                }
                return check;
            },
            {
                all: {},
                common: {}
            }
        ]
    ], [limit], null, [
        1,
        1
    ]);
}

let fn1 = function __gen4071003(word) {
  return word.length >= null;
}

let fn2 = function __gen271004(check, word) {
  let count = check.all[word] = (check.all[word] || 0) + 1;
    if (count > null) {
      check.common[word] = count;
    }
    return check;
}

function RealExt(text, limit) {
  return target(text, '__key65671005', [
        'filter',
        'reduce'
    ], [
        [fn1],
        [fn2
            ,
            {
                all: {},
                common: {}
            }
        ]
    ], [limit], null, [
        1,
        1
    ]);
}


function RealSimple(input, limit) {
  return target(input, '__key3467362', [ 
        2, 'filter', 1, 
        function __gen11783488(word) {
                return word.length >= limit;
        },

        3, 'reduce', 1, 
        function __gen49783489(check, word) {
            let count = check.all[word] = (check.all[word] || 0) + 1;
            if (count > limit) {
                check.common[word] = count;
            }
            return check;
        },
        {
            all: {},
            common: {}
        }, 
        1, limit, null]);
}

export default {
  tests         : {
    Inline,
    Real, 
    RealExt,
    RealSimple
  },
  maxInputSize  : 1,
  data          : () => null
}