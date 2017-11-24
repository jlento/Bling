    var papers = {
        a4landscape: {
            name : 'A4 portrait',
            width : 210,
            height : 297,
            fontSize : 12,
            fontsPerWidth: (210.0 / 4.233333333),
            marginFraction: 0.05
        }
    };

    var page = previewPage();

    var extensions = [
        {
            type: 'lang',
            regex : /^ *$\n^====* *$\n^ *$/mg,
            replace : '<div class="pageBreak"></div>'
        }
    ];
    extensions.forEach((ext) => showdown.extension('bling', ext));
    showdown.setOption('extensions', ['bling']);

    var converter = new showdown.Converter();

    function convert () {
        var text      = document.getElementById('markdown').value,
            target    = document.getElementById('preview'),
            pos       = target.scrollTop,
            html      = converter.makeHtml(text),
            longpage  = document.createElement('div');
        longpage.className = 'page';
        longpage.style = 'height: auto;';
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        };
        target.appendChild(longpage);
        target.firstChild.innerHTML = html;
        paginate(page, target);
        target.scrollTop = pos;
    }

    function previewPage () {
        var container = document.getElementById('preview'),
            paper = papers[document.getElementById('paperSelect').value],
            style = window.getComputedStyle(container),
            containerChildWidth = parseInt(container.clientWidth)
                - parseInt(style.borderLeft)
                - parseInt(style.borderRight)
                - parseInt(style.paddingLeft)
                - parseInt(style.paddingRight),
            border = 1,
            width = containerChildWidth,
            height = paper.height / paper.width * width;
        return {
            border : border,
            width : width,
            height : height,
            padding : paper.marginFraction * width,
            fontSize : width / paper.fontsPerWidth,
            textWidth : (1.0 - 2.0 * paper.marginFraction) * width,
            textHeight : height - 2.0 * paper.marginFraction * width
        };
    }

    function paginate (page, container) {
        var nodes = Array.from(container.firstChild.childNodes) || [],
            pageDivs = [], currentPage = undefined;

        function PageDiv () {
            var pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            pageDiv.h = 0;
            pageDiv.m = 0;
            return pageDiv;
        }


        pageDivs.push(new PageDiv());
        currentPage = pageDivs[pageDivs.length - 1];

        // A block consists of nodes which should be on the same page
        var block = {nodes : [], breakAfter : false, h : 0, t : 0, b : 0};
        for (var node of nodes)  {
            if (node.nodeType === Node.TEXT_NODE) {
                continue;
            }
            if (node.className === 'pageBreak') {
                pageDivs.push(new PageDiv());
                currentPage = pageDivs[pageDivs.length - 1];
                continue;
            };
            node.height =  parseInt(node.getBoundingClientRect().height);
            node.topMargin = parseInt(
                window.getComputedStyle(node).getPropertyValue('margin-top'));
            node.bottomMargin = parseInt(
                window.getComputedStyle(node).getPropertyValue('margin-bottom'));

            block.nodes.push(node);
            block.breakAfter = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']
                .indexOf(node.nodeName) > -1 ? false : true;
            block.h += node.height + Math.max(block.b, node.topMargin);
            block.b = node.bottomMargin;
            if (block.nodes.length == 1) {block.t = node.topMargin;};

            if (block.h + block.m > page.textHeight) {
                console.warn(`Block height exeeds page height`);
                if (currentPage.firstChild) {
                    pageDivs.push(new PageDiv());
                    currentPage = pageDivs[pageDivs.length - 1];
                }
                block.nodes.forEach(node => currentPage.appendChild(node));
                block = {nodes : [], breakAfter : false, h : 0, t : 0, b : 0};
                pageDivs.push(new PageDiv());
                currentPage = pageDivs[pageDivs.length - 1];
                continue;
            };
            if (currentPage.h + Math.max(currentPage.m, block.t) + block.h + block.b > page.textHeight) {
                pageDivs.push(new PageDiv());
                currentPage = pageDivs[pageDivs.length - 1];
            };
            if (block.breakAfter || node == nodes[nodes.length - 1]) {
                block.nodes.forEach(node => currentPage.appendChild(node));
                currentPage.h += Math.max(currentPage.m, block.t) + block.h;
                currentPage.m = block.b;
                block = {nodes : [], breakAfter : false, h : 0, t : 0, b : 0};
            }
        };

        /*
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        };
         */

        container.removeChild(container.firstChild);
        for (node of pageDivs) {
            container.appendChild(node);
        };
    }

    function loadString (input, element, property, callback) {
        var file = input.files[0];
        if (file) {
            var reader  = new FileReader();
            reader.onload = function () {
                element[property] = reader.result;
                callback();
            };
            reader.readAsText(file);
            input.value = '';
        };
    }


    function saveString (string, defaultFileName) {
        var fname = prompt("Save as...", defaultFileName);
        if (fname) {
            var file = new Blob([string]),
                a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = fname;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        };
    }

    var delay = (function () {
        var timer = 0;
        return function (callback, ms) {
            clearTimeout(timer);
            timer = setTimeout(callback, ms);
        };
    })();

    function updatePaperStyle () {
        var paper = papers[document.getElementById('paperSelect').value],
            paperStyle = document.getElementById("paper");
        if(!paperStyle) {
            paperStyle = document.createElement('style');
            paperStyle.id="paper";
            document.head.appendChild(paperStyle);
        };
        page = previewPage();
        paperStyle.innerHTML = `
@page {
    size: ${paper.name};
    margin: 0mm;
}
@media print {
    html, body {
        margin: 0mm;
        font-size: ${paper.fontSize}pt;
    }

    #preview {
        margin-top: 0px;
    }
    .page {
        margin-top: ${paper.marginFraction * paper.width}mm;
        margin-left: ${paper.marginFraction * paper.width}mm;;
        width: ${(1.0 - 2.0 * paper.marginFraction) * paper.width}mm;
        height: ${paper.height - 2.0 * paper.MarginFraction * paper.width}mm;
        padding: 0px;
        page-break-after: always;
    }
}

@media screen {
    html {
        font-size: ${page.fontSize}px;
    }
    .page {
        border: 1px dashed gray;
        padding: ${page.padding}px;
        width: ${page.textWidth}px;
        height: ${page.textHeight}px;
    }
}
`;
    }

    updatePaperStyle();
    window.addEventListener('resize', function () {
        updatePaperStyle();
        convert();
    });

var bling = function () {
    'use strict';


    return {
        loadMarkdown : function (input) {
            loadString(input, document.getElementById('markdown'), 'value', convert);
        },
        loadStyleJs : function (input) {
            loadString(input, document.getElementById('blingStyleJs'), 'innerHTML', function () {
                eval(document.getElementById('blingStyleJs').innerHTML);
                delay(function () {convert();});
            });
        },
        saveMarkdown : function () {
            saveString(document.getElementById('markdown').value, 'doc.md');
        },
        autoConvert : function () {
            delay(function(){convert();}, 500);
        },
        printPdf : function () {
            var scrollTop = document.getElementById('preview').scrollTop;
            window.print();
            document.getElementById('preview').scrollTop = scrollTop;
        },
        setCss : function (path) {
            var css = document.getElementById('blingStyleCss');
            if (!css) {
                css = document.createElement('link');
                css.id = 'blingStyleCss';
                css.rel = 'stylesheet';
                document.head.appendChild(css);
            }
            css.setAttribute('href', path);
            convert();
        },
        setExtension : function (extension) {
            showdown.extension('styleExtension', extension);
            showdown.setOption('extensions', ['bling', 'styleExtension']);
            converter = new showdown.Converter();
            convert();
        }
    };
}();
