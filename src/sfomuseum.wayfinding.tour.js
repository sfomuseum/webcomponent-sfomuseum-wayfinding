class TourWayfindingElement extends HTMLElement {

    // https://tmp.larlet.fr/leaflet-map/
    
    network = null
    
    constructor() {
	
	super();
	
	this.fetch_network().catch((err) => {
	    console.log("Failed to load network", err)
	});
    }
    
    connectedCallback() {

	this.fetch_network().then(rsp => {
	    this.route();
	}).catch((err) => {
	    console.log("Failed to load network", err)
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
    
    route(){
			      
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

	var wrapper = document.createElement("div");
	wrapper.appendChild(document.createTextNode("Loading"));
	shadow.appendChild(wrapper);

	var params = new URLSearchParams();
	params.set("from", from_waypoint);
	params.set("to", to_waypoint);
	
	var url = "http://localhost:8080/wayfinding/api/route/?" + params.toString();

	var _self = this;
	
	fetch(url).then(rsp =>
	    rsp.json()
	).then(steps => {

	    var map_id = "map-" + from_waypoint + "-" + to_waypoint;
	    
	    var map_el = document.createElement("div");
	    map_el.setAttribute("class", "map");
	    map_el.setAttribute("id", map_id);
	    
	    var root = _self.shadowRoot;
	    root.innerHTML = "";
	    
	    var tpl = document.getElementById("sfomuseum-tour-wayfinding-template");

	    if (tpl){
		let tpl_content = tpl.content;
		root.appendChild(tpl_content.cloneNode(true));
	    }
	    
	    root.appendChild(map_el);

	    _self.draw_map(map_el, steps);
	    
	}).catch(err => {
	    console.log("Failed to complete routing", err);
	});
	
    }

    draw_map(map_el, steps){
	
	var map = L.map(map_el, {});
	// var map = sfomuseum.wayfinding.maps.getMap(map_el, {});
	
	var bounds = sfomuseum.maps.campus.campusBounds();	
	map.fitBounds(bounds);

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
