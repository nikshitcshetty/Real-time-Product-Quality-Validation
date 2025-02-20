document.addEventListener("DOMContentLoaded", function () {
    updateDashboard();
    setInterval(updateDashboard, 5000); // Refresh every 5 seconds
});

let qualityChart; // Global variable for the chart instance

// Fetch live product validation data from Node.js server
async function updateDashboard() {
    try {
        const response = await fetch("http://localhost:3000/api/product-validation");
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();

        // Update validation score and timestamp
        document.getElementById("validation-score").innerText = `${data.validationScore}%`;
        document.getElementById("timestamp").innerText = data.timestamp;

        // Update product validation table
        const tableBody = document.querySelector("#product-table tbody");
        tableBody.innerHTML = ""; // Clear previous data

        data.products.forEach((product) => {
            const row = `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.defects}</td>
                    <td class="${getStatusClass(product.status)}">${product.status}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML("beforeend", row);
        });

        // Update Product Quality Chart with percentages
        updateQualityChart(data.products);
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById("validation-score").innerText = "Error";
        document.getElementById("timestamp").innerText = "--:--";
    }
}

// Get status class for styling
function getStatusClass(status) {
    if (status === "Pass") return "text-success";
    if (status === "Warning") return "text-warning";
    return "text-danger";
}

// Update Product Quality Chart with percentages
function updateQualityChart(products) {
    const totalProducts = products.length;
    const passCount = products.filter(p => p.status === "Pass").length;
    const warningCount = products.filter(p => p.status === "Warning").length;
    const failCount = products.filter(p => p.status === "Fail").length;

    // Calculate percentages
    const passPercentage = ((passCount / totalProducts) * 100).toFixed(1);
    const warningPercentage = ((warningCount / totalProducts) * 100).toFixed(1);
    const failPercentage = ((failCount / totalProducts) * 100).toFixed(1);

    const ctx = document.getElementById("qualityChart").getContext("2d");

    if (qualityChart) {
        // Update existing chart
        qualityChart.data.datasets[0].data = [passPercentage, warningPercentage, failPercentage];
        qualityChart.data.labels = [
            `Pass (${passPercentage}%)`,
            `Warning (${warningPercentage}%)`,
            `Fail (${failPercentage}%)`
        ];
        qualityChart.update();
    } else {
        // Create new chart if it doesn't exist
        qualityChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: [
                    `Pass (${passPercentage}%)`,
                    `Warning (${warningPercentage}%)`,
                    `Fail (${failPercentage}%)`
                ],
                datasets: [{
                    data: [passPercentage, warningPercentage, failPercentage],
                    backgroundColor: ["#28a745", "#ffc107", "#dc3545"]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                return `${tooltipItem.label}: ${tooltipItem.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }
}
