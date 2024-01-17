var sfomuseum = sfomuseum || {};
sfomuseum.wayfinding = sfomuseum.wayfinding || {};

sfomuseum.wayfinding.steps = (function(){

    var layers = {};
    var map_ids = [];
    
    var self = {
	
	draw_steps: function(map, steps){

	    var count_steps = steps.length;
	    
	    var steps_wrapper_el = document.getElementById("steps-wrapper");
	    
	    var steps_list_el = document.getElementById("steps-list");	    
	    steps_list_el.innerHTML = "";

	    if (count_steps == 0){
		steps_wrapper_el.style.display = "none";
		return;
	    }
	    
	    var first_geom = steps[0].geometry;
	    var last_geom = steps[count_steps - 1].geometry;
	    
	    var first_pt = [ first_geom.coordinates[1], first_geom.coordinates[0] ];
	    var last_pt = [ last_geom.coordinates[1], last_geom.coordinates[0] ];
	    
	    var dist_m = map.distance(first_pt, last_pt);
	    var walk_time = dist_m / 25;	// meters per minute, this number is a ballpark
	    
	    dist_km = dist_m / 1000;
	    dist_ml = dist_km * 0.621;
	    
	    steps_list_el.setAttribute("data-distance-km", dist_km.toFixed(2));
	    steps_list_el.setAttribute("data-distance-ml", dist_ml.toFixed(2));
	    steps_list_el.setAttribute("data-walk-time", Math.round(walk_time));
	    
	    var there_el = document.getElementById("steps-blurb-there");
	    there_el.innerHTML = "";
	    there_el.innerText = steps[0].name + " to " + steps[count_steps-1].name;	   

	    sfomuseum.wayfinding.dom.assign_title(steps[0].name + " to " + steps[count_steps-1].name);
	    
	    var show_button_el = document.getElementById("steps-show-dialog");
	    
	    show_button_el.onclick = function(){

		var steps_list = sfomuseum.wayfinding.steps.render_steps(map, steps);
		steps_list_el.appendChild(steps_list);
		
		var dialog_el = document.getElementById("steps-dialog");
		dialog_el.showModal();

		dialog_el.onclose = function(){
		    
		    self.unrender_maps();

		    var steps_wrapper = document.getElementById("steps-maps-wrapper");

		    if (steps_wrapper){
			steps_wrapper.remove();
		    }
		    
		    return false;
		};
		
		sfomuseum.wayfinding.steps.render_maps(steps);		
		return false;
	    };

	    var show_count_el = document.getElementById("steps-show-dialog-count");
	    show_count_el.innerText = "There are " + (count_steps - 2) + " steps to travel between these two points.";

	    show_count_el.setAttribute("data-distance-km", dist_km.toFixed(2));
	    show_count_el.setAttribute("data-distance-ml", dist_ml.toFixed(2));
	    show_count_el.setAttribute("data-walk-time", Math.round(walk_time));

	    var show_between_el = document.getElementById("steps-show-dialog-between");
	    show_between_el.innerText = steps[0].name + " to " + steps[count_steps-1].name;
	    
	    steps_wrapper_el.style.display = "block";	    
	},

	render_steps: function(map, steps) {

	    var map_el = map.getContainer();
	    var map_provider = map_el.getAttribute("data-map-provider");
	    
	    var wrapper = document.createElement("ul");
	    wrapper.setAttribute("id", "steps-maps-wrapper");
	    
	    var count = steps.length;	    
	    var prev_step = null;

	    // This is necessary to create unique map IDs everytime we render steps
	    // because if we don't do this we get trapped in a twisty maze of Leaflet
	    // errors... (20240104/thisisaaronland)
	    
	    var ts = Math.floor(Date.now() / 1000);
	    
	    for (var i=0; i < count; i++){

		var this_step = steps[i];
		
		if (i == 0){

		    prev_step = this_step;
		    continue;
		}

		var this_id = this_step.id;
		var this_name = this_step.name;

		var prev_id = prev_step.id;
		var prev_name = prev_step.name;
		
		var from = prev_name;	//  + " (" + prev_id + ")";
		var to = this_name;	//  + " (" + this_id + ")";

		var label = from;	//  + " to " + to;

		var prev_geom = prev_step.geometry;
		var this_geom = this_step.geometry;
		
		var prev_pt = L.latLng( prev_geom.coordinates[1], prev_geom.coordinates[0] );
		var this_pt = L.latLng( this_geom.coordinates[1], this_geom.coordinates[0] );

		var bearing = prev_pt.bearingTo(this_pt);
		
		var str_bearing = prev_pt.bearingWordTo(this_pt)
		// str_bearing = str_bearing.charAt(0).toUpperCase() + str_bearing.slice(1);
		
		var label_div = document.createElement("div");
		label_div.setAttribute("id", "label-step-" + i);		
		label_div.setAttribute("class", "label-step");

		label_div.setAttribute("data-bearing-n", bearing);		
		label_div.setAttribute("data-bearing", str_bearing);
		
		label_div.appendChild(document.createTextNode(label));
		
		var step_div = document.createElement("li");
		step_div.setAttribute("id", "step-" + i);
		step_div.setAttribute("data-ts", ts);
		
		var map_id = "map-step-" + ts + "-" + i;

		var map_el = document.createElement("div");
		map_el.setAttribute("id", map_id);
		map_el.setAttribute("class", "steps-map");
		map_el.setAttribute("data-step-from", i-1);
		map_el.setAttribute("data-step-to", i);				
		map_el.setAttribute("data-map-provider", map_provider);
		
		step_div.appendChild(label_div);		
		step_div.appendChild(map_el);

		wrapper.appendChild(step_div);
		prev_step = this_step;
	    }

	    return wrapper;
	},

	unrender_maps: function(){
	    
	    var map_els = document.getElementsByClassName("steps-map");
	    var count_steps = map_els.length;

	    for (var i=0; i < count_steps; i++){

		var map_el = map_els[i];
		var map_id = map_el.getAttribute("id");

		if (layers[map_id]){
		    var this_map = sfomuseum.wayfinding.maps.getMap(map_el);		    
		    sfomuseum.wayfinding.maps.removeMap(map_id);
		    delete(layers[map_id]);
		}
		
	    }
	},
	
	render_maps: function(steps, map_els){

	    if (!map_els){
		map_els = document.getElementsByClassName("steps-map");
	    }
	    
	    var count_steps = map_els.length;
	    
	    var bounds = sfomuseum.maps.campus.campusBounds();
	    var path = [];
	    
	    var segments = [];
	    var current_segment = null;
	    
	    for (var i=0; i < count_steps; i++){

		var map_el = map_els[i];
		var map_id = map_el.getAttribute("id");

		layers[map_id] = [];
		
		var this_map = sfomuseum.wayfinding.maps.getMap(map_el);
		this_map.scrollWheelZoom.disable();

		// this_map.fitBounds(bounds);

		var from_idx = parseInt(map_el.getAttribute("data-step-from"));
		var to_idx = parseInt(map_el.getAttribute("data-step-to"));				

		var from_step = steps[from_idx];
		var to_step = steps[to_idx];

		var from_id = from_step.id;
		var to_id = to_step.id;
		
		var from_coords = from_step.geometry.coordinates;
		var to_coords = to_step.geometry.coordinates;		

		var from_post_security = from_step.is_post_security;
		var to_post_security = to_step.is_post_security;		
		
		var stretch = [];
		var bounds = [];

		// console.log(from_coords, to_coords);
		
		var alt_path = "sfomuseum-pathto-" + to_id;

		var to_add = [];
		
		if ((from_step["alt_geometries"]) && (from_step["alt_geometries"][alt_path])){

		    var alt_coords = from_step["alt_geometries"][alt_path]["coordinates"]
		    var alt_length = alt_coords.length;

		    if (alt_path.match(/sfomuseum\-pathto\-(1796889527)/)){

		    	for (var j= (alt_length - 1); j >= 0; j--){
			    stretch.push(alt_coords[j]);
			    to_add.push(alt_coords[j]);
			}
			
		    } else {
			
			for (var j=0; j < alt_length; j++){
			    stretch.push(alt_coords[j]);
			    to_add.push(alt_coords[j]);
			}
		    }
		    
		} else {
		    
		    stretch = [
			from_coords,
			to_coords,
		    ];

		    to_add.push(from_coords);
		    to_add.push(to_coords);
		}

		//
		
		var count_to_add = to_add.length;

		for (var j=0; j < count_to_add; j++){
		    path.push(to_add[j]);
		}

		if ((from_post_security) && (! to_post_security)){

		    var count_to_add = to_add.length;
		    
		    for (var j=0; j < count_to_add; j++){
			current_segment.linestring.push(to_add[j]);
		    }
			
		    current_segment.is_post_security = true;
		    segments.push(current_segment);
			
		    current_segment = {
			"linestring": []
		    };
		    
		} else if ((! from_post_security) && (to_post_security)){

		    current_segment.is_post_security = false;
		    segments.push(current_segment);
			
		    current_segment = {
			"linestring": [],
			"is_post_security": true,
		    };
		    
		    var count_to_add = to_add.length;
		    
		    for (var j=0; j < count_to_add; j++){
			current_segment.linestring.push(to_add[j]);
		    }
		    
		} else {
		    
		    if (! current_segment){
			
			current_segment = {
			    "linestring": [],
			    "is_post_security": from_post_security,
			};
		    }
		    
		    var count_to_add = to_add.length;
		    
		    for (var j=0; j < count_to_add; j++){
			current_segment.linestring.push(to_add[j]);
			
		    }						
		}

		segments.push(current_segment);
		
		//
		
		var stretch_geom = {
		    "type": "LineString",
		    "coordinates": stretch,
		};
		
		var stretch_f = {
		    "type": "Feature",
		    "properties": {},
		    "geometry": stretch_geom,
		};

		var stretch_opts = {
		    pane: "wayfinding",
		    color: "#75bfec",
		    weight: 4,
		    arrowheads: {
			fill: true,
			size: "8px",
			frequency: "endonly"
		    }		    
		};

		var stretch_layer = L.geoJSON(stretch_f, stretch_opts);
		stretch_layer.addTo(this_map);

		layers[map_id].push(stretch_layer);
		
		//
		
		var path_geom = {
		    "type": "LineString",
		    "coordinates": path,
		};
		
		var path_f = {
		    "type": "Feature",
		    "properties": {},
		    "geometry": path_geom,
		};

		var path_opts = {
		    pane: "wayfinding-halo",
		    color: "#000",
		    weight: 12,
		    arrowheads: {
			fill: true,
			size: "8px",
			frequency: "endonly"
		    }
		};

		var path_layer = L.geoJSON(path_f, path_opts);
		
		path_layer.addTo(this_map);
		
		layers[map_id].push(path_layer);

		//

		var count_segments = segments.length;
		
		for (var j=0; j < count_segments; j++){
		    
		    var current_segment = segments[j];
		    
		    var segment_f = {
			"type": "Feature",
			"properties": {},
			"geometry": {"type": "LineString", "coordinates": current_segment["linestring"] },
		    };
		    
		    var segment_opts = {
			color: 'white',
			pane: 'wayfinding-segments',
			weight: 7,
		    };

		    if (current_segment.is_post_security){
			segment_opts.color = "red";
		    }

		    if (j == (count_segments-1)){
			
			segment_opts["arrowheads"] = {
			    fill: true,
			    size: "8px",
			    frequency: "endonly"			    
			}
		    }
		    
		    var segment_layer = L.geoJSON(segment_f, segment_opts);
		    segment_layer.addTo(this_map);

		    layers[map_id].push(segment_layer);		    
		}

		// Markers

		// Always show starting marker
		
		var start_coords = steps[0].geometry.coordinates;
		
		var start_args = {
		    pane: "wayfinding-popup",
		    "content": steps[0].name,
		    "autoClose": false,
		    "closeOnClick": false,
		    "autoPan": false,
		};
		
		var start_popup = L.popup([start_coords[1], start_coords[0]], start_args);	
		start_popup.openOn(this_map);
		layers[map_id] = start_popup;

		if (i == (count_steps-1)){

		    var finish_coords = to_step.geometry.coordinates;
		    
		    var finish_args = {
			pane: "wayfinding-popup",
			"content": to_step.name,
			"autoClose": false,
			"closeOnClick": false,
			"autoPan": false,
		    };

		    var finish_popup = L.popup([finish_coords[1], finish_coords[0]], finish_args);	
		    finish_popup.openOn(this_map);
		    layers[map_id] = finish_popup;		    
		}
		
		//
		
		var min_lat = stretch[0][1];
		var min_lon = stretch[0][0];
		var max_lat = stretch[0][1];
		var max_lon = stretch[0][0];
		
		var count_stretch = stretch.length;

		for (var j=0; j < count_stretch; j++){
		    var pt = stretch[j];		    
		    min_lat = Math.min(min_lat, pt[1]);
		    min_lon = Math.min(min_lon, pt[0]);	 
		    max_lat = Math.max(max_lat, pt[1]);
		    max_lon = Math.max(max_lon, pt[0]);	 		
		}
		
		var bounds = [[min_lat, min_lon], [max_lat, max_lon]];		
		this_map.fitBounds(bounds, { padding: [ 50, 50 ] });
	    }
	},
	
    };
    
    return self;

})();
