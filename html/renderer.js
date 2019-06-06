const { dialog } = require('electron').remote;
const path = require('path');
const mclint = require('mclint');

var files = document.getElementById("files");
var folder = document.getElementById("folder");
var check = document.getElementById("check");

var lint_worker = new Worker("check-file-worker.js");


lint_worker.onerror = function(e) {
  console.log('worker error');
  console.log(e);
}
var error_data = {
  error: "",
  filename: "",
  correct: false
}
Vue.component('item-file', {
  props: {file: {type: Object, required: true}},
  methods: {show: function(fl){
    if(fl.errors){
      var msg = "";
      for(let er of fl.errors){
        msg += er + "\n";
      }
      error_data.correct = false;
      if(msg === ""){
        error_data.correct = true;
        msg = "No Errors!";
      }
      error_data.error = msg;
      error_data.filename = fl.path;
    }
  }},
  template: '<li v-on:click="show(file)" v-bind:class="file.status" v-bind:style="{marginLeft: file.depth * 15 + \'px\', borderLeft: \'#767676 \' + file.depth * 0 + \'1px solid\' }"><span class="filename">{{ file.name }}{{file.folder ? " [Folder]" : "" }}</span></li>'
});

var data = {
  fileList: []
};
var raw_files = ["C:/Users/bboet/Desktop/Programmieren/NodeJS/mclint/test/Tinkery/data/tinkery/functions/hello.mcfunction", "C:/Users/bboet/Desktop/Programmieren/NodeJS/mclint/test/Tinkery/data/tinkery/functions/load.mcfunction", "C:/Users/bboet/Desktop/Programmieren/NodeJS/mclint/test/Tinkery/data/tinkery/functions/loadcheck.mcfunction", "C:/Users/bboet/Desktop/Programmieren/NodeJS/mclint/tst/Tinkery/data/tinkery/functions/main.mcfunction"];
var raw_folder = "C:/Users/bboet/Desktop/Programmieren/NodeJS/mclint/test/Tinkery/";
var raw_file_type = "files";

files.addEventListener("click", function(e){
  dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'],
    filters: [
      {name: "Function files", extensions: ['mcfunction']}
    ]
  }, function(files){
    if(files !== undefined && files.length !== 0){
      data.fileList = [];
      raw_files = [];
      raw_file_type = "files";
      for(let i = 0; i < files.length; i++){
        let filename = path.parse(files[i]).base;
        data.fileList.push({id: i, name: filename, path: files[i], folder: false, depth: 0  });
        raw_files.push(files[i]);
      }
    }
  });
});
folder.addEventListener("click", function(e){
  dialog.showOpenDialog({ properties: ['openDirectory']
  }, function(files){
    if(files !== undefined && files.length === 1){
      data.fileList = [];
      raw_file_type = "folder";
      raw_folder = files[0];
      let filename = path.parse(raw_folder).base;
      data.fileList.push({
        id: 0,
        name: filename,
        path: raw_folder,
        folder: true,
        depth: 0
      });

    }
  });
});
check.addEventListener("click", function(e){
  if(raw_files.length === 0)return;
  if(raw_file_type === "folder"){
    lint_worker.postMessage({type: 'folder', folder: raw_folder});
  }else if(raw_file_type === "files"){

    lint_worker.postMessage({type: "files", files: raw_files});
  }
  for(let item of data.fileList){
    item.status = "wait";
  }
  folder.classList.toggle("disabled");
  files.classList.toggle("disabled");
  check.classList.toggle("disabled");
});
lint_worker.onmessage = function(msg){
  folder.classList.toggle("disabled");
  files.classList.toggle("disabled");
  check.classList.toggle("disabled");
  if(msg.data.type === 'folder'){
    var results = msg.data.result;
    var root = path.normalize(raw_folder);
    if(!root.endsWith(path.sep))root += path.sep;
    data.fileList = [
    {
      name: path.parse(root).base,
      depth: 0,
      path: root,
      folder: true
    }];
    var tree = {
      name: path.parse(root).base,
      depth: 0,
      path: root,
      folder: true,
      children: {}
    };
    var addNode = function(root, parts, data){
      let point = root;
      for(let i = 0; i < parts.length; i++){
        let part = parts[i];
        if(i === (parts.length - 1)){
          point.children["[N] " + part] = {
            name: part,
            folder: false,
            path: path.join(point.path, part),
            pathalt: data.file,
            parent: point,
            status: data.errors.length > 0 ? 'error' : 'ok',
            depth: parts.length,
            errors: data.errors
          };
          return;
        }
        if(!point.children["[N] " + part]){
          point.children["[N] " + part] = {
            name: part,
            folder: true,
            children: {},
            path: path.join(point.path, part),
            parent: point,
            depth: i + 1
          };
        }
        point = point.children["[N] " + part];
      }
    }
    for(let res of results){

      let rpath = res.file.substr(root.length);
      let name = path.parse(res.file).base;
      let parts = rpath.split(path.sep);
      var status = res.errors.length > 0 ? 'error' : 'ok';
      data.fileList.push({name: name, depth: parts.length, path: res.file, status: status, errors: res.errors});
      addNode(tree, parts, res);
    }
    data.fileList = [];
    var traverse = function(pointer){
      data.fileList.push(pointer);
      var no_errors = true;
      if(pointer.folder == true){
        for(let child in pointer.children){
          if(!pointer.children.hasOwnProperty(child)){
            continue;
          }
          let nr = traverse(pointer.children[child]);
          if(nr === false)no_errors = false;
        }
        pointer.status = no_errors ? 'ok' : 'error';
      }else{
        no_errors = pointer.errors.length === 0;
      }
      return no_errors;
    }
    traverse(tree);
  } else if(msg.data.type === 'files'){
    var results = msg.data.result;
    data.fileList = [];
    for(let res of results){
      let rpath = res.file.replace(/\\/g, "/");
      let name = path.parse(res.file).base;
      var status = res.errors.length > 0 ? 'error' : 'ok';
      data.fileList.push({name: name, depth: 0, path: res.file, status: status, errors: res.errors});
    }
  }


  
};

var file_list = new Vue({
  el: '#file-list',
  data: data
});
var errors = new Vue({
  el: '#error-view',
  data: error_data
});

var single_command = new Vue({
  el: '#command-check',
  props: ['cmd', 'error'],
  data: {correct: false},
  methods: {
    parse: function(e){
      var er = mclint.parseCommand(e);
        this.correct = false;
      if(!er || er === ""){
        this.correct = true;
        er = "No errors!"
      }
      this.error = er;

    }
  }
});

/*
var running_data = {num: 0};
var running_test = new Vue({
  el: '#running-test',
  data: running_data
});


function incr(){
  running_data.num++;
  setTimeout(incr, 100);
}
incr();*/