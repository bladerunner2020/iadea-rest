var iadea = require('./iadea');
var Q = require('q');

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

function pause(pause) {
    var deferred =  Q.defer();
    console.log("Waiting for " + (pause || 10000) + "ms");

    setTimeout(function(){
        console.log("Pause is finished");
        deferred.resolve()
    }, pause || 10000);

    return deferred.promise;
}

function setPlayerName(newname) {
    var cfg = {name: 'info.playerName', value: newname};

    return iadea.importConfiguration(cfg, true);
}


function LogFiles(name) {
    console.log("Iadea files");

    return iadea.getFileList().then( function(data) {
        var files = data.items;
        for (var i = 0; i < files.length; i++) {
            if (!name || (files[i].downloadPath.includes(name)))
                console.log(files[i].id +'  ' + files[i].downloadPath + '  ' + 'mimeType: ' + files[i].mimeType);
               // console.log(files[i]);
        }
    });
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


function Play(name) {
    console.log("Looking for file=" + name);
    function PlayFile(file) {
        return iadea.playFile(file.downloadPath);
    }

    return iadea.findFileByName(name).
        then(PlayFile);

}


// '/Users/Bladerunner/Downloads/Iadea/Iadea Content/image2.jpg';
var path = '/Users/Bladerunner/Downloads/Iadea/Iadea Content/SMIL/SMIL/slideshow.smil';
var downloadPath = '/user-data/slideshow.smil';

var files_to_remove = [ 'D6D3D75D405542126996CE1C4CB7DD2', '9528B3C76AD913277CFA220CB191547',
    '23D8DA8C5C5DAA14C5AFF2133650CB4E', 'C5F5785761A7F733EDF04193B83D497'];



iadea.connect("192.168.2.12").
   // then(iadea.reboot).then(stop).
   // then(iadea.switchToDefault).then(log).

   then(function(){return Play('slideshow.smil')}).then(log).
   then(function() {return pause(1000)}).
   then(function(){return Play('video.smil')}).then(log).
   // then(iadea.switchToDefault).then(log).
  // then(function(){return iadea.setStart('/user-data/test.smil')}).then(log).
  //  then(function () {return iadea.deleteFiles(files_to_remove)}).then(log).

 //   then(function() {return iadea.uploadFile(path,downloadPath )}).then(log).
    then(function() {return LogFiles()}).
    then(function() {return iadea.switchDisplay(true)}).then(log).
    catch(function(err) {log(err)});





