$(document).ready(function(){

  //declare map
  map = new L.Map('map_canvas', {zoomControl:true});

  //declare layer to add
  var here = new L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/{scheme}/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}', {
       attribution: 'Map &copy; 2016 <a href="http://developer.here.com">HERE</a>',
       subdomains: '1234',
       base: 'aerial',
       type: 'maptile',
       scheme: 'terrain.day',
       app_id: '4OSXs0XhUV9zKdoPwfkt',
       app_code: 'crSpfyqk8_qFpG8hnqNz-A',
       mapID: 'newest',
       maxZoom: 14,
       minZoom:11,
       language: 'eng',
       format: 'png8',
       size: '256'
    });
  
  //setting view and adding layer
  map.setView(new L.LatLng(47.619, -122.332),11);
  map.addLayer(here);

  var svg = d3.select(map.getPanes().overlayPane).append("svg"),
      g = svg.append("g").attr("class", "leaflet-zoom-hide");

  d3.queue()
    .defer(d3.json, "tracts_seattle_v2.json")
    .defer(d3.csv, "trips_seattle_modified.csv")
    .await(ready);

  function ready(error, tracts_seattle_v2, trips_seattle_modified) {

    if (error) throw error;

    collection = topojson.feature(tracts_seattle_v2, tracts_seattle_v2.objects.stdin);

    var transform = d3.geoTransform({point: projectPoint}),
          path = d3.geoPath().projection(transform);

    var mapFeatures = g.append('g')
              .attr('class', 'features');

    //map by tarct id
    var tractById = d3.map();

    var tracts = mapFeatures.selectAll('g')
                .data(collection.features)
                .enter().append('g')
                  .attr('class',"tract")
                  .each(function(d) {
                    tractById.set(d.properties.GEOID10, d);
                    d.incoming = [];
                    d.outgoing = [];
                    d.total_trips = 0;
                    var position = path.centroid(d);
                    d.x = position[0];
                    d.y = position[1];
                 }); //end of each tracts function

    tracts.append("path")
              .attr("class","tract_cell")
              .attr("d",path);

    function projectPoint(x, y) {
          var point = map.latLngToLayerPoint(new L.LatLng(y, x));
          this.stream.point(point.x, point.y);
    } //end of project point function

    //change position of svg when resize or zoom
    map.on("viewreset", reset);
    reset();

    function reset() {

      var bounds = path.bounds(collection),
        topLeft = bounds[0],
        bottomRight = bounds[1];

      svg.attr("width", bottomRight[0] - topLeft[0])
          .attr("height", bottomRight[1] - topLeft[1])
          .style("left", topLeft[0] + "px")
          .style("top", topLeft[1] + "px");

      g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
      tracts.selectAll('path').attr("d", path);
      tracts.each(function(d) {
        var position = path.centroid(d);
        d.x = position[0];
        d.y = position[1];
      });

    } //end of reset function

  } //end of ready function

}); //end of document ready function