bling.style.extension = {
  type: 'lang',
  regex: /nimi/g,
  replace: 'NIMI'
};

console.log('Loaded istod.js');
showdown.extension('istod', bling.style.extension);
showdown.setOption('tables', true);
showdown.setOption('extensions', ['istod']);
bling.converter = new showdown.Converter();
bling.ui.htmlConvert();
