'use strict';

var EventEmitter = require('events');
var WebSocket = require('ws');
var RemoteBus = require('./bus.js').Bus;

function NodeRemoteBus(url, config) {
    RemoteBus.call(this, url, config);
}

NodeRemoteBus.prototype = Object.create(RemoteBus.prototype);
NodeRemoteBus.prototype.constructor = NodeRemoteBus;

// Inherit from EventEmitter for better event handling
Object.assign(NodeRemoteBus.prototype, EventEmitter.prototype);

// Override connect funtion to work with 'ws' package
NodeRemoteBus.prototype.connect = function (url) {
    if (url instanceof WebSocket) {
        // A WebSocket instance was passed to the constructor
        // Could be used in a server environment
        this.websocket = url;
    } else {
        this.websocket = new WebSocket(url, this.protocols);
    }
};

module.exports.Bus = NodeRemoteBus;
