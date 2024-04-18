d3.json("https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json")
    .then(data => {
        const colors = [
            "#FFF0A9",
            "#FEE087",
            "#FEC965",
            "#FEAB4B",
            "#FD893C",
            "#FA5C2E",
            "#EC3023",
            "#D31121",
            "#AF0225",
            "#800026"
        ];

        data.monthlyVariance.forEach(val => val.month -= 1);

        document.getElementById("description").innerHTML =
            data.monthlyVariance[0].year +
            " - " +
            data.monthlyVariance[data.monthlyVariance.length - 1].year +
            ": Base Temperature " +
            data.baseTemperature +
            "&degC";

        const cellWidth = 5;
        const padding = {
            top: 40,
            right: 20,
            bottom: 120,
            left: 70,
        };
        const width = cellWidth * Math.ceil(data.monthlyVariance.length / 12);
        const height = 600 - padding.top - padding.bottom;

        const tooltip = d3.tip()
            .attr("id", "tooltip")
            .html(d => d);
        const svg = d3.select(".visHolder")
            .append("svg")
            .attr("width", width + padding.left + padding.right)
            .attr("height", height + padding.top + padding.bottom)
            .call(tooltip);

        const yScale = d3.scaleBand()
            .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
            .rangeRound([0, height]);

        const yAxis = d3.axisLeft(yScale);

        svg.append("g")
            .classed("y-axis", true)
            .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
            .attr("id", "y-axis")
            .call(yAxis
                .tickValues(yScale.domain())
                .tickFormat(month => {
                    const date = new Date(0);
                    date.setUTCMonth(month);
                    const format = d3.utcFormat("%B");
                    return format(date);
                })
                .tickSize(10, 1)
            );

        const xScale = d3.scaleBand()
            .domain(data.monthlyVariance.map(val => val.year))
            .range([0, width]);

        const xAxis = d3.axisBottom(xScale);

        svg.append("g")
            .classed("x-axis", true)
            .attr("transform", "translate(" + padding.left + "," + (height + padding.top) + ")")
            .attr("id", "x-axis")
            .call(xAxis
                .tickValues(xScale.domain().filter(year => year % 10 === 0))
                .tickFormat(year => {
                    const date = new Date(0);
                    date.setUTCFullYear(year);
                    const format = d3.utcFormat("%Y");
                    return format(date);
                })
                .tickSize(10, 1)
            );

        const variance = data.monthlyVariance.map(val => val.variance);
        const minTemp = data.baseTemperature + Math.min.apply(null, variance);
        const maxTemp = data.baseTemperature + Math.max.apply(null, variance);

        const legendColors = colors;
        const legendWidth = 400;
        const legendHeight = 300 / legendColors.length;

        const legendThreshold = d3.scaleThreshold()
            .domain(
                ((min, max, count) => {
                    const array = [];
                    const step = (max - min) / count;
                    const base = min;
                    for (let i = 1; i < count; i++) {
                        array.push(base + i * step);
                    }
                    return array;
                })(minTemp, maxTemp, legendColors.length)
            )
            .range(legendColors);

        const legendX = d3.scaleLinear()
            .domain([minTemp, maxTemp])
            .range([0, legendWidth]);
        const legendXAxis = d3.axisBottom(legendX)
            .tickSize(10, 0)
            .tickValues(legendThreshold.domain())
            .tickFormat(d3.format(".1f"));

        const legend = svg.append("g")
            .classed("legend", true)
            .attr("id", "legend")
            .attr("transform",
                "translate(" + padding.left + "," +
                (padding.top + height + padding.bottom - 2 * legendHeight) + ")"
            );

        legend.append("g")
            .selectAll("rect")
            .data(
                legendThreshold.range().map(color => {
                    const d = legendThreshold.invertExtent(color);
                    if (d[0] === null) {
                        d[0] = legendX.domain()[0];
                    }
                    if (d[1] === null) {
                        d[1] = legendX.domain()[1];
                    }
                    return d;
                })
            )
            .enter()
            .append("rect")
            .style("fill", d => legendThreshold(d[0]))
            .attr("x", d => legendX(d[0]))
            .attr("y", 0)
            .attr("width", d => d[0] && d[1] ? legendX(d[1]) - legendX(d[0]) : legendX(null))
            .attr("height", legendHeight);

        legend.append("g")
            .attr("transform", "translate(" + 0 + "," + legendHeight + ")")
            .call(legendXAxis);

        svg.append("g")
            .classed("map", true)
            .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
            .selectAll("rect")
            .data(data.monthlyVariance)
            .enter()
            .append("rect")
            .attr("class", "cell")
            .attr("data-month", d => d.month)
            .attr("data-year", d => d.year)
            .attr("data-temp", d => data.baseTemperature + d.variance)
            .attr("x", d => xScale(d.year))
            .attr("y", d => yScale(d.month))
            .attr("width", d => xScale.bandwidth(d.year))
            .attr("height", d => yScale.bandwidth(d.month))
            .attr("fill", d => legendThreshold(data.baseTemperature + d.variance))
            .on("mouseover", function (event, d) {
                var date = new Date(d.year, d.month);
                var str =
                    d3.utcFormat("%Y - %B")(date) +
                    "<br />" +
                    d3.format('.1f')(data.baseTemperature + d.variance) + "&degC" +
                    "<br />" +
                    d3.format("+.1f")(d.variance) + "&degC";
                tooltip.attr("data-year", d.year);
                tooltip.show(str, this);
            })
            .on("mouseout", tooltip.hide);
    })
    .catch(err => console.log(err));
