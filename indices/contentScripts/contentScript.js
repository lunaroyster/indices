const $ = window.jQuery;
let root = null;

let onUrlChange = (callback)=> {
    //HACK: Find alternative that doesn't rely on polling.
    let initHref = document.location.href;
    setInterval(()=> {
        let currentHref = document.location.href;
        if(currentHref!=initHref) {
            initHref = currentHref;
            callback();
        }
    }, 2000)
};
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

let createRoot = ()=> {
    let root = $(`
    <div class="indices">
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
let populateHeadings = (doc, root)=> {
    let headings = resolveHeadings(doc);
    let headingTree = $('.heading-tree', root);
    headingTree.empty();
    for (let heading of headings) {
        let headingElement = $(`<div class="heading i-${heading.indent}">${heading.title}</div>`);
        headingElement.appendTo(headingTree);
        headingElement.click(()=>{
            heading.element.scrollIntoView();
        });
    }
    chrome.runtime.sendMessage({message: 'event', eventCategory: 'Viewer', eventAction: 'Population', eventValue: headings.length});
}
let injectViewer = (doc)=> {
    root = createRoot();
    activateDragHandle(doc, root);
    populateHeadings(doc, root);    
    chrome.runtime.sendMessage({message: 'event', eventCategory: 'Viewer', eventAction: 'Injection'});
}


(()=> {
    // //TODO: Detect Medium dynamically, instead of relying on hosts using medium.
    let hostname = new URL(document.location.href).hostname;
    let mediumDomains = ['medium.com','hackernoon.com', 'medium.freecodecamp.org', 'codeburst.io'];
    if(mediumDomains.indexOf(hostname) === -1) return;
    injectViewer(document);
    onUrlChange(()=>{
        $(document).ready(()=> {
            populateHeadings(document, root);
        });
    })
    chrome.runtime.sendMessage({message: 'ping'});
})()