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

// document = 'Hello doc!';
var elmrn = require('./hijack0');
elmrn.prepare();
const Elm = require('./elm');
elmrn.bridge(Elm.Main);

/*
import { NativeModules } from 'react-native'

// console.log(`...RN is: ${Object.keys(require('react-native')).sort()}`);

console.log("...Hijacking RN app...");
import { AppRegistry } from 'react-native';
import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge.js';
// console.log(`....AR is: ${Object.keys(AppRegistry)}`);
// console.log(`....AR.rR is: ${AppRegistry.registerRunnable}`);
var oldrc = AppRegistry.registerComponent;
AppRegistry.registerComponent = (a,b,c) => {
  // console.log(`IN RC! ${a} / ${c}`);
  if (a === 'main') {
    var newmain = (appParameters) => {
      console.log('...hijack called!...');
      var rcevt = BatchedBridge.getCallableModule('RCTEventEmitter');
      // console.log(`...BB.gCM RCTEE = ${Object.keys(rcevt).sort()}`);
      // console.log(`...BB.gCM RCTEE = ${JSON.stringify(rcevt)}`);
      Elm.Main.run(appParameters);
      NativeModules.DialogManagerAndroid.showAlert(
        {title: 'hi raw'},
        errorMessage => console.warn(errorMessage),
        (action, buttonKey) => { false },
      );
    }
    // TODO(akavel): choice below seems to depend on RN version? or what?
    // return AppRegistry.registerRunnable(a, {run: newmain});
    return AppRegistry.registerRunnable(a, newmain);
  }
  return oldrc(a,b,c);
};
console.log('...attempted hijack end');
*/
console.log('...app.js end...');

