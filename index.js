// json-fix-stream
// Fix malformed JSON stream
"use strict"

var xtend     = require('xtend')    // Raynos/xtend 
, util        = require('util')
, S           = require('string')   // jprichardson/string.js
, stream      = require('stream').Transform
if (!stream) stream = require('readable-stream').Transform // stream 2 compatible

// json string in and out
function JsonFixStream(config) {
 	stream.call(this, { objectMode: true })
	config = (config) ? config : {}
	var DEFAULT = {
		onErrors:        'ignore', // options: 'log' 'emit', 'throw', everything else is ignore
		cleanWhiteSpace: false,
		replace:         {}
	}
	config = xtend(DEFAULT, config) 

	function tryToParse(json) {
		var parsed = undefined
		try {
			parsed = JSON.parse(json)
		} catch (e) {
			parsed = undefined
		}
		return parsed
	}


	this._transform = function (data, encoding, callback) {
		function handleError(json) {
			var msg = 'JsonFixStream could not fix: ' + json
			switch (config.onErrors) {
				case 'log':   console.log(msg);        break
				case 'throw': throw new Error(msg);    break
				case 'emit':  self.emit('error', msg); break
			}
			callback()
		}

		if (data) {
			var json   = data.toString('utf8')
			var parsed = tryToParse(json)
			if (parsed === undefined) {
				var json2           = S(json).trim().s
				var first       = json.substr(0,1)
				var last        = json.substr(-1)
				if (first == '[') {
					json2 += ']'
				} else if (first == '{') {
					json2 += '}'
				}
				parsed = tryToParse(json2)
			}
			if (parsed === undefined) return handleError(json)

			// todo: handle potential injections: http://media.blackhat.com/bh-us-11/Sullivan/BH_US_11_Sullivan_Server_Side_WP.pdf
			for (var i in parsed) {
				var val = parsed[i]
				if (typeof val == 'string' && config.cleanWhiteSpace) {
					val     = S(parsed[i]).collapseWhitespace().s
					val     = S(val).replaceAll("\0", '').s
					if (val != parsed[i]) {
						parsed[i] = val
					}
				}
				if (config.replace[i]) {
					delete parsed[i]
					parsed[config.replace[i]] = val
				}
			}
			data           = new Buffer(JSON.stringify(parsed), 'utf8')
			this.push(data)
		} else {
			this.push(data)
		}
		callback()
	};
}


util.inherits(JsonFixStream, stream)
module.exports = JsonFixStream
