// TODO(akavel): "use strict"; ?

var RN = require('react-native');
// FIXME(akavel): unify 'require' vs 'import', etc.; I'm a total JS noob
import { AppRegistry } from 'react-native';

function prepare()
{
  if (typeof document !== 'undefined')
  {
    // TODO(akavel): add support for multiple docs; if 'Object' and document.constructor == ExpoDOM, then should be OK
    throw ('Cannot create new Elm-RN bridge, global document is already set to: ' + document);
  }
  document = new ExpoDocument();
}

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
      fakeDOM._inflated = true;
      fakeDOM._root = appParameters.rootTag;
      elmMainModule.embed(fakeDOM);
    };
    // TODO(akavel): choice below seems to depend on RN version? or what?
    // return AppRegistry.registerRunnable(appKey, {run: main});
    return AppRegistry.registerRunnable(appKey, main);
  };
}

function ExpoDocument()
{
}
ExpoDocument.prototype.createDocumentFragment = function()
{
  return new ExpoDOM('FRAG');
}
ExpoDocument.prototype.createTextNode = function(text)
{
  var child = new ExpoDOM(allocateTag());
  // TODO(akavel): prepend below fields with '_'
  child._name = 'RCTRawText';
  child._attrs = {text: text};
  // RN.UIManager.createView(child._tag, 'RCTRawText', this._tag, {text: text});
  // Without wrapper, I was getting error like in https://github.com/facebook/react-native/issues/13243
  var wrapper = this.createElement('RCTText');
  wrapper.appendChild(child);
  return wrapper;
}
ExpoDocument.prototype.createElement = function(name)
{
  var child = new ExpoDOM(allocateTag());
  child._name = name;
  child._attrs = {};
  // child._root = this._tag;
  // RN.UIManager.createView(child._tag, name, this._tag, {});
  return child;
}

// Java: Integer.MAX_VALUE/2, adjusted so that nextReactTag%10 == 3, to step around special RN values
// Other than that, the code is copied from RN source.
if (typeof elmRN_nextReactTag === 'undefined') {
  // NOTE: a global variable, to hopefully better support dynamic/hot reloading of Expo & RN during development
  elmRN_nextReactTag = (2<<30)-1;
}
function allocateTag() {
  var tag = elmRN_nextReactTag;
  1 === tag % 10 && (tag += 2);
  elmRN_nextReactTag = tag + 2;
  return tag;
}

// TODO(akavel): inspect VirtualDom: makeStepper(), setTimeout(), applyEvents()

// TODO(akavel): make sure I'm not shooting myself in the foot somehow as a JS newb :/
function ExpoDOM(tag)
{
  // _tag is the node ID in React Native system (passed to createView(), etc.)
  this._tag = tag;
  // NOTE(akavel): the following are public properties, part of DOM specification
  this.childNodes = [];
  this.lastChild = undefined;
  this.parentNode = undefined;
}
ExpoDOM.prototype._inflate = function()
{
  if (this.parentNode && this.parentNode._inflated && !this._inflated)
  {
    // TODO(akavel): prepend below field with '_'
    this._root = this.parentNode._root;
    RN.UIManager.createView(this._tag, this._name, this._root, this._attrs);
    this._inflated = true;
    var childTags = [];
    for (var i = 0; i < this.childNodes.length; i++)
    {
      var child = this.childNodes[i];
      child._inflate();
      childTags.push(child._tag);
      // RN.UIManager.manageChildren(this._tag, [], [], [child._tag], [i], []);
    }
    // NOTE(akavel): optimization attempt; if this makes problems, try reverting to manageChildren above
    if (childTags.length > 0)
    {
      RN.UIManager.setChildren(this._tag, childTags);
    }
  }
}
ExpoDOM.prototype._orphanize = function()
{
  // TODO(akavel): just: `if (this.parentNode)` ?
  if (this._inflated && this.parentNode)
  {
    this.parentNode.removeChild(this);
  }
}
ExpoDOM.prototype._resetLast = function()
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

ExpoDOM.prototype.appendChild = function(child)
{
  this._inflate();
  if (child._tag === 'FRAG')
  {
    // TODO(akavel): optimize this
    for (var i = 0; i < child.childNodes.length; i++)
    {
      this.appendChild(child.childNodes[i]);
    }
    return;
  }
  child._orphanize();
  this.childNodes.push(child);
  child.parentNode = this;
  this.lastChild = child;
  child._inflate();
  if (this._inflated)
  {
    RN.UIManager.manageChildren(this._tag, [], [], [child._tag], [this.childNodes.length-1], []);
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
    newNode._orphanize();
    this.childNodes.splice(i, 0, newNode);
    newNode.parentNode = this;
    this._resetLast();
    newNode._inflate();
    if (this._inflated)
    {
      RN.UIManager.manageChildren(this._tag, [], [], [newNode._tag], [i], []);
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
    if (this._inflated)
    {
      // FIXME(akavel): verify below does deallocate when needed, and doesn't when not needed...
      RN.UIManager.manageChildren(this._tag, [], [], [], [], [i]);
    }
  }
  this._resetLast();
}
ExpoDOM.prototype.replaceChild = function(newChild, oldChild)
{
  // newChild._orphanize();
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
    // newChild._inflate();
    // if (this._inflated)
    // {
    // 	// FIXME(akavel): verify below does deallocate when needed, and doesn't when not needed...
    // 	RN.UIManager.manageChildren(this._tag, [], [], [newChild._tag], [i], [i]);
    // }
  }
  // this._resetLast();
}

ExpoDOM.prototype.setAttribute = function(key, value)
{
  this._attrs[key] = value;
  if (this._inflated)
  {
    RN.UIManager.updateView(this._tag, this._name, this._attrs);
  }
}
ExpoDOM.prototype.removeAttribute = function(key)
{
  delete this._attrs[key];
  if (this._inflated)
  {
    RN.UIManager.updateView(this._tag, this._name, this._attrs);
  }
}
ExpoDOM.prototype.replaceData = function(_1, _2, text)
{
  this._attrs.text = text;
  if (this._inflated)
  {
    RN.UIManager.updateView(this._tag, this._name, this._attrs);
  }
}


module.exports = {
  prepare: prepare,
  bridge: bridge,
};
