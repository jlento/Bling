var bling = { 'ui': {}, 'style': {} };

bling.ui.htmlAutoConvert = function () {
    // TODO: Only convert when user pauses typing
    bling.ui.htmlConvert();
};

bling.ui.htmlConvert = function () {
    const text      = document.getElementById('blingMarkdown').value,
          target    = document.getElementById('blingHtml'),
          html      = bling.converter.makeHtml(text);

    target.innerHTML = html;
    splitToPages(target, 50);
};

bling.ui.mdLoad = function () {
    if ( ! document.getElementById('blingLoadMarkdownInput') ) {
        var input = document.createElement('input');
        input.id = 'blingLoadMarkdownInput';
        input.type = 'file';
        input.style = 'visibility: hidden;';
        input.setAttribute("onchange", "bling.ui.loadText(this.files[0],'blingMarkdown')");
        document.head.appendChild(input);
    }
    document.getElementById('blingLoadMarkdownInput').click();
};

bling.ui.loadText = function (fileName, elementId) {
    if (fileName) {
        const reader  = new FileReader();
        reader.onload = function () {
            document.getElementById(elementId).value = reader.result;
            bling.ui.htmlConvert();
        };
        reader.readAsText(fileName);
        bling.ui.htmlConvert();
    }
    document.getElementById('blingLoadMarkdownInput').value = '';
};


bling.ui.mdSave = function () {
    const fname = prompt("Save as...", "text.md");
    if (fname) {
        const text = document.getElementById('blingMarkdown').value,
              file = new Blob([text], {type: "text/plain"}),
              a    = document.createElement("a"),
              url  = URL.createObjectURL(file);
        a.href = url;
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
};


bling.ui.pdfPrint = function () {
    const body = document.body.innerHTML,
          text = document.getElementById('blingMarkdown').value,
          html = document.getElementById('blingHtml').innerHTML;
    document.body.innerHTML = html;
    window.print();
    document.body.innerHTML = body;
    document.getElementById('blingMarkdown').value = text;
}

bling.ui.styleSet = function (style) {

    document.getElementById('blingCss')
        .setAttribute('href','styles/' + style + '.css');

    var parent = document.getElementById('blingJs').parentNode;
    var oldjs = document.getElementById('blingJs');
    var newjs = document.createElement('script');
    newjs.id = 'blingJs';
    newjs.type= 'text/javascript';
    newjs.src = 'styles/' + style + '.js';
    parent.removeChild(oldjs);
    parent.appendChild(newjs);
};






function splitToPages (html, pageHeight) {
    var topLevelElements = Array.from(html.childNodes);
    var h = 0;
    topLevelElements.forEach( function (elem) {
        if (elem.nodeType != Node.TEXT_NODE)
            h += elem.getBoundingClientRect().height;
    });
    console.log(h);
}
