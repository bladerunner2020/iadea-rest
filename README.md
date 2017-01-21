# README #

A JavaScript library that provides REST API interface for Iadea media players and signboards. This library uses Q promises.


### Installation ###

```sh
npm install iadea-rest
```

### Usage examples ###
To use Iadea REST API library

Require 'iadea-reset' in your file:

```js
var iadea = require('iadea-rest');
```
Connect to Iadea device and perform API calls:
   
```js
iadea.connect(host).
    then(iadea.getModelInfo).
    then(console.log).
    then(iadea.getFirmwareInfo).
    then(console.log).
    catch(console.log);
```

To play a file:
```js
iadea.connect(host).
    then(function(){return iadea.playFile('/user-data/test.smil')}).
    then(console.log).
    catch(console.log);
``` 
It is possible to combine findFileByName adn playFile:
```js
iadea.connect(host).
    then(function () {return iadea.findFileByName('slideshow.smil')}).
    then(iadea.playFile).
    then(console.log).
    catch(console.log); 
``` 
   

### Contribution ###

If you would like to contribute, please fork the repo and send in a pull request.

### License ###

(The MIT License)
Copyright (c) 2017 Alexander Pivovarov <pivovarov@gmail.com>