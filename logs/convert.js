var fs = require("fs")

fs.readFile(process.argv[2], function(err, data) {
  if (err) {
    return console.log(err)
  }

  console.log(JSON.stringify(
    simplify(
      convert(
        data.toString()))))
});

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
