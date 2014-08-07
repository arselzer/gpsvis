var map = L.map("map").setView([48.3257, 16.2143], 13);

L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
}).addTo(map)

var tracks = {
  raw: [
  // logs/log-1.gpsd
  ],
  simple: [
    "logs/log-1.json",
    "logs/log-2.json",
    "logs/log-3.json"
  ]
}

tracks.raw.forEach(function(path) {
  get(path, function(res) {
    var data = simplify(convert(res));
    display(data)
  })
})

tracks.simple.forEach(function(path) {
  get(path, function(res) {
    display(JSON.parse(res))
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
      time: point.time
    }
  })
}

// display one line
function display(data) {

  /* Colours */

  var DEFAULT_COLOR = "rgb(23, 89, 232)"
  var FOCUS_COLOR = "rgb(23, 76, 244)"

  /* Coordinates */

  var path = L.polyline(data.map(function(point) {
    return [point.lat, point.long]
  }))

  /* Meta */

  var meta = {
    start: new Date(data[0].time),
    end: new Date(data[data.length-1].time),
    avgSpeed: data // assuming the position is captured every second, for now...
      .map(function(point) { return point.speed; })
      .reduce(function(l, r) {return l + r; }) / data.length,
  }

  var points = path.getLatLngs();
  meta.distance = 0;

  for (var i = 0; i < points.length-1; i++) {
      meta.distance +=  points[i].distanceTo(points[i+1])
  }

  /* Path */

  path.setStyle({color: DEFAULT_COLOR})

  var middle = points[Math.round(points.length / 2)]
  var marker = L.marker(middle)
  marker.addTo(map)

  var dateDiff = new Date(meta.end - meta.start)

  var popup = [
    "start: " + (meta.start.getHours()-1) + ":" + (meta.start.getMinutes() < 10 ? 0 : "") + meta.start.getMinutes() + ", " + meta.start.toLocaleDateString(),
    "end: " + (meta.end.getHours()-1) + ":" + (meta.end.getMinutes() < 10 ? 0 : "") + meta.end.getMinutes() + ", " + meta.end.toLocaleDateString(),
    "time: " + (dateDiff.getHours()-1) + ":" + dateDiff.getMinutes(),
    "distance: " + (meta.distance / 1000).toFixed(2) + " km",
    "average speed: " + (meta.avgSpeed * 3.6).toFixed(2) + " km/h"
  ]

  marker.bindPopup(popup.join("<br />")).openPopup()

  path.addEventListener("click", function() {
    marker.openPopup()
  })

  marker.addEventListener("popupopen", function() {
    path.setStyle({color: FOCUS_COLOR, opacity: 0.64})
  })

  marker.addEventListener("popupclose", function() {
    path.setStyle({color: DEFAULT_COLOR, opacity: 0.5})
  })


  path.addTo(map)
}
