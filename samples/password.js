var iadea = require('../index').createDevice('192.168.2.110', 8080, 'admin', 'pass');
var Q = require('q');

var log = function(text) {
    var deferred =  Q.defer();
    console.log(text);
    deferred.resolve();
    return deferred.promise;
};

var logError = function (err) {
    return log(err.message);
};

var pass = 'auvix';

function setPassword() {
    return iadea.setPassword(pass);
}

iadea
    .connect()
    .then(setPassword)
    .then(log)
    .catch(logError);


