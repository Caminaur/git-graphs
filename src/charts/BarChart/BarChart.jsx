import React, { useEffect, useRef, useState } from "react";
import styles from "./BarChart.module.css";
import * as d3 from "d3";

function BarChart() {
  const [defaultChartData, setDefaultChartData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const svgRef = useRef(null);
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  const width = 700; // Ancho del gráfico
  const height = 400; // Alto del gráfico
  const margin = { top: 20, right: 20, bottom: 50, left: 100 };

  function makeTooltip() {
    return d3
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
      .style("border", "2px solid lab(0 0 0 / 0.43)");
  }

  function formatNumber(num) {
    return num.toLocaleString("de-DE");
  }

  function darkenColorHSL(color, percent) {
    // Convert the color to HSL
    const hsl = d3.hsl(color);

    // Reduce lightness by the percentage
    hsl.l *= 1 - percent / 100;

    // Return the darker color as a string
    return hsl.formatHex();
  }

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("./chartData.json");
      const repos = await response.json();
      setDefaultChartData(repos[0]["chart"]["languages"]);
      setChartData(repos[0]["chart"]["languages"]);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (chartData.length === 0) return;
    const data = chartData;
    data.sort((a, b) => b.value - a.value);

    // Tooltip
    const tooltip = makeTooltip();

    // Crear el SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Crear escalas
    const xScale = d3
      .scaleBand()
      .domain(
        data.map((d) => {
          return d.language;
        })
      ) // Categorías en el eje X
      .range([margin.left, width - margin.right]) // Rango del eje X
      .padding(0.1); // Espaciado entre las barras

    const yScale = d3
      .scaleLog()
      .domain([1, d3.max(data, (d) => d.value * 1.5)]) // Valores en el eje Y
      .range([height - margin.bottom, margin.top]); // Rango del eje Y

    // Dibujar las barras
    svg
      .selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.language)) // Posición X
      .attr("y", (d) => yScale(d.value)) // Posición Y
      .attr("width", xScale.bandwidth()) // Ancho de las barras
      .attr("height", (d) => height - margin.bottom - yScale(d.value)) // Altura de las barras
      .attr("fill", (d) => color(d)) // Color de las barras
      .on("mouseover", function (event, d) {
        let tooltipColor = darkenColorHSL(color(d), 10);
        // Tooltip hover
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`${d.language}: ${formatNumber(d.value)}`)
          .style("left", `${event.pageX + 10}px`)

          .style("color", (d) => "white")
          .style("background-color", tooltipColor)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mousemove", function (event) {
        // Update tooltip position on mouse move
        tooltip
          .style("left", `${event.pageX + 2}px`)
          .style("top", `${event.pageY - 25}px`);
      })
      .on("mouseout", function () {
        // Hide tooltip when mouse leaves
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Eje X
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    // Eje Y
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(5, "~s"));
  }, [chartData]);

  return (
    <div className={styles.chart}>
      <div className={styles.chartContainer}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}

export default BarChart;
