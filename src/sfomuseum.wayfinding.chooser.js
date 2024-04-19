class SFOMuseumWayfindingChooserElement extends HTMLElement {

    api_endpoint = null // "http://localhost:8080/wayfinding/api"
    wasm_endpoint = null

    network = null
    
    constructor() {
	super();	
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

	var _self = this;
	
	this.load_network().then((data) => {

	    _self.network = {};

	    var features = data.features;
	    var count = features.length;

	    for (var i=0; i < count; i++){
		var props = features[i].properties;
		var id = props.id;
		_self.network[id] = props;
	    }
	    
	    _self.draw();
	    
	}).catch((err) => {
	    console.log("Failed to load waypoints network", err);
	});
    }

    draw(){
			      
	const shadow = this.attachShadow({ mode: "open" });

	var _self = this;

	if (! this.network){
	    console.log("Failed to initialize network, can not attach shadow");
	    return false;
	}

	var str_destinations = this.getAttribute("destination").split(",");
	var count_destinations = str_destinations.length;
	
	if (count_destinations == 0){
	    console.log("Missing destinations");
	    return false;
	}

	var destinations = [];

	for (var i=0; i < count_destinations; i++){

	    var destination_id = parseInt(str_destinations[i]);
	    
	    if (destination_id === NaN){
		console.log("Invalid destination attribute", str_destinations[i]);
		return;
	    }

	    if (! this.network[destination_id]){
		console.log("Unknown destination point");
		return false;
	    }
	    
	    destinations.push(destination_id);
	}

	var tpl_id = "sfomuseum-wayfinding-chooser-template";
	
	if (this.hasAttribute("template-id")){
	    tpl_id = this.getAttribute("template-id");
	}
	
	var tpl = document.getElementById(tpl_id);
	
	if (tpl){
	    let tpl_content = tpl.content;
	    shadow.appendChild(tpl_content.cloneNode(true));
	}

	for (var d=0; d < count_destinations; d++) {

	    var destination = destinations[d];

	    var candidates = [];
	    var terminals = [];
	    var gates = [];

	    var wrapper_id = "sfomuseum-wayfinding-chooser-" + destination;
	    var select_id = "sfomuseum-wayfinding-chooser-select-" + destination;
	    var dialog_id = "sfomuseum-wayfinding-chooser-dialog-" + destination;
	    var dialog_close_div_id = "sfomuseum-wayfinding-chooser-dialog-close-" + destination;
	    var dialog_close_button_id = "sfomuseum-wayfinding-chooser-dialog-close-button-" + destination;
	    
	    var dialog_map_id = "sfomuseum-wayfinding-chooser-dialog-map-" + destination;
	    var button_id = "sfomuseum-wayfinding-chooser-button-" + destination;
	    
	    var sel = document.createElement("select");
	    sel.setAttribute("id", select_id);
	    sel.setAttribute("data-destination", destination);
	    
	    for (var id in this.network){
		
		if (id == destination){
		    continue;
		}
		
		var wp = this.network[id];
		
		if (wp.placetype == "commonarea"){
		    terminals.push(wp);
		    continue;
		}
		
		if (wp.placetype == "gate"){
		    gates.push(wp);
		    continue;
		}
	    }
	    
	    terminals = this.sort(terminals, "name");
	    gates = this.sort(gates, "name");
	    
	    var candidates = terminals.concat(gates);
	    var count = candidates.length;
	    
	    for (var i=0; i < count; i++){
		
		var wp = candidates[i];
		
		var opt = document.createElement("option");
		opt.setAttribute("value", wp.id);
		opt.appendChild(document.createTextNode(wp.name));
		sel.appendChild(opt);
	    }
	    
	    var btn = document.createElement("button");
	    btn.setAttribute("id", button_id);
	    btn.setAttribute("data-destination", destination);
	    
	    /* https://icons.getbootstrap.com/icons/map/ */
	    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#8a741d" class="bi bi-map" viewBox="0 0 16 16" data-destination="` + destination + `"><path fill-rule="evenodd" d="M15.817.113A.5.5 0 0 1 16 .5v14a.5.5 0 0 1-.402.49l-5 1a.502.502 0 0 1-.196 0L5.5 15.01l-4.902.98A.5.5 0 0 1 0 15.5v-14a.5.5 0 0 1 .402-.49l5-1a.5.5 0 0 1 .196 0L10.5.99l4.902-.98a.5.5 0 0 1 .415.103M10 1.91l-4-.8v12.98l4 .8V1.91zm1 12.98 4-.8V1.11l-4 .8zm-6-.8V1.11l-4 .8v12.98z"/></svg>`;
	    
	    btn.onclick = function(e){

		var root = _self.shadowRoot;
		
		var el = e.target;

		if (el.nodeName == "path"){
		    el = el.parentNode;
		}
		
		var destination = el.getAttribute("data-destination");

		if (! destination){
		    console.log("Button element is missing data-destination attribute", el);
		    return false;
		}
		
		var to = parseInt(destination);

		if (to == NaN){
		    console.log("Invalid destination", el.getAttribute("data-destination"));
		    return false;
		}

		if (! _self.network[to]){
		    console.log("Unknown destination point", to);
		    return false;
		}

		var select_id = "sfomuseum-wayfinding-chooser-select-" + to;
		var sel = root.getElementById(select_id);

		if (! sel){
		    console.log("Failed to retrieve select element", select_id);
		    return false;
		}
		
		var from = sel.value;
		
		if (! _self.network[from]){
		    console.log("Unknown starting point");
		    return false;
		}

		var destination = sel.getAttribute("data-destination");

		console.log("route from", from, "route to", to);
		
		var map_el = document.createElement("sfomuseum-wayfinding-map");
		map_el.setAttribute("from", from);
		map_el.setAttribute("to", to);	    
		map_el.setAttribute("api-endpoint", _self.getAttribute("api-endpoint"));
		
		if (_self.hasAttribute("arrowheads")){
		    map_el.setAttribute("arrowheads", "true");
		}
		
		if (_self.hasAttribute("disable-scroll")){
		    map_el.setAttribute("disable-scroll", "true");
		}
		
		if (_self.hasAttribute("show-steps")){
		    map_el.setAttribute("show-steps", "true");
		}	
		
		var map_div = root.getElementById(dialog_map_id);
		map_div.innerHTML = "";
		
		map_div.appendChild(map_el);
	    
		var dialog = root.getElementById(dialog_id);
		dialog.showModal();
		return false;
	    };	

	    var wrapper = document.createElement("div");
	    wrapper.setAttribute("id", wrapper_id);
	    wrapper.setAttribute("class", "sfomuseum-wayfinding");
	    
	    var prefix_str = this.getAttribute("prefix");
	    
	    if (prefix_str){
		var prefix_el = document.createElement("span");
		prefix_el.appendChild(document.createTextNode(prefix_str));
		wrapper.appendChild(prefix_el);
	    }
	    
	    wrapper.appendChild(sel);
	    wrapper.appendChild(btn);

	    if (count_destinations > 1){
		var label = "to " + _self.network[destination]["name"];
	    
		var label_div = document.createElement("div");
		label_div.setAttribute("class", "sfomuseum-wayfinding-chooser-label");
		
		label_div.appendChild(document.createTextNode(label));
		wrapper.appendChild(label_div);
	    }
	    
	    var dialog = document.createElement("dialog");
	    dialog.setAttribute("id", dialog_id);
	    
	    var form = document.createElement("form");
	    form.setAttribute("method", "dialog");
	    
	    var map_div = document.createElement("div");
	    map_div.setAttribute("id", dialog_map_id);
	    
	    var close_div = document.createElement("div");
	    close_div.setAttribute("id", dialog_close_div_id);
	    
	    var close_btn = document.createElement("input");
	    close_btn.setAttribute("id", dialog_close_button_id);
	    
	    close_btn.setAttribute("type", "submit");
	    close_btn.setAttribute("value", "X");
	    
	    close_div.appendChild(close_btn);
	    
	    form.appendChild(map_div);	
	    form.appendChild(close_div);
	    
	    dialog.appendChild(form);
	    wrapper.appendChild(dialog);

	    shadow.appendChild(wrapper);	    
	}

    }

    sort(items, key) {

	var tmp = {};
	var keys = [];

	var count = items.length;

	const zeroPad = (num, places) => String(num).padStart(places, '0');

	for (var i=0; i < count; i++){
	    var k = items[i][key];

	    var m = k.match(/(Gate\s+[A-G])(\d+)/);

	    if (m){
		var num = zeroPad(m[2], 3);
		k = m[1] + num;
	    }

	    keys.push(k)
	    tmp[k] = i;
	}

	keys = keys.sort();

	var results = [];

	for (var i in keys){
	    var k = keys[i];
	    var idx = tmp[k];
	    results.push(items[idx]);
	}

	return results;
    }
    
    load_network(){

	if (this.wasm_endpoint){
	    return this.load_network_wasm();
	}

	if (this.api_endpoint){
	    return this.load_network_api();
	}
	
	return new Promise((resolve, reject) => {
	    reject("No endpoint defined");
	});
    }

    load_network_api() {

	var url = this.api_endpoint + "/network/";	

	return new Promise((resolve, reject) => {	   
	    
	    fetch(url).then(rsp =>
		rsp.json()
	    ).then(data => {	
		resolve(data);
	    }).catch(err => {
		reject(err);
	    });
	    
	});
    }
	    
    load_network_wasm() {

	return new Promise((resolve, reject) => {
	    
	    sfomuseum.wasm.fetch(this.wasm_endpoint).then((rsp) => {

		sfomuseum_network().then((rsp) => {
		    var data = JSON.parse(rsp);
		    resolve(data);
		});
		
	    }).catch((err) => {
		reject(err);
	    });
	});
    }

}

customElements.define('sfomuseum-wayfinding-chooser', SFOMuseumWayfindingChooserElement);
