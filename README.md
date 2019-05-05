python-can remote for JavaScript
================================

This package adds [CAN](https://en.wikipedia.org/wiki/CAN_bus) capabilities 
to JavaScript by communicating with the
[python-can-remote](https://github.com/christiansandberg/python-can-remote) server over WebSocket.
It works both in [Node.js](https://nodejs.org/) and in modern
[browsers](http://caniuse.com/#feat=websockets).


Quick start
-----------

Install [python-can](https://pypi.python.org/pypi/python-can) on the computer 
hosting the physical CAN-bus:

```shell
$ pip install python-can
```

Start the server and specify which interface and channel to share.
Many interfaces are supported. See the
[documentation](https://python-can.readthedocs.io/en/latest/interfaces.html)
for python-can.

```shell
$ python -m can_remote --interface=socketcan --channel=can0
$ python -m can_remote --interface=kvaser --channel=0 --bitrate=500000
$ python -m can_remote --interface=pcan --channel=PCAN_USBBUS1 --bitrate=500000
$ python -m can_remote --interface=ixxat --channel=0 --bitrate=500000
```

When using Node.js or a bundler like [webpack](https://webpack.js.org/) or 
[browserify](http://browserify.org), install this package as a dependency to 
your project.

```shell
$ npm install --save python-can-remote
```

Alternatively you can include this in a script tag in your HTML.
```html
<script src="https://unpkg.com/python-can-remote"></script>
```

Here is an example of what you can do:

```javascript
// Skip this if you have included it as a script tag earlier
var Bus = require('python-can-remote');

// Any configuration options will be passed as is when connecting to the bus
var config = {
    can_filters: [
        {can_id: 0x123, can_mask: 0xfff, extended: false}
    ],
    receive_own_messages: true
};
var bus = new Bus('ws://localhost:54701/', config);

bus.on('connect', function () {
    console.log('Connected to ' + bus.channelInfo + ' on ' + bus.url);

    // Send once
    bus.send({
        arbitration_id: 0xabcdef,
        extended_id: true,
        is_remote_frame: false,
        data: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]
    });

    // Send periodic with 10 ms
    var msg = {
        arbitration_id: 0x123,
        extended_id: false,
        is_remote_frame: false,
        data: [0xff, 0xff, 0xff]
    };
    bus.send_periodic(msg, 0.01);
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
