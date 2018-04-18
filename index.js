const path = require('path');
const fse = require('fs-extra');
const less = require('less');

// Source: https://gist.github.com/VinGarcia/ba278b9460500dad1f50
let walkSync = async(dir, filelist)=> {
    if( dir[dir.length-1] != '/') dir=dir.concat('/')
    let files = await fse.readdir(dir);
    filelist = filelist || [];
    for (let file of files) {
        if ((await fse.stat(dir + file)).isDirectory()) {
            filelist = await walkSync(dir + file + '/', filelist);
        }
        else {
            filelist.push(dir+file);
        }
    }
    return filelist;
};

(async()=> {
    let files = await walkSync('./compendia');
    for (let file of files) {
        let p = path.parse(file);
        if(p.ext != ".less") continue;
        let src = `${p.dir}/${p.base}`;
        let lessFile = await less.render((await fse.readFile(src)).toString(), {filename: src});
        await fse.writeFile(`${p.dir}/${p.name}.css`, lessFile.css, {flag:'w'});
    }
})()
.then(async()=> {
    let imports = [
        './node_modules/jquery/dist/jquery.min.js'
    ];
    let destination = "./compendia/importedScripts";
    for(let i of imports) {
        await fse.copy(i, `${destination}/${path.parse(i).base}`, {overwrite: true});
    }
})
.catch((error)=> {
    console.log(error);
});