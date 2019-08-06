// with tool tips
document.addEventListener("DOMContentLoaded", function() {
  d3.queue()
    .defer(d3.json, '//unpkg.com/world-atlas@1.1.4/world/50m.json')
    .defer(d3.csv, './country_data.csv', function(row) { // pass in a formatter function to format data.
      return {
        country: row.country,
        countryCode: row.countryCode,
        population: +row.population,
        medianAge: +row.medianAge,
        fertilityRate: +row.fertilityRate,
        populationDensity: +row.population/+row.landArea
      }
    })
    .await(function(error, mapData, populationData) {
      if(error) throw error;
      
      // convert map data in to valid geoJSON format for d3 to process with geoPath helper
      // convert map data in to valid geoJSON format using topojson.feature
      var geoData = topojson.feature(mapData, mapData.objects.countries).features;
      // add populationData of country to geoData country
      populationData.forEach(row => {
        var countries = geoData.filter(d => d.id === row.countryCode);
        countries.forEach(country => country.properties = row);
      });

      // draw the map
      var width = 1160;
      var height = 800;

      var projection = d3.geoMercator()
                         .scale(175)
                         .translate([width/2, height/1.4]);

      var path = d3.geoPath() // return a function which converts GeoJSON data into path commands
                   .projection(projection); // get the current projection or set a new projection

      d3.select('svg')
          .attr('width', width)
          .attr('height', height)
        .selectAll('.country')
        .data(geoData)
        .enter()
          .append('path')
          .classed('country', true)
          .attr('d', path)
          .on("mouseover", showTooltip)
          .on("mouseout", hideTooltip);

      // add a tootip
      var tooltip = d3.select("body")                    
                      .append("div")
                        .classed("tooltip", true);

      // get the colors
      var select = d3.select('select');

      select
        .on('change', d => setColor(d3.event.target.value)); // update the colors based on the selected option

      setColor(select.property('value'));
        
      function setColor(val) {

        var colorRanges = {
          population: ['white', 'purple'],
          populationDensity: ['white', 'red'],
          medianAge: ['white', 'black'],
          fertilityRate: ['black', 'orange']
        };

        var scale = d3.scaleLinear()
                      .domain([0, d3.max(populationData, d => d[val])])
                      .range(colorRanges[val]);

        d3.selectAll('.country') // set a transition for fill attribute
            .transition()
            .duration(750)
            .ease(d3.easeBackIn)
            .attr('fill', d => {
              var data = d.properties[val];
              return data ? scale(data) : "#ccc";
            });
      }

      function showTooltip(d) {
        d3.select(d3.event.path).node()[0].style.strokeWidth = '1px'; // need to find a better way to do it
        tooltip
          .style("opacity", 1)
          .style("left", `${d3.event.x - tooltip.node().offsetWidth/2}px`) // set the left location based on x property of event
          .style("top", `${d3.event.y + 25}px`) // set the top location based on y property of event
          .html(setTooltipText(d));
      }
      
      function hideTooltip() {
        d3.select(d3.event.path).node()[0].style.strokeWidth = '0.25px'; // need to find a better way to do it
        tooltip
          .style("opacity", 0);
      }

      function setTooltipText(d) {                
        var value = select.property('value');
        var text = `<p>Country: ${d.properties.country}</p>`
        if(value === 'population') {
          return text + `<p>Population: ${d.properties.population.toLocaleString()}</p>`
        }
        if(value === 'populationDensity') {
          return text + `<p>Population Density: ${d.properties.populationDensity.toFixed(2)}</p>`
        }
        if(value === 'medianAge') {
          return text + `<p>Median Age: ${d.properties.medianAge}</p>`
        }
        if(value === 'fertilityRate') {
          return text + `<p>Fertility Rate: ${(d.properties.fertilityRate) ? d.properties.fertilityRate : "No Data"}</p>`
        }                        
      }
    });
});