/*!
 * Iadea Rest API
 * Copyright(c) 2017 Alexander Pivovarov
 * MIT Licensed
 */

/**
 * Json structure with file information.
 * @typedef {{fileSize: Number, id: String,
 *  etag: String,
 *  downloadPath: String,
 *  createdDate: String,
 *  transferredSize: Number,
 *  modifiedDate: String,
 *  mimeType: String,
 *  completed: Boolean }} IadeaFile
 *
 */

/**
 * Json structure with user settings information
 * @typedef {{userPref : [{name: String, value: String}]}} IdeaUserPref
 *
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

/**
 * Connect to device
 * @public
 * @param {String} host ip address or host name
 * @param {Number} port (optional) port number, default: 8080
 * @param {String} user (optional) user name, default: 'admin'
 * @param {String} password (optional) user password, default: ''
 *
 * @promise {{access_token: String,  -- Authorization token for further API access
 *  token_type: String,    -- Always "Bearer"
 *  expires_in: String}}   -- Number of seconds before access_token expires.
 *                            If this field is returned as an empty string, then the access token does not expire.
 *
 */
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

/**
 * Upload a file to device
 * @public
 * @param {String} filename full path to file to upload
 * @param {String} downloadPath where to upload file, e.g. '/user-data/media/test.jpg'. Should begin with /user-data/
 *
 * @promise {IadeaFile}
 * @notify {{size: Number, done: Number, percent: Number}}, size - total file size, done - uploaded so far
 */
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

    var writtenCount = 0;
    fs.createReadStream(filename, { bufferSize: 40 * 1024 })
        .on('data', function(data){
            // notify about progress
            writtenCount += data.length;
            deferred.notify({size: fileSize, done: writtenCount, percent: writtenCount/fileSize});
        })
        .on('end', function() {
            // mark the end of the one and only part
            req.end(formEnd);
        })
        // set "end" to false in the options so .end() isn't called on the request
        .pipe(req, { end: false });

    return deferred.promise;
};

/**
 * Get list of files or list of files matching filter criteria
 * @public
 * @param {String} filter
 *
 * @promise {{items:[{IadeaFile}]}} Json structure where items points to array of matching files
 */
var getFileList = function(filter) {
    var deferred = Q.defer();

    function FilterFiles(data) {
        var files = data.items;
        var found = [];
        for (var i = 0; i < files.length; i++) {
            if (files[i].downloadPath.includes(filter))
                found.push(files[i]);
        }
        deferred.resolve({items: found});
        return deferred.promise;
    }

    if (!filter)
        return call('/v2/files/find', {});

    return getFileList().then(FilterFiles);
};

/**
 * Get file by ID
 * @public
 * @param {string} id file id
 *
 * @promise {IadeaFile}
 */
var getFile = function(id) {
    return call('/v2/files/' + id);
};

/**
 * Find (first) file by name
 * @public
 * @param {string} name name of file to find
 *
 * @promise {IadeaFile}
 */
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

/**
 * Reboot player.
 * @public
 * @promise {Error}. Note: connection will be terminated and promise rejected is call. Promise resolved is never called in this case.
 */
var reboot = function() {
    return call('/v2/task/reboot');
};

/**
 * Play content once (could be media file or SMIL)
 * @public
 * @param {String | IadeaFile} file location of content or IadeaFile returned by GetFile or GetFileByName 
 *
 * @promise {{uri: String, packageName: String, className: String, action: String, type: String}}
 */
var playFile = function (file) {
    var downloadPath = file.downloadPath;

    if (typeof(file) === 'string') downloadPath = file;
    
    var play_command = {
        uri: "http://localhost:8080/v2"  + downloadPath,
        className: "com.iadea.player.SmilActivity",
        packageName: "com.iadea.player",
        action: "android.intent.action.VIEW"
    };

    return call('/v2/app/exec', play_command);
};

/**
 * Set default content to play each time player boots up
 * @public
 * @param {string} downloadPath location of content
 *
 * @promise {{uri: String, packageName: String, className: String, action: String, type: String}}
 */
var setStart = function(downloadPath) {
    var start_command = {
        uri: "http://localhost:8080/v2"  + downloadPath,
        className: "com.iadea.player.SmilActivity",
        packageName: "com.iadea.player",
        action: "android.intent.action.VIEW"
    };    

    return call('/v2/app/start', start_command);
};

/**
 * Switch to play default content (e.g. set by setStart function)
 * @public
 * @promise {{uri: String, packageName: String, className: String, action: String, type: String}}
 */
var switchToDefault = function () {
    return call('/v2/app/switch', {mode: 'start'});
};


/**
 * Delete one or more files.
 * @public
 * @param {(string|string[]|Object|Object[])} files - file ID or array of files ID or file structure or array of structures
 *
 * @promise {{}|[{}..{}]} when promise fulfilled returns empty json object or array of empty json objects
 */
var deleteFiles = function (files) {
    // Delete a file by fileID or by file Object
    function _delete(data) {
        var id = data.id;
        if (typeof(data) === 'string') id = data;

        return call('/v2/files/delete', {id:id})
    }

    if (files instanceof Array) {
        var promises = files.map(_delete);
        return Q.all(promises);
    } else {
        var id = files.id;
        if (typeof(files) === 'string') id =files;
        return _delete(id);
    }
};

/**
 * Get screenshot (not implemented?). It's poorly described in REST API.
 * @public
 * @promise {}
 */
var getScreenshot = function() {
    return call('/v2/task/screenshot');
};

/**
 * Get the firmware information on device
 * @public
 * @promise {{firmwareVersion: String, family: String}}
 */
var getFirmwareInfo = function () {
    return call('/v2/system/firmwareInfo');
};

/**
 * Get player model name and other manufacture use only information
 * @public
 * @promise {{modelDescription: String, modelName: String, modelURL: String, manufacturer: String, licenseModel: String,
 *  PCBRevision: String, manufacturerURL: String, PCB: Sring, options: [Sring] }}
 */
var getModelInfo = function () {
    return call('/v2/system/modelInfo');
};

/**
 * Checking WIFI status
 * @public
 * @promise {Boolean}
 */
var isWifiEnabled = function () {
    return call('/v2/android.net.wifi.WifiManager/isWifiEnabled');
};

/**
 * Get configuration from player
 * @public
 * @promise {IdeaUserPref} return the player configuration
 */
var exportConfiguration = function () {
    return call('/v2/task/exportConfiguration');

};

/**
 * Import new configuration to player
 * @public
 * @param {IdeaUserPref} config new configuration object ex.
 * @param {Boolean} runCommit if true commitConfiguration is called at the end
 *
 * @promise {{IdeaUserPref,    -- return newly imported configuration
 *  restartRequired: Boolean,  -- true/false , if restart is required for changes to take effect, restartRequired is true
 *  commitId: String }}        -- ID for commitConfiguration
 */
var importConfiguration = function (config, runCommit) {
    var cfg = config;
    if (cfg instanceof Array) {
        cfg = {userPref: cfg}
    } else if (typeof(cfg.userPref) == 'undefined') {
        cfg = {userPref: [config]}
    }

    if (!runCommit)
        return call('/v2/task/importConfiguration', cfg);


    return call('/v2/task/importConfiguration', cfg).then(commitConfiguration);
};

/**
 * Commit new configuration to playerr
 * @public
 * @param {String | Object} data Commit Id or Object returned by importConfiguration
 *
 * @promise {{ restartRequired: Boolean,    -- true/false , if restart is required for changes to take effect, restartRequired is true
 *  commitId: String }}                     -- ID for commitConfiguration
 */
var commitConfiguration = function(data) {
    var commitId = data.commitId;

    if (typeof(data) === 'string')
        commitId = data;

    return call('/v2/task/commitConfiguration', {commitId: commitId});

};


/**
 * Turn display on or off
 * @public
 * @param {Boolean} on - true if on
 *
 * @promise {{id: Number, power: Boolean}} id is always 0, power - last state of the screen (that was before switchDisplay is caleld)
 */
var switchDisplay = function (on) {
    var power = 'standby';
    if (on) power = 'on';

    var command = {id: 0, power: power};

    return call('/v2/hardware/display', command);
};

/**
 * Performe call to Iadea REST API
 * @private
 * @param {String} uri REST API command
 * @param {Object} data - parameters
 * @param {String} contentType - optional. default ('application/json')
 *
 * @promise {Json} when promise fulfilled returns json object with output data
 */
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
        // If reboot is run. 'ECONNRESET' (scocket hang up) error is thrown.
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
exports.switchToDefault = switchToDefault;
exports.getScreenshot = getScreenshot;
exports.getFirmwareInfo = getFirmwareInfo;
exports.getModelInfo = getModelInfo;
exports.isWifiEnabled = isWifiEnabled;
exports.exportConfiguration = exportConfiguration;
exports.importConfiguration = importConfiguration;
exports.switchDisplay = switchDisplay;
