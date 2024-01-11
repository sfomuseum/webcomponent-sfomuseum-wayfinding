class TourWayfindingElement extends HTMLElement {

    // See also: https://tmp.larlet.fr/leaflet-map/

    api_endpoint = null // "http://localhost:8080/wayfinding/api"
    wasm_endpoint = null
    
    network = null
    
    constructor() {
	
	super();

	this.fetch_network().catch((err) => {
	    console.log("Failed to load network", err)
	});
    }
    
    connectedCallback() {

	if (this.hasAttribute("api-endpoint")){

	    var endpoint = this.getAttribute("api-endpoint")
	    var u = new URL(endpoint);
	    
	    if (u.protocol == "wasm:"){
		var path = u.pathname;
		path = path.replace("///", "");
		this.wasm_endpoint = path;
	    } else {
		this.api_endpoint = endpoint;
	    }
	}

	this.fetch_network().then(rsp => {
	    this.route();	    
	}).catch((err) => {
	    console.log("SAD", err);
	});
    }

    fetch_network(){

	var _self = this;
	
	return new Promise((resolve, rejext) => {
	
	    if (_self.wasm_endpoint){

		_self.fetch_network_wasm().then(rsp => {
		    resolve();
		}).catch(err => {
		    reject(err);
		});

		return;
	    }
	    
	    _self.fetch_network_api().then(rsp => {
		resolve();
	    }).catch(err => {
		rejext(err);
	    })
	});
    }
    
    fetch_network_wasm() {

	var _self = this;
	
	return new Promise((resolve, reject) => {
	    
	    sfomuseum.wasm.fetch("../lib/sfomuseum_route.wasm").then((rsp) => {
		
		sfomuseum_network().then((rsp) => {
		    var data = JSON.parse(rsp);
		    _self.populate_network(data);		    
		    resolve();
		});
		
	    }).catch((err) => {
		reject(err);
	    });
	});
	
    }
    
    fetch_network_api() {

	var url = this.api_endpoint + "/network/";
	var _self = this;

	return new Promise((resolve, reject) => {
	    
	    if (_self.network){
		resolve();
		return;
	    }

	    if (! _self.api_endpoint){
		reject();
		return;
	    }
	    
	    fetch(url).then(rsp =>
		rsp.json()
	    ).then(data => {
		
		_self.populate_network(data);
		resolve();
		
	    }).catch(err => {
		reject(err);
	    });
	    
	});
    }

    steps_between(from_waypoint, to_waypoint) {

	var _self = this;

	return new Promise((resolve, reject) => {

	    if (_self.wasm_endpoint){

		_self.steps_between_wasm(from_waypoint, to_waypoint).then((rsp) => {
		    resolve(rsp);
		}).catch((err) => {
		    reject(err);
		});

		return;
	    }

	    _self.steps_between_api(from_waypoint, to_waypoint).then((rsp) => {
		resolve(rsp);
	    }).catch((err) => {
		reject(err);
	    });
	    
	});
    }

    steps_between_api(from_waypoint, to_waypoint) {

	return new Promise((resolve, reject) => {

	    var params = new URLSearchParams();
	    params.set("from", from_waypoint);
	    params.set("to", to_waypoint);
	    
	    var url = this.api_endpoint + "/route/?" + params.toString();

	    fetch(url).then(rsp =>
		rsp.json()
	    ).then(steps => {
		resolve(steps);
	    }).catch((err) => {
		reject(err);
	    });
	});
    }

    steps_between_wasm(from_waypoint, to_waypoint) {

	return new Promise((resolve, reject) => {

	    sfomuseum_route(from_waypoint, to_waypoint).then((rsp) => {
		var steps = JSON.parse(rsp);
		resolve(steps);
	    }).catch((err) => {
		reject(err);
	    });
	});
	
    }

    populate_network(data) {

	this.network = {};
	
	var features = data.features;
	var count = features.length;
	
	for (var i=0; i < count; i++){		    
	    var f = features[i];
	    var props = f.properties;
	    var id  = props.id;
	    this.network[id] = props;
	}
	
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
	
	var _self = this;
	
	this.steps_between(from_waypoint, to_waypoint).then(steps => {
	    
	    var root = _self.shadowRoot;
	    root.innerHTML = "";
	    
	    var tpl = document.getElementById("sfomuseum-tour-wayfinding-template");

	    if (tpl){
		let tpl_content = tpl.content;
		root.appendChild(tpl_content.cloneNode(true));
	    }

	    var map_id = "map-" + from_waypoint + "-" + to_waypoint;
	    
	    var map_el = document.createElement("div");
	    map_el.setAttribute("class", "wayfinding-map");
	    map_el.setAttribute("id", map_id);
	    map_el.setAttribute("data-map-provider", "protomaps");
	    map_el.setAttribute("data-protomaps-tile-url", "https://static.sfomuseum.org/pmtiles/sfomuseum_v3/{z}/{x}/{y}.mvt?key=");

	    if (_self.hasAttribute("map-style")){
		map_el.setAttribute("style", _self.getAttribute("map-style"));
	    }
	    
	    var caption_el = document.createElement("div");
	    caption_el.setAttribute("class", "wayfinding-map-caption");
	    
	    var wrapper = document.createElement("div");
	    wrapper.setAttribute("class", "wayfinding-map-wrapper");
	    
	    wrapper.appendChild(map_el);
	    wrapper.appendChild(caption_el);

	    root.appendChild(wrapper);

	    var map = sfomuseum.wayfinding.maps.getMap(map_el, {});
	    var caption = sfomuseum.wayfinding.route.caption(map, steps);

	    caption_el.appendChild(document.createTextNode(caption));
	    
	    _self.draw_map(map, steps);
	    
	}).catch(err => {
	    console.log("Failed to complete routing", err);
	});
	
    }

    draw_map(map, steps){
	
	var bounds = sfomuseum.maps.campus.campusBounds();	
	map.fitBounds(bounds);
	
	if (this.hasAttribute("disable-scroll")){
	    map.scrollWheelZoom.disable();
	}

	var no_popups = this.hasAttribute("disable-popups");
	var with_arrowheads = this.hasAttribute("arrowheads");
	
	var steps_args = {
	    no_popups: no_popups,
	    arrowheads: with_arrowheads,
	};

	sfomuseum.wayfinding.route.draw_route(map, steps, steps_args);
    }
    
}

customElements.define('sfomuseum-tour-wayfinding', TourWayfindingElement);
