import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue.js';
MessageQueue.spy(info => {
  var name = `${info.module ? info.module + '.' : ''}${info.method}`;
  var exclude = [
    'RCTDeviceEventEmitter.emit',
    'Networking.sendRequest',
    'Timing.createTimer',
    'JSTimers.callTimers',
    'WebSocketModule.connect',
  ];
  if (!exclude.includes(name)) {
    // console.log(name);
    console.log(`${info.type === 0 ? 'N->JS' : 'JS->N'} : ` +
      `${info.module ? info.module + '.' : ''}${info.method}` +
      `(${JSON.stringify(info.args).slice(1, -1)})`,
    );
  }
});

import { NativeModules } from 'react-native'
// import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge.js';
// console.log(`....BB is: ${JSON.stringify(BatchedBridge)}`);
// var appreg = BatchedBridge.getCallableModule('AppRegistry');
// console.log(`....appreg is: ${JSON.stringify(appreg)}`);

console.log("...Hijacking RN app...");
import { AppRegistry } from 'react-native';
console.log(`....AR is: ${Object.keys(AppRegistry)}`);
console.log(`....AR.rR is: ${AppRegistry.registerRunnable}`);
var oldrc = AppRegistry.registerComponent;
AppRegistry.registerComponent = (a,b,c) => {
  console.log(`IN RC! ${a} / ${c}`);
  if (a === 'main') {
    var newmain = () => {
      console.log('...hijack called!...');
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

const Elm = require('./elm');
export default Elm.Main.start();
