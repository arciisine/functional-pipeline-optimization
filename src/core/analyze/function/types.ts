import {md5} from './md5';
export const ANALYSIS_BOOLEAN_FIELDS = [
   'ThisReference', 
   'ComputedMemberAccess',
   'MemberAccess', 
   'Invocation'
];

export enum AccessType {
  ACCESS = 0b1, WRITE = 0b10, INVOKE = 0b100, ASSIGN = 0b1000
}

export class Analysis {
  globals:{[key:string]:any};
  closed:{[key:string]:number} = {};
  all:number = 0;

  hasThisReference:boolean
  hasComputedMemberAccess:boolean;
  hasMemberAccess:boolean;
  hasInvocation:boolean

  constructor(public key: string) {}

  get hasClosed():boolean {
    return Object.keys(this.closed).length > 0;
  }

  merge(obj:Analysis):this {
    if (!obj) return this;

    this.all = this.all | obj.all;
    for (var k in obj.closed) {
      this.closed[k] = (this.closed[k] || 0) | obj.closed[k];
    }
    
    this.key = `${this.key}|${obj.key}`;
    ANALYSIS_BOOLEAN_FIELDS
      .forEach(k => { this[k] = this[k] || obj[k];})
    return this;
  }

  getExternalVariables():{closed:string[], assigned:string[] } {
    let closed = {};
    let assigned = {};

    for (var k in this.closed) {
      let v = this.closed[k];
      if ((v & AccessType.ASSIGN) > 0) {
        assigned[k] = true;
      } else if (v > 0) {
        closed[k] = true;
      }
    }

    //Define call site    
    return { 
      closed:Object.keys(closed).sort(), 
      assigned:Object.keys(assigned).sort()
     };
  }
}

declare global {
  interface Function {
    key?:string
  }
  interface FunctionConstructor {
    getKey(fn:Function):string;
  }  
}

Function['getKey'] = (fn:Function) => {
  if (!fn.key) {
    fn.key = md5(fn.toString());
  }
  return fn.key;
};