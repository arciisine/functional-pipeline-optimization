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
  private position:number = 0;
  private globals:{[key:string]:any};
  private closed:{[key:string]:number} = {};
  private all:number = 0;
  private order:{[key:string]:number} = {};

  hasThisReference:boolean
  hasComputedMemberAccess:boolean;
  hasMemberAccess:boolean;
  hasInvocation:boolean

  constructor(public key: string) {}

  get hasClosed():boolean {
    return Object.keys(this.closed).length > 0;
  }

  isClosed(k:string) {
    return !!this.closed[k]
  }

  unregisterClosed(k:string) {
    delete this.closed[k];
  }

  registerClosed(k:string, level:AccessType) {
    if (!this.closed[k]) this.order[k] = this.position++;
    this.closed[k] = (this.closed[k] || 0) | level
  }

  setGlobals(items:{[key:string]:any}) {
    this.globals = items;
  }

  getGlobals():{[key:string]:any} {
    return this.globals;
  }

  isGlobal(k:string) {
    return !!this.globals[k]
  }

  unregisterGlobal(k:string) {
    delete this.globals[k];
  }

  registerGlobal(k:string) {
    if (!this.globals[k]) this.order[k] = this.position++;
    this.globals[k] = true
  }

  merge(obj:Analysis):this {
    if (!obj) return this;

    this.all = this.all | obj.all;
    for (var k in obj.closed) {
      this.registerClosed(k, obj.closed[k]);
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
      closed:Object.keys(closed).sort((a,b) => this.order[a] - this.order[b]), 
      assigned:Object.keys(assigned).sort((a,b) => this.order[a] - this.order[b])
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

