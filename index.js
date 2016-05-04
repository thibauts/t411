var request = require('superagent');
var concat = require('concat-stream');
var toBuffer = require('typedarray-to-buffer');

var API_HOST = 'api.t411.ch';

function Client() {
  this.uid = null;
  this.token = null;
}


Client.prototype.url = function(endpoint) {
  return 'https://' + API_HOST + endpoint;
};


Client.prototype.get = function(uri, query, callback) {
  if(typeof query === 'function') {
    callback = query;
    query = null;
  }

  var req = request.get(this.url(uri));

  if(this.token) {
    req.set('Authorization', this.token);
  }

  if(query) {
    req.query(query);
  }

  req.end(responseHandler(callback));
};


Client.prototype.getBinary = function(uri, callback) {
  var req = request.get(this.url(uri));

  if(this.token) {
    req.set('Authorization', this.token);
  }

  if(typeof window !== 'undefined') {
    // If we're in the browser, we ask for an ArrayBuffer
    req.on('request', function() {
      this.xhr.responseType = 'arraybuffer';
    });
  }

  req.end(responseHandler(callback));
};


Client.prototype.post = function(uri, data, callback) {
  var req = request.post(this.url(uri));

  if(this.token) {
    req.set('Authorization', this.token);
  }

  req
    .type('application/x-www-form-urlencoded')
    .send(data)
    .end(responseHandler(callback));
};


Client.prototype.del = function(uri, callback) {
  // DELETE isn't allowed by the preflight response
  // CORS headers, but POST seems to work
  var req = request.post(this.url(uri));

  if(this.token) {
    req.set('Authorization', this.token);
  }

  req.end(responseHandler(callback));
}


Client.prototype.auth = function(username, password, callback) {
  var self = this;

  var data = {
    username: username,
    password: password
  };

  this.post('/auth', data, function(err, data) {
    if(err) return callback(err);
    self.uid = data.uid;
    self.token = data.token;
    callback();
  });
};


Client.prototype.profile = function(uid, callback) {
  this.get('/users/profile/' + uid, callback);
};


Client.prototype.categories = function(callback) {
  this.get('/categories/tree', callback);
};


Client.prototype.terms = function(callback) {
  this.get('/terms/tree', callback);
};


Client.prototype.search = function(query, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  this.get('/torrents/search/' + query, options, callback);
};


Client.prototype.download = function(id, callback) {
  return this.getBinary('/torrents/download/' + id, callback);
};


Client.prototype.top = function(type, callback) {
  this.get('/torrents/top/' + type, callback);
};


Client.prototype.top100 = function(callback) {
  this.top('100', callback);
};


Client.prototype.topToday = function(callback) {
  this.top('today', callback);
};


Client.prototype.topWeek = function(callback) {
  this.top('week', callback);
};


Client.prototype.topMonth = function(callback) {
  this.top('month', callback);
};


Client.prototype.bookmarks = function(callback) {
  this.get('/bookmarks', callback);
};


Client.prototype.createBookmark = function(id, callback) {
  this.post('/bookmarks/save/' + id, {}, callback);
};


Client.prototype.deleteBookmark = function(id, callback) {
  ids = Array.isArray(id)
    ? id.join(',')
    : id;

  this.del('/bookmarks/delete/' + ids, callback);
}


function responseHandler(callback) {
  return function(err, res) {
    if(err) return callback(err);

    if(res.type === 'application/x-bittorrent') {

      if(typeof window === 'undefined') {
        // In node, collect the response data in a Buffer and return it
        res.pipe(concat(function(data) {
          callback(null, data);
        }));
        return;
      }

      // In the browser, return the response ArrayBuffer
      return callback(null, res.body);
    }

    var data = JSON.parse(res.text);

    if(data.error) {
      var err = new Error(data.error);
      err.code = data.code;
      return callback(err);
    }

    callback(null, data);
  };
}


request.parse['application/x-bittorrent'] = function(data) {
  // This is called when in the browser only
  if(typeof window === 'undefined') {
    return data;
  }
  return toBuffer(new Uint8Array(data));
};


module.exports = Client;
