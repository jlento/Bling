bling.setCss('styles/slides-csc-2015/slides-csc-2015.css');
bling.setExtension([
    {
        type: 'output',
        regex: /<\/[hH]1>/,
        replace: `$&
<p class="date">
${bling.metadata.date ? bling.metadata.date : (new Date()).getDate() + '.' + (new Date()).getMonth()+1 + '.' + (new Date()).getFullYear()}
</p>`
    },
    {
        type: 'output',
        regex: /< *[hH]2( +|>)/,
        replace: '<div class="pageBreak"></div>$&'
    }
]);
