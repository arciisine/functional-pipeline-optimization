import {TestUtil} from './util';

function target(...args) {
  return args.length > 0;
}

function Inline(input) {
  return target(1,2,3,4,5,6,7,8);
}

function Raw(text, limit) {
    return [].filter(word => {
        return word.length >= limit;
    }).reduce((check, word) => {
        let count = check.all[word] = (check.all[word] || 0) + 1;
        if (count > limit) {
            check.common[word] = count;
        }
        return check;
    }, {
        all: {},
        common: {}
    }).common;
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
                return word.length >= limit;
            }],
        [
            function __gen271004(check, word) {
                let count = check.all[word] = (check.all[word] || 0) + 1;
                if (count > limit) {
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

function RealSplit(text, limit) {
    target(text, '__key65671005', [
        'filter',
    ], [
        function __gen4071003(word) {
                return word.length >= limit;
            }],   [limit], null         
    )

    target(text, '__key65671005', [
        'reduce'],[
            function __gen271004(check, word) {
                let count = check.all[word] = (check.all[word] || 0) + 1;
                if (count > limit) {
                    check.common[word] = count;
                }
                return check;
            },
            {
                all: {},
                common: {}
            }
        ],[
        1,
        1
    ]
    );
}

const translateState = [
        ['filter', 1],
        ['reduce', 1]
  ]

function RealAlt(text, limit) {
  return target(text, '__key65671005', [translateState, 
        [function __gen4071003(word) {
                return word.length >= null;
            }],
        
            [function __gen271004(check, word) {
                let count = check.all[word] = (check.all[word] || 0) + 1;
                if (count > null) {
                    check.common[word] = count;
                }
                return check;
            },
            { all: {}, common: {} }]
        
    , limit]);
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
  return target(input, '__key3467362',   
        'filter', 1, 
        function __gen11783488(word) {
                return word.length >= limit;
        },

        'reduce', 1, 
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
        1, limit);
}

export default {
  tests         : {
    //Raw,
    //Real,
    RealAlt, 
    //RealExt,
    //RealSplit,
    //RealSimple
  },
  maxInputSize  : 1,
  data          : () => null
}