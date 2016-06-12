export class Manual {
  static filter<T>(data:T[], fn:(o:T,i?:number)=>T):T[] {
    return data.filter(fn as any);
  }

  static map<T,U>(data:T[],fn:(o:T,i?:number)=>U):U[] {
    return data.map(fn);
  }
  
  static reduce<T, U>(data:T[], fn:(acc:U, o:T)=>U):U {
    return data.reduce(fn, JSON.parse(fn['init']) as U);
  }
}