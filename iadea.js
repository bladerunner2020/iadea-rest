/*!
 * Iadea Rest API
 * Copyright(c) 2017 Alexander Pivovarov
 * MIT Licensed
 */

/**
 * Module dependencies.
 * @private
 */

var http = require('http');
var Q = require('q');
var fs = require('fs');


/**
 * Access token
 * @private
 */

var access_token = null;
var iadea_host = null;
var iadea_port = null;

var IADEA_TIMEOUT = 5000;

var connect = function(host, port, user, password) {
    iadea_host = host;
    iadea_port = (port || 8080);

    var data = {
        grant_type: 'password',
        username: user || 'admin',
        password: password || ''};


    return call('/v2/oauth2/token', data).
        then(function (res){
            access_token = res.access_token;
            console.log('access_token=' + access_token);
        });
};

var uploadFile = function (filename, downloadPath) {
    var deferred = Q.defer();
    var mimeType = '';
    var modified = '';
    var fileSize = 0;

    var extension = filename.split('.').pop();
    switch (extension) {
        case 'jpg' :
        case 'jpeg':
            mimeType = 'image/jpeg';
            break;
        case 'png' :
            mimeType = 'image/png';
            break;
        case 'mp4':
            mimeType = 'video/mp4';
            break;
        case "mpe":
        case "mpeg":
        case "mpg":
            mimeType = 'video/mpeg';
            break;
        case "avi":
            mimeType = 'video/x-msvideo';
            break;
        case "wmv":
            mimeType = 'video/x-ms-wmv';
            break;
        case "divx":
            mimeType = 'video/x-divx';
            break;
        case "mov":
            mimeType = 'video/quicktime';
            break;
        case 'smil':
        case 'smi':
            mimeType = 'application/smil';
            break;
        case "txt":
            mimeType = 'text/plain';
            break;
        case "mp3":
            mimeType = 'audio/mpeg';
            break;
        default:
            console.log('Unknown mimeType = ' + extension);
    }

    try {
        var stats = fs.statSync(filename);
        fileSize = stats['size'];
        modified = stats['mtime'];
    } catch (err) {
        // file not found or other file access error
        deferred.reject(err);
        return deferred.promise;
    }

    var options = {
        host: iadea_host,
        port: iadea_port,
        path: '/v2/files/new?access_token=' + access_token,
        method: 'POST'};

    var req = http.request(options, function(response) {
        var data = '';
        response.on('data', function (chunk) {
            data += chunk;
        });

        response.on('end', function () {
            console.log(data);
            deferred.resolve(data);
        });
    });

    var boundaryKey = Math.random().toString(16); // random string
    req.setHeader('Content-Type', 'multipart/form-data; boundary="'+boundaryKey+'"');

    var formStart =
        '--' + boundaryKey + '\r\n'
        + 'Content-Disposition: form-data; name="downloadPath"\r\n\r\n'
        + downloadPath + '\r\n'
        + '--' + boundaryKey + '\r\n'
        + 'Content-Disposition: form-data; name="fileSize"\r\n\r\n'
        + fileSize + '\r\n'
        +  '--' + boundaryKey + '\r\n'
        + 'Content-Disposition: form-data; name="mimeType"\r\n\r\n'
        + mimeType + '\r\n'
        +  '--' + boundaryKey + '\r\n'
        + 'Content-Disposition: form-data; name="modifiedDate"\r\n\r\n'
        + modified + '\r\n'
        +  '--' + boundaryKey + '\r\n'
        + 'Content-Disposition: form-data; name="data"; filename=""\r\n'
        +' Content-Type: application/octet-stream\r\n\r\n';

    var formEnd = '\r\n--' + boundaryKey + '--';

    var contentLength = formStart.length + formEnd.length + fileSize;
    req.setHeader('Content-Length',contentLength);

    req.write(formStart);

    fs.createReadStream(filename, { bufferSize: 4 * 1024 })
        .on('end', function() {
            // mark the end of the one and only part
            req.end(formEnd);
        })
        // set "end" to false in the options so .end() isn't called on the request
        .pipe(req, { end: false });

    return deferred.promise;
};


var playFile = function (downloadPath) {
    var play_command = {
        uri: "http://localhost:8080/v2"  + downloadPath,
        className: "com.iadea.player.SmilActivity",
        packageName: "com.iadea.player",
        action: "android.intent.action.VIEW"
    };
    
    return call('/v2/app/exec', play_command);
};


var getFileList = function() {
    return call('/v2/files/find', {});
};


var getFile = function(id) {
    return call('/v2/files/' + id);
};

var findFileByName = function (name) {
    return getFileList().
        then(function(data){
            var files = data.items;
            for (var i = 0; i < files.length; i ++) {
                if (files[i].downloadPath.includes(name)) {
                    return getFile(files[i].id);
                }
            }

            throw new Error("Error. File not exist - " + name);

        });

};

var reboot = function() {
    return call('/v2/task/reboot');
};

var setStart = function(downloadPath) {
    var start_command = {
        uri: "http://localhost:8080/v2"  + downloadPath,
        className: "com.iadea.player.SmilActivity",
        packageName: "com.iadea.player",
        action: "android.intent.action.VIEW"
    };    

    return call('/v2/app/start', start_command);
};

var deleteFiles = function (files) {
    function _delete(id) {
        return call('/v2/files/delete', {id:id})
    }

    if (files instanceof Array) {
        var promises = files.map(_delete);
        return Q.all(promises);
    } else
        return _delete(files);
};


var call = function(uri, data, contentType) {
    var deferred = Q.defer();

    if ((!access_token) && (uri != '/v2/oauth2/token')) {
        var err = new Error("Error. Access token is required.");
        deferred.reject(err);
        return deferred.promise;
    }

    var options = {
        host: iadea_host,
        port: iadea_port,
        path: uri,
        method: (data) ? 'POST': 'GET',
        headers: {'Content-Type': (contentType || 'application/json')}
    };

    if (access_token) options.path += '?access_token=' + access_token;

    var req = http.request(options, function(response) {
        var data = '';
        response.on('data', function (chunk) {
            data += chunk;
        });

        response.on('end', function () {
            try {
                data = JSON.parse(data);
                deferred.resolve(data);
            } catch(err) {
                deferred.reject(new Error("Error. JSON is expected as output."))
            }

        });
    });

    req.on('error', function(err) {
        deferred.reject(err);
    });

    req.setTimeout(IADEA_TIMEOUT, function(){
        this.abort();
    }.bind(req));

    if (data) req.write(JSON.stringify(data));

    req.end();

    return deferred.promise;
};


exports.connect = connect;
exports.getFileList = getFileList;
exports.getFile = getFile;
exports.findFileByName = findFileByName;
exports.playFile = playFile;
exports.reboot = reboot;
exports.setStart = setStart;
exports.deleteFiles = deleteFiles;
exports.uploadFile = uploadFile;
