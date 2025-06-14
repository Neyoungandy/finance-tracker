// Reports module
const reportsModule = {
    init: () => {
        if (!app.auth.isAuthenticated()) {
            app.navigation.navigateTo('login');
            return;
        }

        reportsModule.initializeCharts();
        reportsModule.setupEventListeners();
        reportsModule.loadReports();
    },

    initializeCharts: () => {
        // Spending Trends Chart
        const spendingTrendsChart = new Chart(
            document.getElementById('spendingTrends'),
            {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Spending',
                        data: [],
                        borderColor: '#e74c3c',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );

        // Category Distribution Chart
        const categoryDistributionChart = new Chart(
            document.getElementById('categoryDistribution'),
            {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#2ecc71', '#3498db', '#9b59b6', '#e74c3c',
                            '#f1c40f', '#1abc9c', '#e67e22', '#34495e'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            }
        );

        // Income vs Expenses Chart
        const incomeExpensesChart = new Chart(
            document.getElementById('incomeExpenses'),
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Income',
                            data: [],
                            backgroundColor: '#2ecc71'
                        },
                        {
                            label: 'Expenses',
                            data: [],
                            backgroundColor: '#e74c3c'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            }
        );

        // Store chart instances
        reportsModule.charts = {
            spendingTrends: spendingTrendsChart,
            categoryDistribution: categoryDistributionChart,
            incomeExpenses: incomeExpensesChart
        };
    },

    setupEventListeners: () => {
        // Date range selector
        const dateRange = document.getElementById('reportDateRange');
        if (dateRange) {
            dateRange.addEventListener('change', () => {
                reportsModule.loadReports();
            });
        }

        // Report type selector
        const reportType = document.getElementById('reportType');
        if (reportType) {
            reportType.addEventListener('change', () => {
                reportsModule.loadReports();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportReport');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                reportsModule.exportReport();
            });
        }
    },

    loadReports: async () => {
        try {
            app.utils.showLoading();
            const dateRange = document.getElementById('reportDateRange').value;
            const reportType = document.getElementById('reportType').value;

            const response = await fetch(`${app.API.reports}?dateRange=${dateRange}&type=${reportType}`, {
                headers: {
                    'Authorization': `Bearer ${app.auth.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch reports');
            const reportData = await response.json();

            reportsModule.updateCharts(reportData);
            reportsModule.updateReportSummary(reportData);
            reportsModule.updateInsights(reportData.insights);
        } catch (error) {
            app.utils.showNotification('Error loading reports', 'error');
            console.error('Reports error:', error);
        } finally {
            app.utils.hideLoading();
        }
    },

    updateCharts: (data) => {
        // Update Spending Trends Chart
        reportsModule.charts.spendingTrends.data.labels = data.spendingTrends.labels;
        reportsModule.charts.spendingTrends.data.datasets[0].data = data.spendingTrends.data;
        reportsModule.charts.spendingTrends.update();

        // Update Category Distribution Chart
        reportsModule.charts.categoryDistribution.data.labels = data.categoryDistribution.labels;
        reportsModule.charts.categoryDistribution.data.datasets[0].data = data.categoryDistribution.data;
        reportsModule.charts.categoryDistribution.update();

        // Update Income vs Expenses Chart
        reportsModule.charts.incomeExpenses.data.labels = data.incomeExpenses.labels;
        reportsModule.charts.incomeExpenses.data.datasets[0].data = data.incomeExpenses.income;
        reportsModule.charts.incomeExpenses.data.datasets[1].data = data.incomeExpenses.expenses;
        reportsModule.charts.incomeExpenses.update();
    },

    updateReportSummary: (data) => {
        const summary = data.summary;
        document.getElementById('totalIncome').textContent = app.utils.formatCurrency(summary.totalIncome);
        document.getElementById('totalExpenses').textContent = app.utils.formatCurrency(summary.totalExpenses);
        document.getElementById('netSavings').textContent = app.utils.formatCurrency(summary.netSavings);
        document.getElementById('savingsRate').textContent = `${summary.savingsRate}%`;
    },

    updateInsights: (insights) => {
        const container = document.getElementById('insights');
        if (!container) return;

        container.innerHTML = insights.map(insight => `
            <div class="insight-item card mb-3">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="insight-icon me-3">
                            ${reportsModule.getInsightIcon(insight.type)}
                        </div>
                        <div>
                            <h5 class="card-title mb-1">${insight.title}</h5>
                            <p class="card-text">${insight.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    getInsightIcon: (type) => {
        const icons = {
            spending_trend: '<i class="fas fa-chart-line text-primary"></i>',
            budget_alert: '<i class="fas fa-exclamation-triangle text-warning"></i>',
            savings_opportunity: '<i class="fas fa-piggy-bank text-success"></i>',
            anomaly: '<i class="fas fa-exclamation-circle text-danger"></i>'
        };
        return icons[type] || '<i class="fas fa-info-circle text-info"></i>';
    },

    exportReport: async () => {
        try {
            app.utils.showLoading();
            const dateRange = document.getElementById('reportDateRange').value;
            const reportType = document.getElementById('reportType').value;

            const response = await fetch(`${app.API.reports}/export?dateRange=${dateRange}&type=${reportType}`, {
                headers: {
                    'Authorization': `Bearer ${app.auth.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to export report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financial-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            app.utils.showNotification('Report exported successfully', 'success');
        } catch (error) {
            app.utils.showNotification(error.message, 'error');
        } finally {
            app.utils.hideLoading();
        }
    }
};

// Initialize reports when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (app.state.currentPage === 'reports') {
        reportsModule.init();
    }
});

// Export reports module
window.reportsModule = reportsModule; 