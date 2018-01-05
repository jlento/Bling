var bling = function () {
    'use strict';

    const toolbar = document.getElementById('toolbar');
    const markdown = document.getElementById('markdown');

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


    class Toolbar {
        constructor(elem, config) {
            this._elem = elem;
            elem.onclick = this.onClick.bind(this);
            elem.onchange = this.onChange.bind(this);

            for (let select of elem.querySelectorAll('select[data-options]')) {
                console.log(select);
                let options = Object.keys(config[select.dataset.options]);
                select.innerHTML =
                    `${options.map(option => `<option value="${option}">${option}</option>`).join('\n')}`;
            }
        }

        loadMarkdown() {
            loadTextUsingFileDialog('.md', function(text) {
                markdown.value = text;
                convert();
                var selectedPaper = toolbar.querySelector('select[data-options="papers"]'),
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
                convert();
            });
        }

        loadStyleJs() {
            loadTextUsingFileDialog('.js', function(text) {
                const styleJs = document.getElementById('blingStyleJs');
                styleJs.removeAttribute('src');
                styleJs.innerHTML = text;
                eval(document.getElementById('blingStyleJs').innerHTML);
                delay(function () {convert();},1);
            });
        }

        printPdf() {
            var scrollTop = document.getElementById('preview').scrollTop;
	          window.print();
	          document.getElementById('preview').scrollTop = scrollTop;
        }

        saveMarkdown() {
            saveString(document.getElementById('markdown').value, 'doc.md');
        }

        setPaper(select) {
            updatePaperStyle(select);
        }

        onClick(event) {
            let action = event.target.dataset.action;
            if (action) {
                this[action]();
            }
        };

        onChange(event) {
            let callback = event.target.dataset.callback;
            if (callback) {
                this[callback](event.target);
            }
        };
    }

    new Toolbar(toolbar, {papers});
    markdown.addEventListener('input', autoConvert);

//    document.getElementById('paperSelect').innerHTML =
//        `${Object.keys(papers).map(paper => `<option value="${paper}" ${papers[paper].attributes}>${paper}</option>`).join('\n')}`;

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
        console.log(toolbar.querySelector('select[data-options="papers"]').value);
        var container = document.getElementById('preview'),
            paper = papers[toolbar.querySelector('select[data-options="papers"]').value],
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
    margin: ${paper.marginFraction * paper.width}mm;
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
        width: var(--textwidth);
	margin: 0;
	border: 0;
	padding: 0;
        font-size: var(--fontsize);
    }
    .page {
        overflow: hidden;
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

    updatePaperStyle(toolbar.querySelector('select[data-options="papers"]'));
    window.addEventListener('resize', function () {
        updatePaperStyle(toolbar.querySelector('select[data-options="papers"]'));
    });

    function loadTextUsingFileDialog(fileType, callback) {
        const input = document.createElement('input');
        input.id = 'tmpFileInput';
        input.type='file';
        input.style.display = 'none;';
        if (fileType) input.accept = fileType;
        input.onchange = () => {
            var file = input.files[0];
            if (file) {
                var reader  = new FileReader();
                reader.onload = function () {
                    callback(reader.result);
                    document.body.removeChild(input);
                };
                reader.readAsText(file);
            };
        };
        document.body.appendChild(input);
        input.click();
    }

    function autoConvert () {
        delay(function(){convert();}, 500);
    }

    return {
        metadata: metadata,
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
