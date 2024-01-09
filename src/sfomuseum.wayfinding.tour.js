class TourWayfindingElement extends HTMLElement {

    network = null
    
    constructor() {
	
	super();
	
	this.fetch_network().catch((err) => {
	    console.log("SAD", err)
	});
    }
    
    connectedCallback() {

	this.fetch_network().then(rsp => {
	    this.draw();
	}).catch((err) => {
	    console.log("SAD", err)
	});
    }

    fetch_network() {

	var url = "http://localhost:8080/wayfinding/api/network/";
	var _self = this;
	
	return new Promise((resolve, reject) => {

	    if (_self.network){
		resolve();
		return;
	    }

	    fetch(url).then(rsp =>
		rsp.json()
	    ).then(data => {
		
		this.network = {};
		
		var features = data.features;
		var count = features.length;
		
		for (var i=0; i < count; i++){		    
		    var f = features[i];
		    var props = f.properties;
		    var id  = props.id;
		    this.network[id] = props;
		}
		
		resolve();
		
	    }).catch(err => {
		reject(err);
	    });
	    
	});
    }
    
    draw(){
			      
	const shadow = this.attachShadow({ mode: "open" });

	if (! this.network){
	    console.log("Failed to initialize network, can not attach shadow");
	    return false;
	}

	var from_waypoint = parseInt(this.getAttribute("from"));
	var to_waypoint = parseInt(this.getAttribute("to"));

	if (to_waypoint === NaN){
	    console.log("Invalid to attribute");
	    return;
	}
	
	if (! this.network[to_waypoint]){
	    console.log("Unknown to point");
	    return false;
	}

	if (from_waypoint === NaN){
	    console.log("Invalid from attribute");
	    return;
	}
	
	if (! this.network[from_waypoint]){
	    console.log("Unknown from point");
	    return false;
	}

	var wrapper = document.createElement("span");
	wrapper.appendChild(document.createTextNode("Loading"));
	shadow.appendChild(wrapper);

	var params = new URLSearchParams();
	params.set("from", from_waypoint);
	params.set("to", to_waypoint);
	
	var url = "http://localhost:8080/wayfinding/api/route/?" + params.toString();

	var _self = this;
	
	fetch(url).then(rsp =>
	    rsp.json()
	).then(data => {
	    console.log("OK", data);
	    console.log("FOO",);
	}).catch(err => {
	    console.log("SAD", err);
	});
	
	/*
	var url = "https://millsfield.sfomuseum.org/wayfinding/route/#" + params.toString();		
	
	var iframe = document.createElement("iframe");
	
	iframe.onerror = function(err){
	    console.log("Failed to load iframe", url, err);
	    alert("Oh no! There was a problem loading that route.");
	};
	
	iframe.src = url;
	*/

    }

    load_network(){

    	try {
	    return JSON.parse(this.network_data());
	} catch (err){
	    console.log("Failed to parse network data", err);
	    return null;
	}
    }

    network_data(){
	


    }
}

customElements.define('sfomuseum-tour-wayfinding', TourWayfindingElement);
