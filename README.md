# webcomponent-sfomuseum-wayfinding

Custom Web Components for the SFO Museum Wayfinding system.

## Documentation

Documentation is incomplete at this time. Consult the [www](www) folder for working examples.

## <sfomuseum-wayfinding-chooser>

```
<template id="sfomuseum-wayfinding-chooser-template">
    <link rel="stylesheet" type="text/css" href="../src/sfomuseum.wayfinding.chooser.css" />
</template>

<template id="sfomuseum-wayfinding-map-template">
    <link rel="stylesheet" type="text/css" href="../dist/sfomuseum.wayfinding.webcomponent.bundle.css" />	    
    <style type="text/css">
     .wayfinding-map-wrapper {
	     width: 95%;
	     margin:1rem;
	     margin: 0 auto;
     }
     .wayfinding-map {
	     height: 300px;
	     width: 100%;		     
	     border:solid thin;
     }
     .wayfinding-map-caption {
	     font-size:small;
	     margin-top: .5rem;
	     line-height: 1.1rem;
     }
    </style>
</template>

<sfomuseum-wayfinding-chooser destination="1763594985" show-steps disable-scroll arrowheads api-endpoint="http://localhost:8080/wayfinding/api"></sfomuseum-wayfinding-chooser>

<script type="text/javascript" src="../dist/sfomuseum.wayfinding.webcomponent.bundle.js"></script>        
```

![](docs/images/sfomuseum-wayfinding-chooser.png)

![](docs/images/sfomuseum-wayfinding-chooser-map.png)

![](docs/images/sfomuseum-wayfinding-chooser-steps.png)

## <sfomuseum-wayfinding-map>

```
<template id="sfomuseum-wayfinding-map-template">
    <link rel="stylesheet" type="text/css" href="../dist/sfomuseum.wayfinding.webcomponent.bundle.css" />
    <style type="text/css">
     .wayfinding-map-wrapper {
	     width: 100%;
	     margin:1rem;
     }
     .wayfinding-map {
	     height: 300px;
	     width: 100%;		     
	     border:solid thin;
     }
     .wayfinding-map-caption {
	     font-size:small;
	     margin-top: .5rem;
	     line-height: 1.1rem;
     }
    </style>
</template>

<sfomuseum-wayfinding-map from="1796982269" to="1745903711" show-steps disable-scroll arrowheads api-endpoint="http://localhost:8080/wayfinding/api"></sfomuseum-wayfinding-map>
<sfomuseum-wayfinding-map from="1796889497" to="1763594985" show-steps disable-scroll arrowheads api-endpoint="http://localhost:8080/wayfinding/api"></sfomuseum-wayfinding-map>
<sfomuseum-wayfinding-map from="1796982281" to="1763588201" show-steps disable-scroll arrowheads api-endpoint="http://localhost:8080/wayfinding/api"></sfomuseum-wayfinding-map>
<sfomuseum-wayfinding-map from="1763588159" to="1729813735" show-steps disable-scroll arrowheads api-endpoint="wasm://?uri=../lib/sfomuseum_route.wasm"></sfomuseum-wayfinding-map>

<script type="text/javascript" src="../dist/sfomuseum.wayfinding.webcomponent.bundle.js"></script>
```

![](docs/images/sfomuseum-wayfinding-map.png)

## See also

* https://github.com/sfomuseum/go-sfomuseum-wayfinding
* https://github.com/sfomuseum/go-sfomuseum-wayfinding-www
* https://github.com/sfomuseum/go-sfomuseum-wayfinding-offline (WASM)