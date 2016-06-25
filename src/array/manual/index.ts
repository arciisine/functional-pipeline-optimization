export class Manual {
  static filter<T>(data:T[], fn:(o:T,i?:number)=>T):T[] {
    return data.filter(fn as any);
  }

  static map<T,U>(data:T[],fn:(o:T,i?:number)=>U):U[] {
    return data.map(fn);
  }

  static reduce<T, U>(data:T[], fn:(acc:U, o:T)=>U, init:any):U {
    return data.reduce(fn, JSON.parse(init) as U);
  }

  static forEach<T>(data:T[],fn:(o:T,i?:number)=>void):void {
    return data.forEach(fn);
  }

  static find<T>(data:T[],fn:(o:T,i?:number)=>boolean):T {
    return data.find(fn);
  }

  static some<T>(data:T[],fn:(o:T,i?:number)=>boolean):boolean {
    return data.some(fn);
  } 
}