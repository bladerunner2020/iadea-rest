
var iadea = require('./iadea');

var log = function(text) {console.log(text)};

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

function Play(name) {
    console.log("Looking for file=" + name);
    function PlayFile(file) {
        return iadea.playFile(file.downloadPath);
    }

    return iadea.findFileByName(name).
        then(PlayFile);

}


var path = '/Users/Bladerunner/Downloads/Iadea/Iadea Content/SMIL/SMIL/index1.smil';
var downloadPath = '/user-data/media/index3.smil';

var files_to_remove = ['59F0EDFEE48072AD2B4624A92D7394C0',
    'BB786361D6C57E3F6A11D2140A6CCBA',
    'AFFF4AF6C879BD634AD67B241477F79',
    'BAB9B64A4F94FA1B9429B323A3A3E869',
    'C55FABD8B25CB4427764113FBA7CCE',
    '6324FAC6DD4928720E5EB22B25D4CE2'];

path = '/Users/Bladerunner/Downloads/Iadea/Iadea Content/image2.jpg';
downloadPath = '/user-data/media/image2.jpg';


iadea.connect("192.168.2.12").

   then(function(){return Play('index3.smil')}).
  // then(function(){return iadea.setStart('/user-data/index.smil')}).
  //  then(function () {return iadea.deleteFiles(files_to_remove)}).
    then(log).
    then(function() {return LogFiles()}).
//    then(function() {return iadea.uploadFile(path,downloadPath )}).then(log).
    catch(function(err) {log(err)});





