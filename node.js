'use strict';

var WebSocket = require('ws');
var BusBase = require('./bus.js');

function Bus(url, config) {
    BusBase.call(this, url, config);
}

Bus.prototype = Object.create(BusBase.prototype);
Bus.prototype.constructor = Bus;

// Override connect funtion to work with 'ws' package
Bus.prototype.connect = function (url) {
    if (url instanceof WebSocket) {
        // A WebSocket instance was passed to the constructor
        // Could be used in a server environment
        this.websocket = url;
    } else {
        this.websocket = new WebSocket(url, this.protocols);
    }
};

module.exports = Bus;
