var fs = require("fs");

fs.readFile("./log-1.gpsd", function(err, data) {
  if (err) {
    return console.log(err);
  }

  var json = data.toString().replace(/[\x00\r]/g, "").split("\n").map(function(line) {
    return JSON.parse(line);
  });

  console.log(json);
});
