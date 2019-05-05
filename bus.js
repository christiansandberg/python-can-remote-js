'use strict';

var EventEmitter = require('eventemitter3');

function parseBinaryMessage(data) {
    var dataview = new DataView(data);
    var type = dataview.getUint8(0);
    switch (type) {
        case 1:
            // Got a CAN message in binary format
            var flags = dataview.getUint8(14);
            var msg = {
                timestamp: dataview.getFloat64(1),
                arbitration_id: dataview.getUint32(9),
                dlc: dataview.getUint8(13),
                is_extended_id: Boolean(flags & 0x1),
                is_remote_frame: Boolean(flags & 0x2),
                is_error_frame: Boolean(flags & 0x4),
                data: new Uint8Array(data, 15)
            };
            if (flags & 0x8) {
                msg.is_fd = true;
                msg.bitrate_switch = Boolean(flags & 0x10);
                msg.error_state_indicator = Boolean(flags & 0x20);
            }
            return {type: 'message', payload: msg};
        default:
            return {type: 'unknown', payload: data};
    }
}

function Bus(url, config) {
    EventEmitter.call(this);

    var self = this;
    this.connect(url, ['can.binary+json.v1', 'can.json.v1']);
    var ws = this.websocket;
    this.url = ws.url;
    ws.binaryType = 'arraybuffer';

    ws.onopen = function () {
        self.send_event('bus_request', {config: config});
    };

    ws.onmessage = function (event) {
        var data;
        if (event.data instanceof ArrayBuffer) {
            // Got a binary message
            data = parseBinaryMessage(event.data);
        } else {
            // Got a JSON message
            data = JSON.parse(event.data);
        }
        switch (data.type) {
            case 'bus_response':
                self.channelInfo = data.payload.channel_info;
                self.emit('connect', self);
                break;
            default:
                self.emit(data.type, data.payload);
                break;
        }
    };

    ws.onerror = function (event) {
        self.emit('error', event);
    };

    ws.onclose = function (event) {
        if (!event.wasClean) {
            self.emit('error', 'Connection terminated');
        } else if (event.code > 1001) {
            self.emit('error', event.reason || 'Terminated with code ' + event.code);
        }
        self.emit('close');
    };
}

// Add event emitter functionality
Object.assign(Bus.prototype, EventEmitter.prototype);

Bus.prototype.connect = function (url, protocols) {
    this.websocket = new WebSocket(url, protocols);
};

Bus.prototype.send_event = function (event, payload) {
    var data = {type: event, payload: payload};
    this.websocket.send(JSON.stringify(data));
};

Bus.prototype.send = function (msg) {
    this.send_event('message', msg);
};

Bus.prototype.send_periodic = function (msg, period, duration) {
    this.send_event('periodic_start', {
        period: period,
        duration: duration,
        msg: msg
    });
};

Bus.prototype.stop_periodic = function (arbitration_id) {
    this.send_event('periodic_stop', arbitration_id);
};

Bus.prototype.shutdown = function () {
    this.websocket.close();
};

// Alias for shutdown()
Bus.prototype.close = Bus.prototype.shutdown;

module.exports = Bus;
