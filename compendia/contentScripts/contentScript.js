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
    var isResizing = false,
        lastDownX = 0;
    //Standard
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

    let handle = $('.handle', root);
    handle.on('mousedown', function (e) {
        isResizing = true;
        lastDownX = e.clientX;
    });
    $(document)
    .on('mousemove', function (e) {
        if (!isResizing) return;
        e.stopPropagation();
        e.preventDefault();
        root.css('width', document.body.offsetWidth - e.clientX);
    })
    .on('mouseup', e=> isResizing = false);

    //Loop headings
    let headingTree = $('.heading-tree', root);
    for (let heading of headings) {
        let headingElement = $(`<div class="heading i-${heading.indent}">${heading.title}</div>`);
        headingElement.appendTo(headingTree);
        headingElement.click(()=>{
            heading.element .scrollIntoView();
        });
    }
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