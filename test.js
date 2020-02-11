var value = 0;
var returnValue = true;
var currentQue = [1, 2, 3, 4, 5, 6, 7, 8];

random();

 function random(){

var cnt =0;
  for (var i = 0; i < 10; i++) {
    returnValue = true;
    value =0;
    while (returnValue) {
        cnt++;
      //1~9랜덤
      value = getRandomInt(1, 8);
      console.log("cnt: " + cnt);
      console.log("random: " + value);
      console.log("begin: " + currentQue);
      //currentQue를 모두사용하지 않았다면
      if (currentQue.length > 0) {
        //같은 값을 찾아서
        if (
          currentQue.forEach(a => {
            if (a === value) {
              returnValue = false;
            }
          })
        );
      } else {
        value = 0;
        returnValue = false;
      }
    }

    if (value !== 0) {
      var idx = currentQue.findIndex(a => a === value);
      currentQue.splice(idx, 1);
    }
    console.log("end: " + currentQue);
  }
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값은 포함, 최솟값은 포함
}
