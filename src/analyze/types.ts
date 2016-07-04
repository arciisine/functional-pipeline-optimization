export const ANALYSIS_BOOLEAN_FIELDS = [
  'Assignment', 'NestedFunction', 'ThisExpression', 'MemberExpression', 'CallExpression', 'NewExpression'
];

export enum AccessType {
  NONE, READ, WRITE, INVOKE
}

export class Analysis {
  check : string;
  globals:{[key:string]:any};
  closed:{[key:string]:AccessType} = {};
  declared:{[key:string]:boolean} = {};
  hasAssignment:boolean
  hasCallExpression:boolean
  hasThisExpression:boolean
  hasNestedFunction:boolean
  hasMemberExpression:boolean
  hasNewExpression:boolean

  constructor(public key: string) {}

  merge(obj:Analysis|Analyzable):this {
    if (!obj) return this;

    let o:Analysis = obj instanceof Analysis ? obj : obj.analysis;
    
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
  }
}