import React, { useRef, useState } from "react";
import styles from "./PieChart.module.css";
import { useEffect } from "react";
import * as d3 from "d3";

function PieChart() {
  const [defaultChartData, setDefaultChartData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const svgRef = useRef(null);

  const categories = ["FRONTEND", "BACKEND"];
  const frontTech = [
    "HTML",
    "CSS",
    "JAVASCRIPT",
    "Blade",
    "Vue",
    "SCSS",
    "Less",
  ];
  const backendTech = [
    "Dart",
    "Swift",
    "Kotlin",
    "Objective-C",
    "PHP",
    "Shell",
    "Python",
  ];

  const width = 600;
  const height = 600;

  const color = d3.scaleOrdinal(d3.schemeObservable10);

  function formatNumber(num) {
    return num.toLocaleString("de-DE");
  }

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

  function createArcs() {
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

    return { zeroArc, arc, hoverArc };
  }

  function highlightArc(arcs, arc, hoverArc, d, selectedArc) {
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

    selectedArc
      .transition()
      .duration(300)
      .style("opacity", 0.95)
      .attr("d", hoverArc);
  }

  function filterData(category) {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setChartData(defaultChartData);
    } else {
      let newData = [];
      if (category === "FRONTEND") {
        newData = defaultChartData.filter((data) =>
          frontTech.includes(data.language)
        );
      }
      if (category === "BACKEND") {
        newData = defaultChartData.filter((data) =>
          backendTech.includes(data.language)
        );
      }
      setSelectedCategory(category);
      setChartData(newData); // Filtrar los datos según la categoría seleccionada
    }
  }

  function sliceDate(data) {
    if (selectedCategory !== null) {
      if (selectedCategory === "FRONTEND") {
        return data.sort((a, b) => b.value - a.value).slice(0, 4);
      } else {
        return data.sort((a, b) => b.value - a.value).slice(0, 3);
      }
    } else {
      return data.sort((a, b) => b.value - a.value).slice(0, 6);
    }
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
    if (chartData.length === 0) return; // Esperar a que los datos estén disponibles

    const pie = d3.pie().value((d) => d.value);
    const data = sliceDate(chartData);

    // Arcs
    const { zeroArc, arc, hoverArc } = createArcs();

    // Tooltip
    const tooltip = makeTooltip();

    // SVG
    const svg = d3
      .select(svgRef.current)
      .attr("class", styles.pieChart)
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
        // Tooltip hover
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`${d.data.language}: ${formatNumber(d.data.value)}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);

        highlightArc(arcs, arc, hoverArc, d, d3.select(this));
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

    const arcYPadding = 30; // Distance between the arc and text
    const arcXPadding = 50; // Distance between the arc and text
    let previousY = 0; // Track the last used position to avoid overlap
    let previousX = 0; // Track the last used position to avoid overlap

    const text = arcs
      .append("text")
      .attr("class", styles.text)
      .attr("transform", (d) => {
        const centroid = arc.centroid(d);
        let offsetX = centroid[0] - 25;
        let offsetY = centroid[1];

        if (
          Math.abs(offsetY - previousY) < arcYPadding &&
          Math.abs(offsetX - previousX) < arcXPadding
        ) {
          offsetY += arcYPadding;
        }
        previousX = offsetX;
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

    const chartContainer = d3.select(`.${styles.chartContainer}`);

    chartContainer.selectAll(`.${styles.selectorDiv}`).remove();

    const selectorDiv = chartContainer
      .append("div")
      .attr("class", styles.selectorDiv);

    const selectorList = selectorDiv.append("ul");

    categories.forEach((category, index) => {
      selectorList
        .append("li")
        .text(category)
        .attr(
          "class",
          `${styles.selector} ${
            selectedCategory === category ? styles.selected : ""
          }`
        )
        .on("click", (e) => {
          filterData(category); // Llama a tu función de filtrado
        });
    });
  }, [chartData, selectedCategory]);

  return (
    <div className={styles.chart}>
      <div className={styles.chartContainer}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}

export default PieChart;
