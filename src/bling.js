var bling = function () {
    'use strict';

    var paper = {
        name : 'A4 portrait',
        width : 8.26 * 25.4,
        height : 297,
        fontSize : 12,
        fontsPerWidth: (210.0 / 4.233333333),
        marginFraction: 0.05
    };

    var page = previewPage(paper, document.getElementById('blingHtml'));

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
        var text      = document.getElementById('blingMarkdown').value,
            target    = document.getElementById('blingHtml'),
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

    function previewPage (paper, container) {
        var style = window.getComputedStyle(container),
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

            //console.log(node.nodeName, block.nodes.length, block.nodes, block.breakAfter, block.h, block.t, block.b, currentPage.h, currentPage.m, page.height);

            console.log(node.offsetWidth);
            console.log(node.getBoundingClientRect().width);
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
            console.log(':' + (currentPage.h + Math.max(currentPage.m, block.t) + block.h + block.b) + ':' + page.height);
            if (currentPage.h + Math.max(currentPage.m, block.t) + block.h + block.b > page.textHeight) {
                console.log('New page.')
                pageDivs.push(new PageDiv());
                currentPage = pageDivs[pageDivs.length - 1];
            };
            if (block.breakAfter || node == nodes[nodes.length - 1]) {
                console.log('Attaching block to currentPage')
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

    function loadString (element, property, filePostfix, callback) {
        var input = document.createElement('input'),
            file = null;
        input.type = 'file';
        input.accept = filePostfix;
        input.onchange = function () {
            file = input.files[0];
            if (file) {
                var reader  = new FileReader();
                reader.onload = function () {
                    element[property] = reader.result;
                    delay(callback, 500);
                };
                reader.readAsText(file);
                document.getElementById('blingToolbar').removeChild(input);
            }
        };
        document.getElementById('blingToolbar').appendChild(input);
        input.click();
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
        var paperStyle = document.getElementById("paper");
        page = previewPage(paper, document.getElementById('blingHtml'));
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

    #blingHtml {
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
    window.addEventListener('resize', () => updatePaperStyle());

    return {
        editor : {
            clearStyle : function () {
                var css = document.getElementById('blingStyleCss'),
                    js = document.getElementById('blingStyleJs');
                if (css) css.parentNode.removeChild(css);
                if (js) js.innerHTML = '';
                showdown.setOption('extensions', []);
                converter = new showdown.Converter();
                convert();
            },
            loadStyleJs : function () {
                loadString(document.getElementById('blingStyleJs'), 'innerHTML', '.js', function () {
                    eval(document.getElementById('blingStyleJs').innerHTML);
                    delay(function () {convert();});
                });
            },
            loadMarkdown : function () {
                loadString(document.getElementById('blingMarkdown'), 'value', '.md', convert);
            },
            saveMarkdown : function () {
                saveString(document.getElementById('blingMarkdown').value, 'doc.md');
            },
            saveHtml : function () {
                var doc = document.implementation.createHTMLDocument(),
                    head = document.importNode(document.head, true),
                    body = document.importNode(document.getElementById('blingHtml'), true);
                doc.documentElement.replaceChild(head, doc.head);
                doc.documentElement.replaceChild(body, doc.body);
                saveString(doc.documentElement.outerHTML, 'doc.html');
            },
            autoConvert : function () {
                delay(function(){convert();}, 500);
            },
            printPdf : function () {
                var scrollTop = document.getElementById('blingHtml').scrollTop;
                window.print();
                document.getElementById('blingHtml').scrollTop = scrollTop;
            }
        },
        style : {
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
        }
    };
}();
