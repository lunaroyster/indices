const $ = window.jQuery;

let getIndentFromElement = (element)=> {
    return element.nodeName[1]-1;
}
let resolveHeadings = (doc)=> {
    let headings = [];
    doc
    .querySelector('article>.postArticle-content>section.section')
    .querySelectorAll('h1,h2,h3,h4,h5,h6')
    .forEach(c=> {
        headings.push({
            indent: getIndentFromElement(c),
            title: c.innerText,
            element: c
        });
    });
    return headings;
}
let printIndented = (headings)=> {
    for (let heading of headings) {
        let line = Array(heading.indent).join('  ') + heading.title;
        console.log(line);
    }
}
let injectViewer = (doc, headings)=> {
    let createRoot = ()=> {
        let root = $(`
        <div class="compendia">
            <div class="handle"></div>
            <div class="controls"></div>
            <div class="content">
                <div class="heading-tree"></div>
            </div>
        </div>
        `);
        root.appendTo('body');
        return root;
    }
    let activateDragHandle = (doc, root)=> {
        let isResizing = false;
        let lastDownX = 0;
        let handle = $('.handle', root);
        handle.on('mousedown', e=> {
            isResizing = true;
            lastDownX = e.clientX;
        });
        $(doc)
        .on('mousemove', e=> {
            if (!isResizing) return;
            e.preventDefault();
            root.css('width', doc.body.offsetWidth - e.clientX);
        })
        .on('mouseup', e=> isResizing = false);
    }
    let populateHeadings = (headings, root)=> {
        let headingTree = $('.heading-tree', root);
        for (let heading of headings) {
            let headingElement = $(`<div class="heading i-${heading.indent}">${heading.title}</div>`);
            headingElement.appendTo(headingTree);
            headingElement.click(()=>{
                heading.element.scrollIntoView();
            });
        }
    }
    let root = createRoot();
    activateDragHandle(doc, root);
    populateHeadings(headings, root);    
}
(()=> {
    let hostname = new URL(document.location.href).hostname;
    let mediumDomains = ['medium.com','hackernoon.com', 'medium.freecodecamp.org', 'codeburst.io'];
    //TODO: Detect Medium dynamically, instead of relying on hosts using medium.
    if (mediumDomains.indexOf(hostname)!=-1) {
        let headings = resolveHeadings(document)
        injectViewer(document, headings);
    }
})()