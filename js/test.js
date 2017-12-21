function fn(n) {
    if (typeof n == 'number') {
        var arr = [];
        var min = 2, max = 32;
        if ( n <= (max - min + 1)) {
            for (var i = 0; i < n; i++) {
                var rnd = getRand(2, 32);
                if (checkInArr(arr, rnd)) {
                    i--;
                } else {
                    arr.push(rnd);
                }
            }
            return arr;
        } else {
            alert('error: '+ n + ' is greater than the length of array ' + (max - min + 1));
        }
    } else {
        alert('error: the parameter should be typeof number');
    }
}
function getRand(min, max) {
    var arr = [];
    for (var i = min; i < max + 1; i++) {
        arr.push(i);
    }
    var randomIndex = Math.round(Math.random()*(max - min));
    var rnd = arr[randomIndex];
    return rnd;
}
function checkInArr(arr, rnd) {
    for (var i = 0; i < arr.length; i++) {
        if (rnd === arr[i]) {
            return true;
        }
    }
    return false;
}