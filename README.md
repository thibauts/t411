t411
====
### T411 API client

A client for the [T411 API](https://api.t411.io/) that works both in node and the browser with [browserify](http://browserify.org).

Install
-------

```bash
$ npm install t411
```

Usage
-----

```javascript
var T411 = require('t411');

var client = new T411();

client.auth('your-username', 'your-password', function(err) {
  if(err) throw err;

  // search torrents
  client.search('interstellar', function(err, result) {
    if(err) throw err;
    console.log(result);
  });

  // download and parse a .torrent
  client.download(id, function(err, buf) {
    // `buf` is a Buffer in node as well as in the browser
    var parsed = require('parse-torrent')(buf);
    console.log(parsed);
  });

  // All the methods provided by the API are implemented (categories,
  // terms, tops, bookmarks). For advanced use check the source code, 
  // it should be pretty easy to read :)
});
```