# json-fix-stream

Fix malformed JSON stream 

## Install :hammer:

```sh
npm install json-fix-stream
```

## Usage :bulb:

attandance.json

```json
{"name":"joe", "city":"Portland", "comment":"this is great"}
{"name":"trouble", "city":"Near You", "comment":"i like to add
newlines in my
comments"}
```

```js
split         = new require('split')("}\n") // parse json with newlines in attributes
jsonFixStream = new require('json-fix-stream') // fix the nixed } at the end of each line
inStream      = require('fs').createReadStream('attandance.json')
inStream.pipe(split).pipe(fix).pipe(process.stdout) // each record is sucessfully parsed and output
```



## Contributions :muscle:

:smile: Feedback, problem reports, enhancement requests are welcome.

:up: Example code are better.

:cool: Pull requests are best.

## License

### MIT
