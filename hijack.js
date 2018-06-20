// TODO(akavel): "use strict"; ?
// TODO(akavel): wrap this in some kind of module construct from JS

// import { NativeModules } from 'react-native'
// import { AppRegistry } from 'react-native';
// import BatchedBridge from 'react-native/Libraries/BatchedBridge/BatchedBridge.js';

// TODO(akavel): expose 'hijack' function, taking Elm.Main as parameter
//  - create a fake 'document' and inject it into Elm
//    -> we probably must do that before any `require('./elm')` ?
//  - use below registerComponent trick to inject Elm.Main
//
//  Expected usage:
//  a)
//    var hijack = require('elm-rn-hijack');
//    hijack.globalDocument();  // or: hijack.DOM();
//    var Elm = require('./elm');
//    hijack.run(Elm.Main);     // or: hijack.bridge(...);  or: hijack.main(...);
//  b)
//    var hijack = require('elm-rn-hijack');
//    hijack.elm('./elm');

// bridge connects an Elm program to a React Native root element.
// WARNING: Bridge works by exploiting low level internal mechanisms of both
// Elm and React Native / Expo. It is thus potentially highly fragile and
// dependant on exact versions of Elm, RN and Expo. Currently, bridge is tested
// to work with: Elm 0.18, RN 0.55, Expo [TODO].[TODO].
function bridge(elmMainModule)
{
  // Intercept all calls to AppRegistry.registerComponent(). If a caller (RN
  // runtime) tries to register a 'main' function, inject our own function
  // instead.
  import { AppRegistry } from 'react-native';
  var oldf = AppRegistry.registerComponent;
  AppRegistry.registerComponent = function(appKey, componentProvider, section)
  {
    if (appKey !== 'main')
    {
      // Default behavior - run original registerComponent.
      return oldf(appKey, componentProvider, section);
    }
    var main = function(appParameters)
    {
      var fakeDOM = new ExpoDOM(appParameters.rootTag);
      fakeDOM.inflated = true;
      // TODO(akavel): will this work?
      // TODO(akavel): split DOM node functionalities from DOM document functionalities
      global.document = fakeDOM;
      elmMainModule.embed(fakeDOM);
    };
    // TODO(akavel): choice below seems to depend on RN version? or what?
    // return AppRegistry.registerRunnable(a, {run: newmain});
    return AppRegistry.registerRunnable(a, newmain);
  };
}


// TODO(akavel): make sure I'm not shooting myself in the foot somehow as a JS newb :/
function ExpoDOM(tag)
{
  this.tag = tag;
  this.childNodes = [];
}

// TODO(akavel): makeStepper(), setTimeout(), applyEvents()

ExpoDOM.prototype.inflate = function()
{
  if (this.parentNode && this.parentNode.inflated && !this.inflated)
  {
    RN.UIManager.createView(this.tag, this.name, this.root, this.attrs);
    this.inflated = true;
    var childTags = [];
    for (var i = 0; i < this.childNodes.length; i++)
    {
      var child = this.childNodes[i];
      child.inflate();
      childTags.push(child.tag);
      // RN.UIManager.manageChildren(this.tag, [], [], [child.tag], [i], []);
    }
    // NOTE(akavel): optimization attempt; if this makes problems, try reverting to manageChildren above
    if (childTags.length > 0)
    {
      RN.UIManager.setChildren(this.tag, childTags);
    }
  }
}
ExpoDOM.prototype.orphanize = function()
{
  // TODO(akavel): just: `if (this.parentNode)` ?
  if (this.inflated && this.parentNode)
  {
    this.parentNode.removeChild(this);
  }
}
ExpoDOM.prototype.resetLast = function()
{
  var n = this.childNodes.length;
  if (n > 0)
  {
    this.lastChild = this.childNodes[n-1];
  }
  else
  {
    delete this.lastChild;
  }
}

ExpoDOM.prototype.createDocumentFragment = function()
{
  return new ExpoDOM('FRAG');
}
ExpoDOM.prototype.appendChild = function(child)
{
  this.inflate();
  if (child.tag === 'FRAG')
  {
    // TODO(akavel): optimize this
    for (var i = 0; i < child.childNodes.length; i++)
    {
      this.appendChild(child.childNodes[i]);
    }
    return;
  }
  child.orphanize();
  this.childNodes.push(child);
  child.parentNode = this;
  this.lastChild = child;
  child.inflate();
  if (this.inflated)
  {
    RN.UIManager.manageChildren(this.tag, [], [], [child.tag], [this.childNodes.length-1], []);
  }
}
ExpoDOM.prototype.insertBefore = function(newNode, refNode)
{
  if (refNode === null)
  {
    return this.appendNode(newNode);
  }
  var i = this.childNodes.indexOf(refNode);
  // FIXME(akavel): verify this behaves OK if child is not on the list (and also if it is on the list)
  if (i > -1)
  {
    newNode.orphanize();
    this.childNodes.splice(i, 0, newNode);
    newNode.parentNode = this;
    this.resetLast();
    newNode.inflate();
    if (this.inflated)
    {
      RN.UIManager.manageChildren(this.tag, [], [], [newNode.tag], [i], []);
    }
  }
}
ExpoDOM.prototype.removeChild = function(child)
{
  // FIXME(akavel): verify this behaves OK if child is not on the list (and also if it is on the list)
  var i = this.childNodes.indexOf(child);
  if (i > -1)
  {
    this.childNodes.splice(i, 1);
    delete child.parentNode;
    if (this.inflated)
    {
      // FIXME(akavel): verify below does deallocate when needed, and doesn't when not needed...
      RN.UIManager.manageChildren(this.tag, [], [], [], [], [i]);
    }
  }
  this.resetLast();
}
ExpoDOM.prototype.replaceChild = function(newChild, oldChild)
{
  // newChild.orphanize();
  // FIXME(akavel): verify this behaves OK if child is not on the list (and also if it is on the list)
  var i = this.childNodes.indexOf(oldChild);
  if (i > -1)
  {
    // TODO(akavel): optimize
    this.insertBefore(newChild, oldChild);
    this.removeChild(oldChild);
    // this.childNodes[i] = newChild;
    // newChild.parentNode = this;
    // delete oldChild.parentNode;
    // newChild.inflate();
    // if (this.inflated)
    // {
    // 	// FIXME(akavel): verify below does deallocate when needed, and doesn't when not needed...
    // 	RN.UIManager.manageChildren(this.tag, [], [], [newChild.tag], [i], [i]);
    // }
  }
  // this.resetLast();
}

// Java: Integer.MAX_VALUE/2, adjusted so that nextReactTag%10 == 3, to step around special RN values
// Other than that, the code is copied from RN source.
var nextReactTag = (2<<30)-1;
function allocateTag() {
  var tag = nextReactTag;
  1 === tag % 10 && (tag += 2);
  nextReactTag = tag + 2;
  return tag;
}

ExpoDOM.prototype.createTextNode = function(text)
{
  var child = new ExpoDOM(allocateTag());
  child.name = 'RCTRawText';
  child.attrs = {text: text};
  child.root = this.tag;
  // RN.UIManager.createView(child.tag, 'RCTRawText', this.tag, {text: text});
  // Without wrapper, I was getting error like in https://github.com/facebook/react-native/issues/13243
  var wrapper = this.createElement('RCTText');
  wrapper.appendChild(child);
  return wrapper;
}
ExpoDOM.prototype.createElement = function(name)
{
  var child = new ExpoDOM(allocateTag());
  child.name = name;
  child.attrs = {};
  child.root = this.tag;
  // RN.UIManager.createView(child.tag, name, this.tag, {});
  return child;
}
ExpoDOM.prototype.setAttribute = function(key, value)
{
  this.attrs[key] = value;
  if (this.inflated)
  {
    RN.UIManager.updateView(this.tag, this.name, this.attrs);
  }
}
ExpoDOM.prototype.removeAttribute = function(key)
{
  delete this.attrs[key];
  if (this.inflated)
  {
    RN.UIManager.updateView(this.tag, this.name, this.attrs);
  }
}
ExpoDOM.prototype.replaceData = function(_1, _2, text)
{
  this.attrs.text = text;
  if (this.inflated)
  {
    RN.UIManager.updateView(this.tag, this.name, this.attrs);
  }
}

