export const ANALYSIS_BOOLEAN_FIELDS = [
  'Assignment', 'NestedFunction', 'ThisExpression', 'MemberExpression', 'CallExpression', 'NewExpression'
];

export enum AccessType {
  ACCESS = 0b1, WRITE = 0b10, INVOKE = 0b100
}

export class Analysis {
  check : string;
  globals:{[key:string]:any};
  closed:{[key:string]:number} = {};
  declared:{[key:string]:boolean} = {};
  all:number = 0;

  hasThisExpression:boolean
  hasNestedFunction:boolean
  hasMemberExpression:boolean
  hasNewExpression:boolean

  constructor(public key: string) {}

  merge(obj:Analysis|Analyzable):this {
    if (!obj) return this;

    let o:Analysis = obj instanceof Analysis ? obj : obj.analysis;

    this.all = this.all | o.all;
    for (var k in o.declared) {
      this.declared[k] = o.declared[k];
    }
    for (var k in o.closed) {
      this.closed[k] = (this.closed[k] || 0) | o.closed[k];
    }
    
    this.key = `${this.key}|${o.key}`;
    ANALYSIS_BOOLEAN_FIELDS
      .forEach(k => { this[k] = this[k] || o[k];})
    return this;
  }
}

export interface Analyzable {
  analysis?:Analysis
};


declare global {
  interface Function {
    analysis?:Analysis
    local?:boolean
  }
}