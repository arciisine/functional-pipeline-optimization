let sumAndCount = EXEC(WRAP(findPeople())
  .filter(TAG(p => p.age > 35 && p.gender == 'male'), UNIQUE_ID_1, true)
  .map(TAG(p => p.name), UNIQUE_ID_2, true)
  .reduce(TAG((acc, p) => [acc[0] + p.income, acc[1] + 1], [0,0]), UNIQUE_ID_3, true))

let avgIncome = sumAndCount[0]/sumAndCount[1];