// static/js/scripts.js

document.addEventListener("DOMContentLoaded", () => {
    const generateDataBtn = document.getElementById("generate-data");
    const initializeKMeansBtn = document.getElementById("initialize-kmeans");
    const stepKMeansBtn = document.getElementById("step-kmeans");
    const runKMeansBtn = document.getElementById("run-kmeans");
    const resetBtn = document.getElementById("reset");
    const initMethodSelect = document.getElementById("init-method");
    const numClustersInput = document.getElementById("num-clusters");
    const canvas = document.getElementById("kmeans-chart");
    const ctx = canvas.getContext("2d");
    let chart;
    let dataset = [];
    let history = [];
    let currentStep = 0;
    let manualCentroids = [];
    let isManualMode = false;
    let isInitialized = false;
    let canvasClickHandler;

    // Generate an array of 100 distinct colors
    const generateColors = (numColors) => {
        const colors = [];
        for (let i = 0; i < numColors; i++) {
            const hue = (i * 137.508) % 360; // Use golden angle approximation
            const saturation = 75 + Math.random() * 25; // 75-100%
            const lightness = 45 + Math.random() * 10; // 45-55%
            colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        }
        return colors;
    };

    const colors = generateColors(100);

    const generateRandomData = (numPoints = 100) => {
        const data = [];
        for (let i = 0; i < numPoints; i++) {
            const x = Math.random() * 20 - 10; // -10 to 10
            const y = Math.random() * 20 - 10; // -10 to 10
            data.push([x, y]);
        }
        return data;
    };

    const renderChart = (data = [], centroids = [], clusters = []) => {
        const datasets = [];
    
        if (clusters.length === 0) {
            // No clusters defined, show all points in gray
            datasets.push({
                label: "Data Points",
                data: data.map((point) => ({ x: point[0], y: point[1] })),
                backgroundColor: "rgba(200,200,200,1)",
                pointRadius: 5,
                type: "scatter",
            });
        } else {
            // Clusters are defined, color points according to their cluster
            clusters.forEach((clusterPoints, index) => {
                datasets.push({
                    label: `Cluster ${index + 1}`,
                    data: clusterPoints.map((point) => ({
                        x: point[0],
                        y: point[1],
                    })),
                    backgroundColor: colors[index % colors.length],
                    pointRadius: 5,
                    type: "scatter",
                });
            });
        }
    
        // Centroids
        if (centroids.length > 0) {
            datasets.push({
                label: "Centroids",
                data: centroids.map((centroid) => ({
                    x: centroid[0],
                    y: centroid[1],
                })),
                backgroundColor: "rgba(0,0,0,1)",
                pointRadius: 10,
                pointStyle: "triangle",
                showLine: false,
                type: "scatter",
            });
        }

        if (chart) {
            chart.data.datasets = datasets;
            chart.update();
        } else {
            chart = new Chart(ctx, {
                type: "scatter",
                data: {
                    datasets: datasets,
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    scales: {
                        x: {
                            title: { 
                                display: true, 
                                text: "X"
                            },
                            min: -10,
                            max: 10,
                            ticks: {
                                callback: function(value, index, values) {
                                    if (value === 0) return '0';
                                    return value;
                                }
                            },
                            grid: {
                                drawOnChartArea: false // only want the grid lines for axes
                            }
                        },
                        y: {
                            title: { 
                                display: true, 
                                text: "Y"
                            },
                            min: -10,
                            max: 10,
                            ticks: {
                                callback: function(value, index, values) {
                                    if (value === 0) return '0';
                                    return value;
                                }
                            },
                            grid: {
                                drawOnChartArea: false // only want the grid lines for axes
                            }
                        },
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        annotation: {
                            annotations: {
                                xAxis: {
                                    type: 'line',
                                    yMin: 0,
                                    yMax: 0,
                                    borderColor: 'rgb(0, 0, 0)',
                                    borderWidth: 4,
                                },
                                yAxis: {
                                    type: 'line',
                                    xMin: 0,
                                    xMax: 0,
                                    borderColor: 'rgb(0, 0, 0)',
                                    borderWidth: 4,
                                }
                            }
                        }
                    },
                },
            });
        }
    };

    const validateNumClusters = () => {
        let k = parseInt(numClustersInput.value);
        if (isNaN(k) || k < 1) {
            k = 1;
        } else if (k > 100) {
            k = 100;
        }
        // Limit k to the number of data points for Random initialization
        if (initMethodSelect.value === 'Random' && k > dataset.length) {
            k = dataset.length;
        }
        numClustersInput.value = k;
        return k;
    };

    const fetchKMeansHistory = async (initialize = false) => {
        const k = validateNumClusters();
        const initialization_method = initMethodSelect.value;

        if (k < 1) {
            alert("Number of clusters must be at least 1.");
            return;
        }

        let initial_centroids = null;
        if (initialization_method === "Manual") {
            if (manualCentroids.length !== k) {
                alert(`Please place exactly ${k} centroids on the chart.`);
                return;
            }
            initial_centroids = manualCentroids;
        }

        try {
            const response = await fetch("/api/kmeans", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    data: dataset,
                    k,
                    initialization_method,
                    initial_centroids,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                history = result.history;
                isInitialized = true;
                currentStep = 0;
                renderChart(dataset, history[currentStep][0], history[currentStep][1]);
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while performing K-Means clustering.");
        }
    };

    const stepThroughKMeans = () => {
        if (!history || currentStep >= history.length - 1 || !isInitialized) {
            alert("Algorithm has converged or not initialized.");
            return;
        }
        currentStep++;
        const [centroids, clusters] = history[currentStep];
        renderChart(dataset, centroids, clusters);
    };

    const runToConvergence = () => {
        if (!history || !isInitialized) {
            alert("Please initialize K-Means first.");
            return;
        }
        currentStep = history.length - 1;
        const [centroids, clusters] = history[currentStep];
        renderChart(dataset, centroids, clusters);
        setTimeout(() => alert("K-Means has converged."), 100);
    };

    const resetChart = () => {
        history = [];
        currentStep = 0;
        manualCentroids = [];
        isInitialized = false;
        if (chart) {
            chart.destroy();
            chart = null;
        }
        renderChart(dataset);
        
        // Remove existing event listener if it exists
        if (canvasClickHandler) {
            canvas.removeEventListener("click", canvasClickHandler);
            canvasClickHandler = null;
        }
        
        // Re-enable manual centroid placement if in Manual mode
        if (initMethodSelect.value === "Manual") {
            enableManualCentroidPlacement();
        }
    };

    const enableManualCentroidPlacement = () => {
        const k = parseInt(numClustersInput.value);
        manualCentroids = [];
        
        // Remove existing event listener if it exists
        if (canvasClickHandler) {
            canvas.removeEventListener("click", canvasClickHandler);
        }
        
        canvasClickHandler = function(event) {
            if (initMethodSelect.value !== "Manual") {
                return; // Do nothing if not in Manual mode
            }

            if (manualCentroids.length >= k) {
                canvas.removeEventListener("click", canvasClickHandler);
                canvas.style.cursor = "default";
                console.log(`All ${k} centroids placed successfully. You can now initialize K-Means.`);
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const scaleX = chart.scales.x;
            const scaleY = chart.scales.y;
            const x = scaleX.getValueForPixel(event.clientX - rect.left);
            const y = scaleY.getValueForPixel(event.clientY - rect.top);

            manualCentroids.push([x, y]);
            renderChart(dataset, manualCentroids, []);

            if (manualCentroids.length === k) {
                canvas.removeEventListener("click", canvasClickHandler);
                canvas.style.cursor = "default";
                console.log(`All ${k} centroids placed successfully. You can now initialize K-Means.`);
            } else {
                console.log(`Centroid ${manualCentroids.length} of ${k} placed. Click to place the next centroid.`);
            }
        };

        canvas.addEventListener("click", canvasClickHandler);
        canvas.style.cursor = "crosshair";
    };

    generateDataBtn.addEventListener("click", () => {
        dataset = generateRandomData();
        resetChart();
        console.log(`Generated ${dataset.length} data points.`);
        renderChart(dataset);
    });

    initializeKMeansBtn.addEventListener("click", () => {
        const initialization_method = initMethodSelect.value;
        
        if (initialization_method === "Manual") {
            if (manualCentroids.length === parseInt(numClustersInput.value)) {
                fetchKMeansHistory(true);
            } else {
                alert(`Please place ${parseInt(numClustersInput.value)} centroids before initializing.`);
            }
        } else {
            isManualMode = false;
            manualCentroids = [];
            fetchKMeansHistory(true);
        }
    });

    stepKMeansBtn.addEventListener("click", () => {
        stepThroughKMeans();
    });

    runKMeansBtn.addEventListener("click", () => {
        runToConvergence();
    });

    resetBtn.addEventListener("click", () => {
        resetChart();
    });

    initMethodSelect.addEventListener("change", () => {
        isManualMode = initMethodSelect.value === "Manual";
        manualCentroids = [];
        renderChart(dataset);
        
        if (isManualMode) {
            enableManualCentroidPlacement();
        } else {
            canvas.style.cursor = "default";
        }

        // Revalidate number of clusters when changing initialization method
        validateNumClusters();
    });

    numClustersInput.addEventListener("change", () => {
        if (initMethodSelect.value === "Manual") {
            manualCentroids = [];
            renderChart(dataset);
            enableManualCentroidPlacement();
        }
    });

    // Initial data generation and chart rendering
    dataset = generateRandomData();
    renderChart(dataset);

    // Check if Manual mode is initially selected
    if (initMethodSelect.value === "Manual") {
        isManualMode = true;
        enableManualCentroidPlacement();
    } else {
        canvas.style.cursor = "default";
    }
});

