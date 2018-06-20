import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue.js';
MessageQueue.spy(info => {
  var name = `${info.module ? info.module + '.' : ''}${info.method}`;
  var exclude = [
    // 'RCTDeviceEventEmitter.emit',
    'Networking.sendRequest',
    'Timing.createTimer',
    'JSTimers.callTimers',
    'WebSocketModule.connect',
  ];
  if (!exclude.includes(name)) {
    var args = JSON.stringify(info.args).slice(1, -1);
    var exclude = [
      'didReceiveNetworkResponse',
      'didSendNetworkData',
      'didReceiveNetworkData',
      'didCompleteNetworkResponse',
      'websocketFailed',
    ];
    var skip = false;
    for (var i = 0; i < exclude.length; i++) {
      if (args.includes(exclude[i])) {
        skip = true;
        break;
      }
    }
    if (!skip) {
      // console.log(name);
      console.log(`${info.type === 0 ? 'N->JS' : 'JS->N'} : ` +
        `${info.module ? info.module + '.' : ''}${info.method}` +
        `(${JSON.stringify(info.args).slice(1, -1)})`,
      );
    }
  }
});

var elmrn = require('./elm-rn-bridge');
elmrn.prepare();
const Elm = require('./elm');
elmrn.bridge(Elm.Main);

console.log('...app.js end...');

