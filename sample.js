
var iadea = require('./iadea');

var log = function(text) {console.log(text)};

function LogFiles(name) {
    console.log("Iadea files");

    return iadea.getFileList().then( function(data) {
        var files = data.items;
        for (var i = 0; i < files.length; i++) {
            if (!name || (files[i].downloadPath.includes(name)))
                console.log(files[i].id +'  ' + files[i].downloadPath + '  ' + files[i].modifiedDate);
        }
    });
}

function Play(name) {
    //var name = "ADAMAS_MAY_NOADR_2.0a2469fb";

    console.log("Looking for file=" + name);


    function PlayFile(file) {

        return iadea.playFile(file.downloadPath);
    }

    return iadea.findFileByName(name).
        then(PlayFile);

}


//iadea.connect("192.168.2.12").
//    then(iadea.reboot).
//    then(log).
//    catch(function(err) {log(err)});





iadea.connect("192.168.2.12").

   then(function(){return Play('index1.smil')}).
  // then(function(){return iadea.setStart('/user-data/index.smil')}).
  //  then(function () {return iadea.deleteFile('E41EE8889550CA27D0ADA567A3849CFB')}).
    then(log).
    then(function() {return LogFiles()}).
    catch(function(err) {log(err)});


setTimeout(function () {iadea.uploadFile("test");

}, 1000);


