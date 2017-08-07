'use strict';

var WebSocket = require('ws');
var Bus = require('./bus.js');

// Override connect funtion to work with 'ws' package
Bus.prototype.connect = function (url, protocols) {
    if (url instanceof WebSocket) {
        // A WebSocket instance was passed to the constructor
        // Could be used in a server environment
        this.websocket = url;
    } else {
        this.websocket = new WebSocket(url, protocols);
    }
};

module.exports = Bus;
