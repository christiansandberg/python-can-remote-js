(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Bus = factory().Bus;
  }
}(this, function () {
'use strict';

function parseBinaryMessage(data) {
    var dataview = new DataView(data);
    var type = dataview.getUint8(0);
    if (type == 1) {
        /* Got a CAN message in binary format */
        var flags = dataview.getUint8(14);
        return {
            timestamp: dataview.getFloat64(1),
            arbitration_id: dataview.getUint32(9),
            dlc: dataview.getUint8(13),
            extended_id: Boolean(flags & 0x1),
            is_remote_frame: Boolean(flags & 0x2),
            is_error_frame: Boolean(flags & 0x4),
            data: new Uint8Array(data, 15)
        };
    } else {
        return null;
    }
}

function RemoteBus(url, config) {
    this._callbacks = {
        connect: [],
        message: [],
        error: [],
        close: []
    };
    var self = this;
    this.protocols = ['can.binary+json.v1', 'can.json.v1'];
    this.connect(url);
    var ws = this.websocket;
    this.url = ws.url;
    ws.binaryType = 'arraybuffer';

    ws.onopen = function () {
        self.send_obj('bus_request', {config: config});
    };

    ws.onmessage = function (event) {
        if (event.data instanceof ArrayBuffer) {
            /* Got a binary message */
            var msg = parseBinaryMessage(event.data);
            if (msg) {
                self.emit('message', msg);
            }
        } else {
            /* Got a JSON message */
            var data = JSON.parse(event.data);
            switch (data.type) {
                case 'bus_response':
                    self.channelInfo = data.payload.channel_info;
                    self.emit('connect', self);
                    break;
                default:
                    self.emit(data.type, data.payload);
                    break;
            }
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

RemoteBus.prototype.connect = function (url) {
    this.websocket = new WebSocket(url, this.protocols);
};

RemoteBus.prototype.on = function (event, handler) {
    this._callbacks[event].push(handler);
};

RemoteBus.prototype.emit = function (event, data) {
    var callbacks = this._callbacks[event];
    for (var i = 0; i < callbacks.length; i++) {
        callbacks[i](data);
    }
};

RemoteBus.prototype.send_obj = function (event, payload) {
    var data = {type: event, payload: payload};
    this.websocket.send(JSON.stringify(data));
};

RemoteBus.prototype.send = function (msg) {
    this.send_obj('message', msg);
};

RemoteBus.prototype.send_periodic = function (msg, period, duration) {
    this.send_obj('periodic_start', {
        period: period,
        duration: duration,
        msg: msg
    });
};

RemoteBus.prototype.shutdown = function () {
    this.websocket.close();
};

return {Bus: RemoteBus};

}));
