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

let getContentElement = (doc)=> {
    return doc.querySelector('article>.postArticle-content>section.section');
}

let resolveHeadings = (doc)=> {
    let headings = [];
    let content = getContentElement(doc);
    if(!content) return [];
    content.querySelectorAll('h1,h2,h3,h4,h5,h6')
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
    chrome.runtime.sendMessage({message: 'event', eventCategory: 'Console', eventAction: 'PrintIndented', eventLabel: headings.length});
}

let createRoot = ()=> {
    let root = $(`
    <div class="indices">
        <div class="handle">
            <div class="dragger">...</div>
        </div>
        <div class="refreshButton">REFRESH</div>
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
    .on('mouseup', e=> {
        if(isResizing) {
            isResizing = false;
            let width = parseInt(root.css('width').replace('px', ''));
            chrome.runtime.sendMessage({message: 'event', eventCategory: 'Viewer', eventAction: 'Resize', eventValue: width});
        }
    });
    $('.refreshButton', root).on('click', e=> {
        console.log(doc, root)
        populateHeadings(doc, root);
        chrome.runtime.sendMessage({message: 'event', eventCategory: 'Viewer', eventAction: 'Refresh'});
    });
}
let populateHeadings = (doc, root)=> {
    let headings = resolveHeadings(doc);
    let headingTree = $('.heading-tree', root);
    headingTree.empty();
    for (let heading of headings) {
        let headingElement = $(`<div class="heading"><div class="text i-${heading.indent}">${heading.title}</div></div>`);
        headingElement.appendTo(headingTree);
        headingElement.click(()=>{
            heading.element.scrollIntoView();
            chrome.runtime.sendMessage({message: 'event', eventCategory: 'Viewer', eventAction: 'HeadingClick', eventValue: headings.indexOf(heading)});
        });
    }
    chrome.runtime.sendMessage({message: 'event', eventCategory: 'Viewer', eventAction: 'Population', eventLabel: headings.length, nonInteraction: true});
}
let injectViewer = (doc)=> {
    root = createRoot();
    activateDragHandle(doc, root);
    chrome.runtime.sendMessage({message: 'event', eventCategory: 'Viewer', eventAction: 'Injection', nonInteraction: true});
    populateHeadings(doc, root);
}

let isMedium = (doc)=> {
    try {
        let metaContent = [
            doc.querySelector("meta[property='al:ios:app_name']").content,
            doc.querySelector("meta[property='al:android:app_name']").content,
            doc.querySelector("meta[name='twitter:app:name:iphone']").content,
        ];
        for (let m of metaContent) {
            if(m!='Medium') return false;
        }
        return true;
    }
    catch (e) {
        return false;
    }
}

(()=> {
    if(!isMedium(document)) return;
    injectViewer(document);
    onUrlChange(()=>{
        $(document).ready(()=> {
            populateHeadings(document, root);
        });
    })
    chrome.runtime.sendMessage({message: 'ping'});
})()