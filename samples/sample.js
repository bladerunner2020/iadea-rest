var iadea_device = require('../iadea-rest');
var Q = require('q');
var fs = require('fs');

var log = function(text) {
    var deferred =  Q.defer();
    console.log(text);
    deferred.resolve();
    return deferred.promise;
};

function stop() {
    var deferred =  Q.defer();
    deferred.reject(new Error("Aborted by function 'stop'"));
    return deferred.promise;
}

function pause() {
    var deferred =  Q.defer();
    console.log("Waiting for " + 5000 + "ms");

    setTimeout(function(){
        console.log("Pause is finished");
        deferred.resolve()
    },  5000);

    return deferred.promise;
}

function setPlayerName(newname) {
    var cfg = {name: 'info.playerName', value: newname};

    return iadea.importConfiguration(cfg, true);
}


function LogFiles(name, type) {
    console.log("Iadea files");

    return iadea.getFileList(name).then( function(data) {
        var files = data.items;
        for (var i = 0; i < files.length; i++) {
            switch (type) {
                case 1:
                    console.log(files[i].id +'  ' + files[i].downloadPath + '  ' + 'mimeType: ' + files[i].mimeType);
                    break;
                default:
                    console.log(files[i]);
            }

        }
    });
}

function PrintAllSizes() {
    function printSize(data) {
        var files = data.items;
        var size = 0;
        for (var i = 0; i< files.length; i++) {
            size += files[i].fileSize;
        }

        console.log("Total file size = " + (size/1024/1024/1024).toFixed(2) + 'Gb (' + size + ')');
    }
    return iadea.getFileList().then(printSize);
}


function LogFilesIDs(filter) {
    var ids = [];
    return iadea.getFileList().then(function(data) {
        var files = data.items;
        for (var i=0; i < files.length; i++) {
            if (files[i].downloadPath.includes(filter)) {
                ids.push(files[i].id );
            }
        }
        console.log(ids);
    });
}

function DeleteFilesByFilter(filter) {
    return iadea.getFileList(filter).then(iadea.deleteFiles);
}



function Play(name) {
    console.log("Looking for file=" + name);
    function PlayFile(file) {
        return iadea.playFile(file.downloadPath);
    }

    return iadea.findFileByName(name).
    then(PlayFile);

}


// '/Users/Bladerunner/Downloads/Iadea/Iadea Content/image2.jpg';
// '/Users/Bladerunner/Downloads/Iadea/Iadea Content/SMIL/SMIL/video.smil'
var path = '/Users/Bladerunner/Downloads/Iadea/Iadea Content/SMIL/SMIL/slideshow.smil';
var downloadPath = '/user-data/slideshow.smil';

var files_to_remove = [ '5AB3834E5F8D15CD2B1A75CC58778EA','EB3CEDD36EC979F1F5CD1526BD82DC5'];


var content =['image1.jpg', 'image2.jpg', 'image3.jpg', 'video.smil'];

function PlayContent() {
    function PlayWithPause(name) {
        return Play(name).then(pause);
    }

    var lastPromise = content.reduce(function(promise, d) {
        return promise.then(function() {
            return PlayWithPause(d);
        });
    }, Q.resolve());

    return lastPromise;
}

var ImageFile = require('image-file');
function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function writeScreenShot(data) {
    var arr = str2ab(data);
    var image = new ImageFile(arr);
    fs.writeFile('helloworld.jpg', data, 'binary', function (err) {

        if (err) return console.log(err);
        console.log('Hello World > helloworld.txt');
    });

}

function notifyMe() {
    var event = "start2";
    return iadea.notify(event);

}

var iadea = iadea_device.createDevice('192.168.2.23');


//iadea.checkOnline().then(log);


iadea.connect().then(log)
//    .then(function () {return iadea.enableAutoStart(true)}).then(log)
//    .then(PlayContent).then(stop)
//    .then(iadea.exportConfiguration).then(log)
//    .then(iadea.storageInfo).then(log)
//    .then(function() {return iadea.getFileList('jpeg', 'mimeType')}).then(log)
//    .then(notifyMe).then(log)
//    .then(iadea.getScreenshot).then(writeScreenShot)
//    .then(iadea.reboot).then(stop)
//    .then(iadea.switchToDefault).then(log)
//    .then(function(){return Play('vide1.smil')}).then(log)
//    .then(function(){return iadea.playFile('http://192.168.2.29:8000/SMIL/show.smil')}).then(log)
//    .then(iadea.switchToDefault).then(log)
//    .then(function(){return iadea.setStart('/user-data/slideshow.smil')}).then(log)
//    .then(iadea.switchToDefault)
//    .then(function () {return DeleteFilesByFilter('video2.smil')}).then(log)
//    .then(function() {return iadea.uploadFile(path,downloadPath ).progress(function(progress){console.log(progress);})}).then(log)
//    .then(function() {return LogFiles(null, 1)})
//    .then(function() { return iadea.switchDisplay(true) }).then(log)
    .then(function(){ return iadea.setColor('#FF0000')}).then(log)
 //   .then(iadea.getFirmwareInfo).then(log)
    .catch(function(err) {
        console.log('error!!!');
        log(err)
    });






