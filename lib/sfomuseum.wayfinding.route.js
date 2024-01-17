var sfomuseum = sfomuseum || {};
sfomuseum.wayfinding = sfomuseum.wayfinding || {};

sfomuseum.wayfinding.route = (function(){

    var markers = [];

    var steps_layergroup = L.layerGroup();
    var steps_lookup = {};
    
    var self = {

	retrieve_layer_id: function(key){
	    return steps_lookup[key];
	},

	retrieve_layer: function(layer_id){
	    return steps_layergroup.getLayer(layer_id);
	},

	stats: function(map, steps){

	    var count_steps = steps.length;
	    
	    var first_geom = steps[0].geometry;
            var last_geom = steps[count_steps - 1].geometry;

            var first_pt = [ first_geom.coordinates[1], first_geom.coordinates[0] ];
            var last_pt = [ last_geom.coordinates[1], last_geom.coordinates[0] ];

            var dist_m = map.distance(first_pt, last_pt);
            var walk_time = dist_m / 25;        // meters per minute, this number is a ballpark

            dist_km = dist_m / 1000;
            dist_ml = dist_km * 0.621;

	    var includes_airtrain = false;
	    var exits_post_security = false;
	    var enters_post_security = false;

	    var was_post_security;
	    
	    for (var i=0; i < count_steps; i++){

		var st = steps[i];
		
		if (st.is_airtrain){
		    includes_airtrain = true;
		}

		if (i > 0){

		    if ((was_post_security) && (! st.is_post_security)){
			exits_post_security = true;
		    }

		    if ((! was_post_security) && (st.is_post_security)){
			enters_post_security = true;
		    }
		}
		
		was_post_security = st.is_post_security;
	    }
	    
	    var rsp = {
		distance: {
		    kilometers: dist_km,
		    miles: dist_ml,
		},
		walk_time: walk_time,
		airtrain: includes_airtrain,
		exits_post_security: exits_post_security,
		enters_post_security: enters_post_security,		
	    };

	    return rsp;
	},

	caption: function(map, steps) {

	    var count_steps = steps.length;
	    
	    var first_step = steps[0];
            var last_step = steps[count_steps - 1];
	    
	    var rsp = self.stats(map, steps);
	    var dist = rsp.distance;
	    
	    var str = "The distance between " + first_step.name + " and " + last_step.name + " is " +
		      dist.miles.toFixed(2) + " miles (" + dist.kilometers.toFixed(2) +
		      " km) which takes approximately " + Math.ceil(rsp.walk_time) + " minutes to walk.";

	    if (rsp.airtrain){
		str += " This route includes distance travelled on the AirTrain so it will probably be faster than that but you should account for the time it will take for the train to arrive.";
	    }

	    if (rsp.enters_post_security){
		str += " This route requires going through security so you should factor in extra time to do that.";
	    }

	    if (rsp.exits_post_security){
		str += " This route exits the post security area so you should factor in extra time to re-enter the secure area if necessary.";
	    }

	    return str;
	},
	
	draw_route: function(map, steps, args){

	    self.clear_geometries(map);

	    var count_steps = steps.length;

	    var from_step;

	    var path = [];
	    
	    var segments = [];
	    var current_segment = null;
	    
	    for (var i=0; i < count_steps; i++){

		var to_step = steps[i];
		
		if (i == 0){
		    from_step = to_step;
		    continue;
		}
		
		var from_id = from_step.id;
		var to_id = to_step.id;
		
		var from_coords = from_step.geometry.coordinates;
		var to_coords = to_step.geometry.coordinates;		

		var from_post_security = from_step.is_post_security;
		var to_post_security = to_step.is_post_security;		
		
		var alt_path = "sfomuseum-pathto-" + to_id;

		var to_add = [];
		
		if ((from_step["alt_geometries"]) && (from_step["alt_geometries"][alt_path])){

		    var alt_coords = from_step["alt_geometries"][alt_path]["coordinates"]
		    var alt_length = alt_coords.length;

		    if (alt_path.match(/sfomuseum\-pathto\-(1796889527)/)){

		    	for (var j= (alt_length - 1); j >= 0; j--){
			    to_add.push(alt_coords[j]);
			}
			
		    } else {
			
			for (var j=0; j < alt_length; j++){
			    to_add.push(alt_coords[j]);
			}
		    }
		    
		} else {
		    
		    to_add.push(from_coords);
		    to_add.push(to_coords);
		}

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

		from_step = to_step;
	    }

	    segments.push(current_segment);

	    // Draw the halo for the full route
	    
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
		weight: 10,
	    };

	    if ((args) && (args.arrowheads)){
		
		path_opts["arrowheads"] = {
		    fill: true,
		    size: "8px",
		    frequency: "endonly"
		};
	    }
	    
	    var path_layer = L.geoJSON(path_f, path_opts);
	    path_layer.addTo(map);

	    markers.push(path_layer);

	    //

	    var stretch_geom = {
		"type": "LineString",
		"coordinates": path,
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
	    };

	    if ((args) && (args.arrowheads)){
		
		stretch_opts["arrowheads"] = {
		    fill: true,
		    size: "8px",
		    frequency: "endonly"
		};		    
	    }
	    
	    var stretch_layer = L.geoJSON(stretch_f, stretch_opts);
	    stretch_layer.addTo(map);

	    markers.push(stretch_layer);
	    
	    // Draw individual pre/post-security segments
	    
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

		if ((args) && (args.arrowheads) && (j == (count_segments-1))){
		    
		    segment_opts["arrowheads"] = {
			    fill: true,
			    size: "8px",
			    frequency: "endonly"			    
			};
		}
		
		if (current_segment.is_post_security){
		    segment_opts.color = "red";
		}
		
		var segment_layer = L.geoJSON(segment_f, segment_opts);
		segment_layer.addTo(map);

		markers.push(segment_layer);		
	    }

	    // Draw start and stop markers

	    if ((! args) || (! args.no_popups)){
		
		var first_step = steps[0];
		var last_step = steps[count_steps-1];
		
		var start_coords = first_step.geometry.coordinates;
		var finish_coords = last_step.geometry.coordinates;
		
		var start_args = {
		    pane: "wayfinding-popup",
		    "content": first_step.name,
		    "autoClose": false,
		    "closeOnClick": false
		};
		
		var finish_args = {
		    pane: "wayfinding-popup",
		    "content": last_step.name,
		    "autoClose": false,
		    "closeOnClick": false
		};
		
		var start_popup = L.popup([start_coords[1], start_coords[0]], start_args);	
		start_popup.openOn(map);
		
		var finish_popup = L.popup([finish_coords[1], finish_coords[0]], finish_args);	
		finish_popup.openOn(map);
		
		markers.push(start_popup);
		markers.push(finish_popup);
	    }
	    
	    // Fit the map to the route path
	    
	    var min_lat = path[0][1];
	    var min_lon = path[0][0];
	    var max_lat = path[0][1];
	    var max_lon = path[0][0];
	    
	    var count_path = path.length;
	    
	    for (var j=0; j < count_path; j++){
		var pt = path[j];		    
		min_lat = Math.min(min_lat, pt[1]);
		min_lon = Math.min(min_lon, pt[0]);	 
		max_lat = Math.max(max_lat, pt[1]);
		max_lon = Math.max(max_lon, pt[0]);	 		
	    }
	    
	    var bounds = [[min_lat, min_lon], [max_lat, max_lon]];
	    map.fitBounds(bounds, { padding: [ 20, 20 ] });		
	    
	},

	// deprecated - to be removed soon (20240103/thisisaaronland)
	
	x_draw_route: function(map, steps){

	    var min_lat = null;
	    var min_lon = null;
	    var max_lat = null;
	    var max_lon = null;
	    
	    var last_lat = null;
	    var last_lon = null;
	    var last_post_security = null;
	    
	    self.clear_geometries(map);

	    var count = steps.length;

	    // First, draw the start and finish markers
	    
	    var start = steps[0];
	    var finish = steps[ count - 1 ];
	    
	    var start_coords = start.geometry.coordinates;
	    var start_lat = start_coords[1];
	    var start_lon = start_coords[0];
	    
	    var start_circle = L.circle([start_lat, start_lon], {
		color: 'green',
		fillColor: '#98FB98',
		fillOpacity: 1,
		radius: 20,
		width: 1,
		pane: 'wayfinding',
	    })
	    
	    start_circle.addTo(map);

	    var start_circle2 = L.circle([start_lat, start_lon], {
		color: '#000',
		fillColor: 'green',
		fillOpacity: 1,
		radius: 10,
		width: .5,
		opacity: .5,
		pane: 'wayfinding',
	    })
	    
	    start_circle2.addTo(map);
	    
	    markers.push(start_circle);
	    markers.push(start_circle2);	    

	    var finish_coords = finish.geometry.coordinates;
	    var finish_lat = finish_coords[1];
	    var finish_lon = finish_coords[0];
	    
	    var finish_circle = L.circle([finish_lat, finish_lon], {
		color: 'red',
		fillColor: 'pink',
		fillOpacity: 1,
		radius: 20,
		width: 1,
		pane: 'wayfinding',
	    })
	    
	    finish_circle.addTo(map);

	    var finish_circle2 = L.circle([finish_lat, finish_lon], {
		color: '#000',
		fillColor: 'red',
		fillOpacity: 1,
		radius: 10,
		width: .5,
		opacity: .5,
		pane: 'wayfinding',
	    })
	    
	    finish_circle2.addTo(map);
	    
	    markers.push(finish_circle);
	    markers.push(finish_circle2);	    	    

	    // Now draw the route line/segments
	    
	    var linestring = [];

	    var segments = [];
	    var current_segment = null;
	    
	    for (var i=0; i < count; i++){

		if (i == 0){
		    
		    var coords = steps[i].geometry.coordinates;
		    var lat = coords[1];
		    var lon = coords[0];
		    
		    min_lat = lat;
		    min_lon = lon;
		    max_lat = lat;
		    max_lon = lon;
		    
		    last_lat = lat;
		    last_lon = lon;
		    
		    continue;
		}
		
		var coords = steps[i].geometry.coordinates;
		var lat = coords[1];
		var lon = coords[0];
		var post_security = steps[i].is_post_security;

		var prev_i = i - 1;
		var prev_step = steps[prev_i];
		
		var alt_path = "sfomuseum-pathto-" + steps[i].id;

		var to_add = [];

		if ((prev_step["alt_geometries"]) && (prev_step["alt_geometries"][alt_path])){

		    var alt_coords = prev_step["alt_geometries"][alt_path]["coordinates"]
		    var alt_length = alt_coords.length;

		    for (var j=0; j < alt_length; j++){
			    
			linestring.push(alt_coords[j]);
			to_add.push(alt_coords[j]);

			// mmmmaybe?
			lon = alt_coords[j][0];
			lat = alt_coords[j][1];			
		    }

		} else {
		    
		    linestring.push([ last_lon, last_lat ]);
		    linestring.push([ lon, lat ]);
		    
		    to_add.push([ last_lon, last_lat ]);
		    to_add.push([ lon, lat ]);
		}

		if (prev_step){

		    var prev_post_security = prev_step.is_post_security;

		    if ((prev_post_security) && (! post_security)){
			// console.log("PREV WAS POST SECURITY");

			var count_to_add = to_add.length;

			for (var j=0; j < count_to_add; j++){
			    current_segment.linestring.push(to_add[j]);

			    lat = to_add[j][1];
			    lon = to_add[j][0];
			}
			
			current_segment.is_post_security = true;
			segments.push(current_segment);
			
			current_segment = {
			    "linestring": []
			};
			
		    } else if ((! prev_post_security) && (post_security)){
			// console.log("PREV IS PRE SECURITY");

			current_segment.is_post_security = false;
			segments.push(current_segment);
			
			current_segment = {
			    "linestring": [],
			    "is_post_security": true,
			};

			var count_to_add = to_add.length;

			for (var j=0; j < count_to_add; j++){
			    current_segment.linestring.push(to_add[j]);

			    lat = to_add[j][1];
			    lon = to_add[j][0];			    
			}
			
		    } else {
			// console.log("PREV IS THE SAME", post_security)

			if (! current_segment){

			    current_segment = {
				"linestring": [],
				"is_post_security": post_security,
			    };
			}

			var count_to_add = to_add.length;

			for (var j=0; j < count_to_add; j++){
			    current_segment.linestring.push(to_add[j]);

			    lat = to_add[j][1];
			    lon = to_add[j][0];			    
			}						
		    }
		} 
		    
		last_lat = lat;
		last_lon = lon;
		last_post_security = post_security;
	    }

	    if (current_segment){
		segments.push(current_segment);
	    }
	    
	    var route_f = {
		"type": "Feature",
		"properties": {},
		"geometry": {"type": "LineString", "coordinates": linestring },
	    };

	    var route_bg_opts = {
		color: 'black',
		pane: 'wayfinding',
		weight: 8,
	    };

	    var route_fg_opts = {
		color: 'yellow',
		pane: 'wayfinding',
		weight: 4,
	    };

	    var route_fg_opts_presecurity = {
		color: 'white',
		pane: 'wayfinding',
		weight: 4,
	    };

	    var route_fg_opts_postsecurity = {
		color: 'red',
		pane: 'wayfinding',
		weight: 4,
	    };

	    
	    var route_bg_path = L.geoJSON(route_f, route_bg_opts);
	    route_bg_path.addTo(map);

	    // var route_fg_path = L.geoJSON(route_f, route_fg_opts);
	    // route_fg_path.addTo(map);

	    var count_segments = segments.length;

	    for (var i=0; i < count_segments; i++){

		var current_segment = segments[i];

		var route_f = {
		    "type": "Feature",
		    "properties": {},
		    "geometry": {"type": "LineString", "coordinates": current_segment["linestring"] },
		};

		var route_opts = (current_segment.is_post_security) ? route_fg_opts_postsecurity : route_fg_opts_presecurity;
		
		var route_path = L.geoJSON(route_f, route_opts);
		route_path.addTo(map);

		markers.push(route_path);
	    }
	    
	    markers.push(route_bg_path);
	    // markers.push(route_fg_path);	    
	    
	    // Finally draw invisible markers for popup wah-wah

	    steps_layergroup.clearLayers();
	    steps_lookup = {};

	    var step_args = {
		pointToLayer: function (feature, latlng) {
		    return L.circleMarker(latlng, {
			pane: 'wayfinding',
			radius: 10,
			fillColor: "red",
			color: "#000",
			weight: 1,
			opacity: 0,
			fillOpacity: 0,
		    });
		},
		onEachFeature: function(feature, layer){
		    layer.bindPopup(feature.properties.name, {"pane": "wayfinding-popup"});
		},
	    };
	    
	    for (i = 0; i < count; i++) {

		var coords = steps[i].geometry.coordinates;
		var lat = coords[1];
		var lon = coords[0];

		var step_props = steps[i];
		
		var step_f = {
		    "type": "Feature",
		    "properties": step_props,
		    "geometry": {
			"type": "Point",
			"coordinates": [ lon, lat ]
		    }
		};

		var step_layer = L.geoJSON(step_f, step_args);
		steps_layergroup.addLayer(step_layer);
		
		var layer_id = steps_layergroup.getLayerId(step_layer);
		var waypoint_id = step_props.id;

		steps_lookup[waypoint_id] = layer_id;

		last_lat = lat;
		last_lon = lon;

		min_lat = Math.min(min_lat, lat);
		min_lon = Math.min(min_lon, lon);	 
		
		max_lat = Math.max(max_lat, lat);
		max_lon = Math.max(max_lon, lon);	 		
	    }

	    steps_layergroup.addTo(map);
	    markers.push(steps_layergroup);
	    
	    var bounds = [[min_lat, min_lon], [max_lat, max_lon]];
	    map.fitBounds(bounds, { padding: [ 20, 20 ] });
	},

	// deprecated - to be removed soon (20240104/thisisaaronland)
	
	x_draw_steps: function(steps){

	    var count = steps.length;
	    
	    var steps_wrapper_el = document.getElementById("steps-wrapper");
	    
	    var steps_list_el = document.getElementById("steps-list");	    
	    steps_list_el.innerHTML = "";

	    if (count == 0){
		steps_wrapper_el.style.display = "none";
		return;
	    }
	    
	    var there_el = document.getElementById("steps-blurb-there");
	    there_el.innerHTML = "";
	    there_el.innerText = steps[0].name + " to " + steps[count-1].name;	   

	    sfomuseum.wayfinding.dom.assign_title(steps[0].name + " to " + steps[count-1].name);

	    var render_opts = {
		enable_minimap: true,
		enable_past_exhibitions: true,		
		retrieve_layer_id_func: self.retrieve_layer_id,
		retrieve_layer_func: self.retrieve_layer,		
	    };
	    
	    var steps_list = sfomuseum.wayfinding.waypoints.render_list(steps, render_opts);
	    steps_list_el.appendChild(steps_list);

	    var show_button_el = document.getElementById("steps-show-dialog");
	    
	    show_button_el.onclick = function(){
		var dialog_el = document.getElementById("steps-dialog");
		dialog_el.showModal();		
		return false;
	    };

	    var show_count_el = document.getElementById("steps-show-dialog-count");
	    show_count_el.innerText = "There are " + (count - 2) + " steps to travel between these two points.";

	    var show_between_el = document.getElementById("steps-show-dialog-between");
	    show_between_el.innerText = steps[0].name + " to " + steps[count-1].name;
	    
	    steps_wrapper_el.style.display = "block";	    

	    var caveat_el = document.getElementById("caveat");    	    
	    caveat_el.style.display = "block";		
	},

	clear_geometries: function(map){

	    var count_layers = markers.length;

	    for (var i=0; i < count_layers; i++){
		map.removeLayer(markers[i]);
	    }

	    markers = [];
	},
	
    };
    
    return self;

})();
