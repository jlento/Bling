var bling = function () {
    'use strict';

    var papers = {
        'A4 portrait': {
            size : 'A4 portrait',
            width : 210,
            height : 297,
            fontSize : 12,
            fontsPerWidth: (210.0 / 4.233333333),
            marginFraction: 0.05,
            attributes: 'selected'
        },
        'A4 landscape': {
            size : 'A4 landscape',
            width : 297,
            height : 210,
            fontSize : 12,
            fontsPerWidth: (297.0 / 4.233333333),
            marginFraction: 0.05,
            attributes: ''
        },
        'Projector 1920:1080': {
            size : '192mm 108mm',
            width : 192,
            height : 108,
            fontSize : 12,
            fontsPerWidth: (192.0 / 4.233333333),
            marginFraction: 0.0,
            attributes: ''
        }
    };

    document.getElementById('paperSelect').innerHTML =
        `${Object.keys(papers).map(paper => `<option value="${paper}" ${papers[paper].attributes}>${paper}</option>`).join('\n')}`;

    var page = previewPage();

    var extensions = [
        {
            type: 'lang',
            regex: /^ *$\n^====* *$\n^ *$/mg,
            replace: '<div class="pageBreak"></div>'
        },
        {
            type: 'lang',
            regex: /BLINGMETADATA\[(\w+)\]/g,
            replace: (match, p1) => bling.metadata[p1] || ''
        }
    ];
    showdown.extension('bling', extensions);
    showdown.setOption('extensions', ['bling']);

    var converter = new showdown.Converter();

    function convert () {
        var text      =
                extractMetadata(document.getElementById('markdown').value),
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
        delay(() => paginate(page, target),1);
        target.scrollTop = pos;
    }

    var metadata = {};
    function extractMetadata (text) {
        return text.replace(
                /(?:^---\s*[\n\r])((?:.+:.*[\n\r])+)(?:^---\s*[\n\r]\s*$)/m,
            function (match, p1, offset, string) {
                p1.replace(
                        /^\s*([^:]*\S)\s*:\s*(.*\S)\s*$/mg,
                    function (match, p1, p2) {
                        metadata[p1] = p2;
                        return '';
                    }
                );
                return '';
            }
        );
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
                    currentPage = pageDivs[pageDivs.length - 1];
                }
                block.nodes.forEach(node => currentPage.appendChild(node));
                block = {nodes : [], breakAfter : true, h : 0, t : 0, b : 0};
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
                block = {nodes : [], breakAfter : true, h : 0, t : 0, b : 0};
            }
	    //console.log(node.tagName + " " + node.className + " " + node.height + " " + block.h + " " + currentPage.h + " " + Math.floor(page.textHeight));

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

    function updatePaperStyle (select) {
        var paper = papers[select.value],
            paperStyle = document.getElementById("paper");
        if(!paperStyle) {
            paperStyle = document.createElement('style');
            paperStyle.id="paper";
            document.head.appendChild(paperStyle);
        };
        page = previewPage();
        paperStyle.innerHTML = `
@page {
    size: ${paper.size};
    margin: 0mm;
}

@media print {
    :root {
        --width: ${paper.width}mm;
        --height: ${paper.height}mm;
        --fontsize: ${paper.fontSize}pt;
        --textwidth: ${(1.0 - 2.0 * paper.marginFraction) * paper.width}mm;
        --textheight: ${paper.height - 2.0 * paper.marginFraction * paper.width}mm;
    }
    html, body, #content, #preview {
        overflow: hidden;
        width: var(--width);
        margin: 0;
        border: 0;
        padding: 0;
        font-size: var(--fontsize);
    }
    .page {
        overflow: hidden;
        margin-top: ${paper.marginFraction * paper.width}mm;
        margin-left: ${paper.marginFraction * paper.width}mm;;
        width: var(--textwidth);
        height: var(--textheight);
        padding: 0;
    }
}

@media screen {
    :root {
        --width: ${page.width}mm;
        --height: ${page.height}mm;
        --fontsize: ${page.fontSize}px;
        --textwidth: ${page.textWidth}px;
        --textheight: ${page.textHeight}px;
    }
    html {
        font-size: var(--fontsize);
    }
    .page {
        border: 1px dashed gray;
        padding: ${page.padding}px;
        width: var(--textwidth);
        height: var(--textheight);
    }
}
`;
        convert();
    }

    updatePaperStyle(document.getElementById('paperSelect'));
    window.addEventListener('resize', function () {
        updatePaperStyle(document.getElementById('paperSelect'));
    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    return {
        metadata: metadata,
        loadMarkdown : function (input) {
            loadString(input, document.getElementById('markdown'), 'value', () =>
                       {
                           convert();
                           var selectedPaper = document.getElementById('paperSelect'),
                               paperInMetadata = bling.metadata.paper;
                           if (papers.hasOwnProperty(paperInMetadata) &&
                               (selectedPaper.value != paperInMetadata)) {
                               selectedPaper.value = paperInMetadata;
                               updatePaperStyle(selectedPaper);
                           };
                           if (metadata.style) {
                               var oldStyle = document.getElementById('blingStyleJs'),
                                   parent = oldStyle.parentNode,
                                   newStyle = document.createElement('script');
                               newStyle.id = 'blingStyleJs';
                               newStyle.src = metadata.style;
                               parent.removeChild(oldStyle);
                               parent.appendChild(newStyle);
                           };
                       });
        },
        loadStyleJs : function (input) {
            var styleJs = document.getElementById('blingStyleJs');
            styleJs.removeAttribute('src');
            loadString(input, styleJs, 'innerHTML', function () {
                eval(document.getElementById('blingStyleJs').innerHTML);
                delay(function () {convert();},1);
            });
        },
        saveMarkdown : function () {
            saveString(document.getElementById('markdown').value, 'doc.md');
        },
        printPdf : function () {
            var scrollTop = document.getElementById('preview').scrollTop;
            window.print();
            document.getElementById('preview').scrollTop = scrollTop;
        },
        autoConvert : function () {
            delay(function(){convert();}, 500);
        },
        setPaper : function (select) {
            updatePaperStyle(select);
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
