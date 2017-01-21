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
var path = '/Users/Bladerunner/Downloads/Iadea/Iadea Content/image1.jpg';
var downloadPath = '/user-data/media/test.jpg';

var files_to_remove = [ '5AB3834E5F8D15CD2B1A75CC58778EA','EB3CEDD36EC979F1F5CD1526BD82DC5'];



iadea.connect("192.168.2.12").
    // then(iadea.reboot).then(stop).
    // then(iadea.switchToDefault).then(log).
    then(function(){return Play('video.smil')}).then(log).
    // then(iadea.switchToDefault).then(log).
    // then(function(){return iadea.setStart('/user-data/test.smil')}).then(log).
    //  then(function () {return DeleteFilesByFilter('test.jpg')}).then(log).

    //    then(function() {return iadea.uploadFile(path,downloadPath ).progress(function(progress){
    //        console.log(progress);
    //    })}).then(log).
    then(function() {return LogFiles()}).
    //  then(function() {return iadea.switchDisplay(true)}).then(log).
    then(iadea.getModelInfo).then(log).
    catch(function(err) {log(err)});
