// json-fix-stream
// Fix malformed JSON stream
"use strict"
var conflate  = require('conflate') // Munge some objects together, deep by default. kommander/conflate.js
, util        = require('util')
, S           = require('string')   // jprichardson/string.js
, stream      = require('stream').Transform
if (!stream) stream = require('readable-stream').Transform // stream 2 compatible

// json string in and out
function JsonFixStream(config) {
 	stream.call(this, { objectMode: true })
	config = (config) ? config : {}
	var DEFAULT = {
		ignoreErrors: false,
		replace:      {}
	}
	config = conflate(DEFAULT, config)

	this._transform = function (data, encoding, callback) {
		if (data) {
			var parsed, json = data.toString('utf8')
			
			try {
				parsed  = JSON.parse(json)
			} catch (e) { // didn't parse, try and guess why
				json            = S(json).trim().s
				var first       = json.substr(0,1)
				var last        = json.substr(-1)
				if (first == '[') {
					json += ']'
				} else if (first == '{') {
					json += '}'
				} else {
					if (!config.ignoreErrors) this.emit('error', 'could not fix: ' + json)
					callback()
					return
				}
				try { // parsed correctly so update data
					parsed  = JSON.parse(json)
				} catch (e) {
					parsed = false
				}
				if (!parsed) {
					if (!config.ignoreErrors) this.emit('error', 'could not fix: ' + json)
					callback()
					return
				}
			} // todo: handle potential injections: http://media.blackhat.com/bh-us-11/Sullivan/BH_US_11_Sullivan_Server_Side_WP.pdf
			for (var i in parsed) {
				var val = parsed[i]
				if (typeof val == 'string') {
					val     = S(parsed[i]).replaceAll("\n", ' ').s
					val     = S(val).replaceAll("\r", ' ').s
					val     = S(val).replaceAll("\t", ' ').s
					val     = S(val).replaceAll("\0", '').s
					val     = S(val).replaceAll('   ', ' ').s
					val     = S(val).replaceAll('  ', ' ').s
					val     = S(val).trim().s
					if (val != parsed[i]) {
//						console.log('fixed:', val)
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
