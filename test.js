function test() {
    let data = [];
    
    for (let i = 0; i < 10000; i++) {
        data.push(parseInt('' + (Math.random() * 255)));
    }
    
    let hist = data
        .filter(x => x > 65 && x < 91 || x >= 97 && x < 123)
        .map(x => x > 91 ? x - 32 : x)
        .map(x => String.fromCharCode(x))
        .reduce((acc, x) => {
            acc[x] = (acc[x] || 0) + 1;
            return acc;
        }, {});
        
    data
        .filter(x => x > 100)
        .map(function(x) {
            return x - 10
        })
        .reduce((acc, x) => acc + x, 0);
        
    return hist;
}

module.exports = test;