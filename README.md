python-can remote for JavaScript
================================

This package adds [CAN](https://en.wikipedia.org/wiki/CAN_bus) capabilities 
to JavaScript by communicating with the
[python-can](https://github.com/hardbyte/python-can) server over WebSocket.
It works both in [Node.js](https://nodejs.org/) and in modern
[browsers](http://caniuse.com/#feat=websockets).


Quick start
-----------

Install [python-can](https://pypi.python.org/pypi/python-can) on the computer 
hosting the physical CAN-bus:

```shell
$ pip install python-can>=2
```

Start the server and specify which interface and channel to share.
Many interfaces are supported. See the
[documentation](https://python-can.readthedocs.io/en/latest/interfaces.html)
for python-can.

```shell
$ python -m can.server --interface socketcan --channel can0
$ python -m can.server --interface kvaser --channel 0 --bitrate 500000
$ python -m can.server --interface pcan --channel PCAN_USBBUS1 --bitrate 500000
$ python -m can.server --interface ixxat --channel 0 --bitrate 500000
```

```javascript
var Bus = require('python-can-remote').Bus;

// Any configuration options will be passed as is when connecting to the bus
var config = {receive_own_messages: true};
var bus = new Bus('ws://localhost:54701/', config);

bus.on('connect', function () {
    console.log('Connected to ' + bus.channelInfo + ' on ' + bus.url);
    bus.send({
        arbitration_id: 0xabcdef,
        extended_id: true,
        is_remote_frame: false,
        data: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]
    });
});

bus.on('message', function (msg) {
    console.log(msg);
});

bus.on('error', function (error) {
    console.error(error);
});

bus.on('close', function () {
    console.log('Connection closed');
});

setTimeout(function () {
    console.log('Closing connection');
    bus.shutdown();
}, 2000);
```
