let sumAndCount = findPeople()
  .filter(p => p.age > 35 && p.gender == 'male')
  .map(p => p.name)
  .reduce((acc, p) => [acc[0] + p.income, acc[1] + 1], [0,0])

let avgIncome = sumAndCount[0]/sumAndCount[1];