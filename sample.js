
var iadea = require('./iadea');

var log = function(text) {console.log(text)};

function LogFiles(name) {
    console.log("Iadea files");

    return iadea.getFileList().then( function(data) {
        var files = data.items;
        for (var i = 0; i < files.length; i++) {
            if (!name || (files[i].downloadPath.includes(name)))
                // console.log(files[i].id +'  ' + files[i].downloadPath + '  ' + files[i].modifiedDate);
                console.log(files[i]);
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


var path = '/Users/Bladerunner/Downloads/Iadea/Iadea Content/SMIL/SMIL/index1.smil';
var downloadPath = '/user-data/media/index3.smil';

path = '/Users/Bladerunner/Downloads/Iadea/Iadea Content/image3.jpg';
downloadPath = '/user-data/media/index3.jpg';


iadea.connect("192.168.2.12").

   then(function(){return Play('index3.smil')}).
  // then(function(){return iadea.setStart('/user-data/index.smil')}).
    then(function () {return iadea.deleteFile('E34EB64CA5EF10E4D5C9C91A7A19A15')}).
    then(log).
    then(function() {return LogFiles()}).
    then(function() {return iadea.uploadFile(path,downloadPath )}).then(log).
    catch(function(err) {log(err)});





