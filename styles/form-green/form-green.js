bling.style.extension = {
  type: 'lang',
  regex: /nimi/g,
  replace: 'NIMI'
};

console.log('Loaded form-green.js');
showdown.extension('form-green', bling.style.extension);
showdown.setOption('tables', true);
showdown.setOption('extensions', ['form-green']);
bling.converter = new showdown.Converter();
bling.ui.htmlConvert();
