class WayfindingElement extends HTMLElement {
    
    constructor() {
	super();	
    }
    
    connectedCallback() {

	this.network = null;
	
	fetch("../src/network.json")
	    .then((rsp) =>  rsp.json())
	    .then((data) => {		

		this.network = {};
		
		var count = data.length;
		
		for (var i=0; i < count; i++){		    
		    var wp = data[i];
		    var id  = wp.id;
		    this.network[id] = wp;
		}
		
		this.draw();
		
	    }).catch((err) => {
		console.log("Failed to initialize network", err);
	    });
    }

    draw(){
			      
	const shadow = this.attachShadow({ mode: "open" });

	var _self = this;

	if (! this.network){
	    console.log("Failed to initialize network, can not attach shadow");
	    return false;
	}
	
	var start = parseInt(this.getAttribute("start"));
	
	if (start === NaN){
	    console.log("Invalid start attribute");
	    return;
	}
	
	if (! this.network[start]){
	    console.log("Unknown start point");
	    return false;
	}

	var candidates = [];
	var terminals = [];
	var gates = [];
	
	var sel = document.createElement("select");
	
	for (var id in this.network){
	    
	    if (id == start){
		continue;
	    }
	    
	    var wp = this.network[id];

	    if (wp.placetype == "terminal"){
		terminals.push(wp);
		continue;
	    }

	    if (wp.placetype == "gate"){
		gates.push(wp);
		continue;
	    }
	}

	// Y U NO WORK???
	
	terminals = terminals.sort()
	gates = gates.sort()

	var candidates = terminals.concat(gates);
	var count = candidates.length;

	for (var i=0; i < count; i++){

	    var wp = candidates[i];
	    
	    var opt = document.createElement("option");
	    opt.setAttribute("value", wp.id);
	    opt.appendChild(document.createTextNode(wp.name + " " + wp.placetype));
	    sel.appendChild(opt);
	}
	
	  var btn = document.createElement("button");
	  btn.appendChild(document.createTextNode("route"));
	  
	btn.onclick = function(){
	    var end = sel.value;

	    if (! _self.network[end]){
		console.log("Unknown end point");
		return false;
	    }

	    var params = new URLSearchParams();
	    params.set("from", start);
	    params.set("to", end);

	    var url = "https://millsfield.sfomuseum.org/wayfinding/route/#" + params.toString();

	    console.log("GO", url);
	    window.open(url, "wayfinding");
	    return false;
	}
	
	var wrapper = document.createElement("div");
	wrapper.setAttribute("class", "sfomuseum-wayfinding");
	wrapper.appendChild(sel);
	wrapper.appendChild(btn);
	
	shadow.appendChild(wrapper);
    }
}

customElements.define('sfomuseum-wayfinding', WayfindingElement);
