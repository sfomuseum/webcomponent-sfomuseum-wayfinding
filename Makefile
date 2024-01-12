# https://github.com/tdewolff/minify
MINIFY=minify

bundle:
	@make bundle-js
	@make bundle-css

bundle-js:
	$(MINIFY) -b \
		-o dist/sfomuseum.wayfinding.webcomponent.bundle.js \
		lib/leaflet.js \
		lib/leaflet.geometryutil.js \
		lib/leaflet-arrowheads.js \
		lib/protomaps.js \
		lib/protomaps-leaflet.min.js \
		lib/wasm_exec.js \
		lib/sfomuseum.*.js \
		src/sfomuseum.wayfinding.chooser.js
		src/sfomuseum.wayfinding.map.js

bundle-css:
	$(MINIFY) -b \
		-o dist/sfomuseum.wayfinding.webcomponent.bundle.css \
		lib/leaflet.css \
		src/sfomuseum.wayfinding.leaflet.css
