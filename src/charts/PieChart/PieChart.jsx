import React, { useRef, useState } from "react";
import styles from "./PieChart.module.css";
import { useEffect } from "react";
import * as d3 from "d3";

function PieChart() {
  const [chartData, setChartData] = useState([]);
  const svgRef = useRef(null);

  function formatNumber(num) {
    return num.toLocaleString("de-DE");
  }

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("./chartData.json");
      const repos = await response.json();
      setChartData(repos);
    }
    fetchData();
  }, []);
  useEffect(() => {
    if (chartData.length === 0) return; // Esperar a que los datos estén disponibles

    const color = d3.scaleOrdinal(d3.schemeObservable10);

    const width = 600;
    const height = 600;

    const pie = d3.pie().value((d) => d.value);
    const data = chartData[0]["chart"]["languages"]
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const zeroArc = d3
      .arc()
      .innerRadius(0) // donde arranca
      .outerRadius(15) // donde termina
      .cornerRadius(1);
    const arc = d3
      .arc()
      .innerRadius(0) // donde arranca
      .outerRadius(250) // donde termina
      .cornerRadius(5);
    const hoverArc = d3
      .arc()
      .innerRadius(0) // donde arranca
      .outerRadius(260) // donde termina
      .cornerRadius(1);

    // Crear el contenedor SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const mainG = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const arcs = mainG
      .selectAll("arc")
      .append("g")
      .attr("class", "arc")
      .data(pie(data))
      .enter();

    arcs
      .append("path")
      .attr("d", zeroArc)
      .attr("fill", (d) => color(d))
      .style("opacity", 0.8)
      .on("mouseover", function (event, d) {
        // Show tooltip on hover
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`${d.data.language}: ${formatNumber(d.data.value)}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);

        arcs
          .selectAll(`.${styles.text}`)
          .transition()
          .duration(300)
          .style("opacity", (textData) => (textData === d ? 1 : 0.1));

        arcs
          .selectAll("path")
          .transition()
          .duration(300)
          .attr("d", arc)
          .style("opacity", (pathData) => (pathData === d ? 0.95 : 0.4));

        d3.select(this)
          .transition()
          .duration(300)
          .style("opacity", 0.95)
          .attr("d", hoverArc);
      })
      .on("mousemove", function (event) {
        // Update tooltip position on mouse move
        tooltip
          .style("left", `${event.pageX + 2}px`)
          .style("top", `${event.pageY - 25}px`);
      })

      .on("mouseout", function (d, s) {
        // Hide tooltip when mouse leaves
        tooltip.transition().duration(200).style("opacity", 0);
        d3.selectAll("path")
          .transition()
          .duration(300)
          .attr("d", arc)
          .style("opacity", 0.8);
        d3.selectAll(`.${styles.text}`)
          .transition()
          .duration(300)
          .style("opacity", 0.8);
      })
      .transition()
      .duration(1500)
      .delay((d, i) => 200 * i)
      .attr("d", arc);

    const arcPadding = 30; // Distance between the arc and text
    let previousY = 0; // Track the last used position to avoid overlap

    const text = arcs
      .append("text")
      .attr("class", styles.text)
      .attr("transform", (d) => {
        const centroid = arc.centroid(d);
        let offsetX = centroid[0] - 30;
        let offsetY = centroid[1];

        // Apply a radial offset to prevent overlap
        if (Math.abs(offsetY - previousY) < arcPadding) {
          offsetY += arcPadding;
        }
        previousY = offsetY;

        return `translate(${offsetX}, ${offsetY})`;
      })
      .text((d) => `${d.data.language}`)
      .style("font-size", "16px")
      .style("fill", "#afaff")
      .style("font-weight", "semi-bold")
      .style("pointer-events", "none")
      .style("z-index", "2")
      .attr("id", (d) => d.id);
  }, [chartData]);
  // Create a tooltip element
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", styles.tooltip)
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background-color", "rgba(255 255 255 / 0.7)")
    .style("color", "black")
    .style("border-radius", "5px")
    .style("padding", "5px 10px")
    .style("pointer-events", "none")
    .style("border", "1px solid lab(0 0 0 / 0.43)");

  return (
    <div className={styles.chart}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default PieChart;
