bling.style.setCss('styles/form-green/form-green.css');
bling.style.setExtension([
    {
        type: 'output',
        regex : /<\/[hH]1>/,
        replace : `$&
<p class="date">
${(new Date()).getDate()}.${(new Date()).getMonth()+1}.${(new Date()).getFullYear()}
</p>`
    }
]);
