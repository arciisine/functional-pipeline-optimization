for (let i = 0; i < chainOperations.length; i++) {
  chainTarget = (chainTarget[chainOperations[i]] as any)(...chainInput[i]);
}
return chainTarget;