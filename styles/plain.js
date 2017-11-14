bling.style.extension = {
  type: 'lang',
  regex: /nimi/g,
  replace: 'NAME'
};

console.log('Loaded plain.js');
showdown.extension('plain', bling.style.extension);
showdown.setOption('tables', true);
showdown.setOption('extensions', ['plain']);
bling.converter = new showdown.Converter();
bling.ui.htmlConvert();

