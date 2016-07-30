let sumAndCount = EXEC(WRAP(findPeople())
  .filter(TAG(p => p.age > 35 && p.gender == 'male'))
  .map(TAG(p => p.name))
  .reduce(TAG((acc, p) => [acc[0] + p.income, acc[1] + 1], [0,0])))

let avgIncome = sumAndCount[0]/sumAndCount[1];