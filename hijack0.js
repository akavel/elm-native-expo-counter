function bridge()
{
  if (typeof document !== 'undefined')
  {
    throw ('Cannot create new Elm-RN bridge, global document is already set to: ' + document);
  }
  document = 'Hello from bridge!';
}

module.exports = {
  bridge: bridge,
};
