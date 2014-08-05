var map = L.map("map").setView([48.3257, 16.2143], 13);

L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
}).addTo(map)

var xhr = new XMLHttpRequest()

xhr.open("GET", "logs/log-1.gpsd", true)
xhr.send()

xhr.onreadystatechange = function() {
  if (xhr.readyState === 4 && xhr.status === 200) {
    var data = simplify(convert(xhr.responseText));
    display(data)
  }
}

function convert(input) {
  return input.replace(/\t/g, "").split("\n").map(function(line) {
  try {
    return JSON.parse(line)
  } catch (e) {
    // works for now. browser errors are too unclear to fix this...
    console.log(line)
  }
  });
}

function simplify(input) {
  return input.slice(2).filter(function(obj) {
    if (obj !== undefined && obj.class === "TPV") {
      return true
    }
    else {
      return false
    }
  }).map(function(point) {
    return {
      lat: parseFloat(point.lat),
      long: parseFloat(point.lon),
      speed: point.speed,
      time: new Date(point.time)
    }
  })
  .filter(function(point) {
    return point !== undefined && !isNaN(point.lat) && !isNaN(point.long)
  })
}

function display(data) {
  var points = data.map(function(point) {
    return [point.lat, point.long]
  })
  console.dir(points)

  L.polyline(points).setStyle({color: "rgb(23, 89, 232)"}).addTo(map)
}
