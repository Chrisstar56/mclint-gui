const mclint = require("mclint");

onmessage = function(ev){
  var data = ev.data;
	if(data){
		if(data.type === "files"){
			var errors = [];
	    var promises = [];
	    console.log("file data");
	  	var running = data.files.length;
	    for(let i = 0; i < data.files.length; i++){
	      let file = data.files[i];
	      console.log(running, i, file);
	    	mclint.parseFile(file, function(err, res){
	    		running--;
	    		if(err){
	    			errors.push({file: file, errors: [err.message]});
	    		}else{
	    			errors.push(res);
	    		}
	    		//console.log(running, file, err, res);
	    		if(running === 0){
	    			postMessage({result: errors, type: 'files'});
	    		}
	    	});
	    }
		}else if(data.type === "folder"){
			mclint.parseDirectory(data.folder, function(err, res){
				if(!err){
					postMessage({result: res, type: 'folder'});
				}
			});

		}
	}
}