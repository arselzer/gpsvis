var map = L.map("map").setView([48.3257, 16.2143], 13);

L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
}).addTo(map)

var tracks = [
  "logs/log-1.gpsd",
  "logs/log-2.gpsd"
]

tracks.forEach(function(path) {
  get(path, function(res) {
    var data = simplify(convert(res));
    display(data)
  })
})

function get(path, cb) {
  var xhr = new XMLHttpRequest()

  xhr.open("GET", path, true)
  xhr.send()

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      cb(xhr.responseText)
    }
  }
}

// Convert the raw stream of JSON lines to an array.
function convert(input) {
  return input.replace(/\t/g, "").split("\n").map(function(line) {
  try {
    return JSON.parse(line)
  } catch (e) {
    console.log(line)
  }
  return null; // there could be JSON syntax errors, but it is quite safe to ignore them
})
}

// Filter and convert the JSON to more usable data
function simplify(input) {
  return input.filter(function(point) {
    return (point !== null
    && point.lat !== undefined
    && point.lon !== undefined
    && point.mode !== 0 // this (probably) means no GPS signal. causes lat, long, etc to be undef
    && point.class === "TPV")
  }).map(function(point) {
    return {
      lat: point.lat,
      long: point.lon,
      speed: point.speed,
      time: new Date(point.time)
    }
  })
}

// display one line
function display(data) {
  var meta = {
    start: data[0].time,
    end: data[data.length-1].time,
    avgSpeed: data
      .map(function(point) { return point.speed; })
      .reduce(function(l, r) {return l + r; }) / data.length
  }
  var points = data.map(function(point) {
    return [point.lat, point.long]
  })

  var path = L.polyline(points)

  path.setStyle({color: "rgb(23, 89, 232)"})

  var bounds = path.getBounds()
  var center = bounds.getCenter()

  var marker = L.marker(center)
  marker.addTo(map)

  var popup = [
    "start: " + meta.start.toLocaleTimeString(),
    "end: " + meta.end.toLocaleTimeString(),
    "average speed: " + meta.avgSpeed + " m/s"
  ]
  marker.bindPopup(popup.join("<br />")).openPopup()

  path.addTo(map)
}
