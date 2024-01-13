class SFOMuseumWayfindingMapElement extends HTMLElement {

    // See also: https://tmp.larlet.fr/leaflet-map/

    api_endpoint = null // "http://localhost:8080/wayfinding/api"
    wasm_endpoint = null
    
    network = null
    
    constructor() {
	super();
	// There does not appear to be any benefit in trying to preload/cache the network data here
    }
    
    connectedCallback() {

	if (this.hasAttribute("api-endpoint")){

	    var endpoint = this.getAttribute("api-endpoint")
	    var u = new URL(endpoint);
	    
	    if (u.protocol == "wasm:"){
		var q = u.searchParams;
		this.wasm_endpoint = q.get("uri");
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

	    if (_self.network){
		resolve();
		return;
	    }
	    
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

	    if (! _self.wasm_endpoint){
		reject();
		return;
	    }
	    
	    sfomuseum.wasm.fetch(_self.wasm_endpoint).then((rsp) => {
		
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

	var _self = this;

	return new Promise((resolve, reject) => {
	    
	    if (! _self.api_endpoint){
		reject();
		return;
	    }

	    var url = this.api_endpoint + "/network/";
	    
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

	var _self = this;
	
	return new Promise((resolve, reject) => {

	    if (! _self.api_endpoint){
		reject();
		return;
	    }
	    
	    var params = new URLSearchParams();
	    params.set("from", from_waypoint);
	    params.set("to", to_waypoint);
	    
	    var url = _self.api_endpoint + "/route/?" + params.toString();

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

	var _self = this;
	
	return new Promise((resolve, reject) => {

	    if (! _self.wasm_endpoint){
		reject();
		return;
	    }
	    
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

	    var tpl_id = "sfomuseum-wayfinding-map-template";

	    if (this.hasAttribute("template-id")){
		tpl_id = this.getAttribute("template-id");
	    }
	    
	    var tpl = document.getElementById(tpl_id);

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

	    if (_self.hasAttribute("show-steps")){

		var dialog_el = document.createElement("dialog");
		dialog_el.setAttribute("id", "sfomuseum-wayfinding-map-steps-dialog");
		
		var form = document.createElement("form");
		form.setAttribute("method", "dialog");
		
		var steps_div = document.createElement("div");
		steps_div.setAttribute("id", "sfomuseum-wayfinding-map-steps-dialog-steps");
		
		var close_div = document.createElement("div");
		close_div.setAttribute("id", "sfomuseum-wayfinding-map-steps-dialog-close");
		
		var close_btn = document.createElement("input");
		close_btn.setAttribute("id", "sfomuseum-wayfinding-map-steps-dialog-close-button");
		
		close_btn.setAttribute("type", "submit");
		close_btn.setAttribute("value", "X");
		
		close_div.appendChild(close_btn);

		form.appendChild(close_div);		
		form.appendChild(steps_div);	
		// form.appendChild(close_div);
		
		dialog_el.appendChild(form);	    
		wrapper.appendChild(dialog_el);	    
		
		var steps_el = document.createElement("a");
		steps_el.setAttribute("href", "#");
		steps_el.appendChild(document.createTextNode(" Show steps"));
		
		steps_el.onclick = function(){
		    
		    steps_div.innerHTML = "";
		    
		    var steps_list = sfomuseum.wayfinding.steps.render_steps(map, steps);
		    steps_div.appendChild(steps_list);
		    
		    var map_els = steps_list.getElementsByClassName("steps-map");
		    var count_els = map_els.length;
		    
		    dialog_el.showModal();

		    // This needs to happen after the modal dialog is opened
		    sfomuseum.wayfinding.steps.render_maps(steps, map_els);		    
		    return false;
		};
		
		caption_el.appendChild(steps_el);	    
	    }
	    
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

customElements.define('sfomuseum-wayfinding-map', SFOMuseumWayfindingMapElement);
