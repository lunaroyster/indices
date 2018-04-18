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