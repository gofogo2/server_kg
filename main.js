var net = require("net");
var ip6addr = require("ip6addr");
var XMLWriter = require("xml-writer");
var fs = require("fs");
var clients = [];
var readyItems = [];
var complteItems = [];
var playItems = [];
var maxCount = 8;
var clipIP = "127.0.0.1";
var tempvalue = 0;
var randomValue = true;
var currentQue = [1, 2, 3, 4, 5, 6, 7, 8];
var mainQue = ["", "", "", "", "", "", "", ""];
var encode_port = 1;
var encode_port_max = 5;

var server = net.createServer(socket => {
  clients.push(socket);
  var ip = getRemoteIP(socket);
  socket.setKeepAlive(true);
  console.log("connected ip: " + ip);
  console.log("connected count: " + clients.length);

  socket.on("data", function(data) {
    var sender = this;
    console.log("receive:" + getRemoteIP(socket) + ", " + data.toString());
    setMessage(data.toString().trim(), socket);
  });

  socket.on("close", () => {
    clients.splice(clients.indexOf(socket), 1);
    console.log("close: " + getRemoteIP(socket));
    console.log("connected count: " + clients.length);
  });

  socket.on("error", function(err) {
    console.log(err.message);
  });
});
server.listen(9000, () => {
  console.log("listen", server.address());
});

var setMessage = function(data, socket) {
  var temps = data.split("|");
  var status = parseInt(temps[0]);
  var message = {
    ip: getRemoteIP(socket),
    msg: temps[1]
  };
  console.log(status);
  switch (status) {
    //ready

    case 10:
      if (getTotalCount() == maxCount) {
        //send 90
        sendMessage(message.ip, "90");
        return;
      } else {
        readyItems.push(message);
        var idx = complteItems.findIndex(a => a.msg === message.msg);
        if (idx !== -1) {
          complteItems.splice(idx, 1);
        }
        sendMessage(message.ip, "22|1");
      }

      break;

    //cancel
    case 12:
      // sendMessage(message.ip,"22|1");
      var idx = readyItems.findIndex(a => a.msg === message.msg);
      if (idx !== -1) {
        readyItems.splice(idx, 1);
      }
      break;

    //avatar
    case 20:
        var port = 9000+encode_port;
        sendMessage(clipIP, "20|" + message.msg,port);
        
        
        encode_port = encode_port+1;
        if(encode_port>4)
        {
          encode_port = 1;
        }
        

      break;

    //인코딩 완료
    case 21:
      readyItems.forEach(item => {
        if (item.msg === message.msg) {
          sendMessage(item.ip, "21|1");
        }
      });
      break;
    //complete
    case 29:
      var idx = readyItems.findIndex(a => a.msg === message.msg);
      if (idx !== -1) {
        readyItems.splice(idx, 1);
      }
      complteItems.push(message);
      //0~7 랜덤
      var count = parsingPosition();
      mainQue[count] = message.msg;
      sendMessage(message.ip, "28|" + (count+1));
      break;

    case 30:
      var newplay = [];
      var removeComplete = [];

      //완료항목 재생에 넣음
      complteItems.forEach(item => {
        if (newplay.length < maxCount) {
          newplay.push(item);
          removeComplete.push(item);
        }
      });

      playItems.forEach(item => {
        if (newplay.length < maxCount) {
          for (var i = 0; i < mainQue.length; i++) {
            if (mainQue[i] === "") {
              mainQue[i] = item.msg;
              newplay.push(item);
              break;
            }
          }
        }
      });

      //기존 플레이리스트 초기화
      playItems = [];

      //새로운리스트를 플레이리스트에 넣는다
      playItems = newplay;

      //플레이리스트로 넘어간 컴플리트리스트 제거
      removeComplete.forEach(item => {
        var index = complteItems.findIndex(citem => citem.msg === item.msg);
        complteItems.splice(index, 1);
      });

      writeXML(mainQue);
      socket.write(status + "|que");
      initQue();
      break;
  }
};

var writeXML = function(Que) {
  var ws = fs.createWriteStream("d:\\FTP\\que.xml");
  ws.on("close", function() {
    console.log(fs.readFileSync("d:\\FTP\\que.xml", "UTF-8"));
  });
  xw = new XMLWriter(false, function(string, encoding) {
    ws.write(string, encoding);
  });
  xw.startDocument("1.0", "UTF-8");
  xw.startElement("Root");
  xw.startElement("IDs");
  Que.forEach(item => {
    xw.startElement("ID");
    xw.text(item);
    xw.endElement();
  });
  xw.endElement();
  xw.endElement();
};

var initQue = function() {
  currentQue = [1, 2, 3, 4, 5, 6, 7, 8];
  mainQue = ["", "", "", "", "", "", "", ""];
};

var getRemoteIP = function(socket) {
  var addr = ip6addr.parse(socket.remoteAddress);
  return addr.toString({ format: "v4" });
};

var getTotalCount = function() {
  return readyItems.length + complteItems.length;
};

var getCurrentStatus = function() {
  console.log(
    "ready: " +
      readyItems.length +
      ", complete:" +
      complteItems.length +
      ", play:" +
      playItems.length
  );
};

var parsingPosition = function() {
  return random();
};

function random() {
  var cnt = 0;
  randomValue = true;
  tempvalue = 0;
  while (randomValue) {
    cnt++;
    //1~9랜덤
    tempvalue = getRandomInt(0, 7);
    console.log("cnt: " + cnt);
    console.log("random: " + tempvalue);
    console.log("begin: " + currentQue);
    //currentQue를 모두사용하지 않았다면
    if (currentQue.length > 0) {
      //같은 값을 찾아서
      if (
        currentQue.forEach(a => {
          if (a === tempvalue) {
            randomValue = false;
          }
        })
      );
    } else {
      tempvalue = 0;
      randomValue = false;
    }
  }

  if (tempvalue !== 0) {
    var idx = currentQue.findIndex(a => a === tempvalue);
    currentQue.splice(idx, 1);
  }
  console.log("end: " + currentQue);
  return tempvalue;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값은 포함, 최솟값은 포함
}

var sendMessage = function(ipAddress, msg, port = 9001) {
  try {
    console.log("send: " + msg + ", ip:" + ipAddress + ", port:" + port);
    getCurrentStatus();
    var client = net.connect({ port: port, host: ipAddress }, function() {
      client.on("error", function(err) {
        console.log(err.message + "aaaaaaaaaaa");
      });
      client.write(msg + "\n");
      client.destroy();
    });
  } catch (exception) {
    return false;
  }
};
