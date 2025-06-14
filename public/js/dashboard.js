// Dashboard module
const dashboardModule = {
    init: () => {
        if (!app.auth.isAuthenticated()) {
            app.navigation.navigateTo('login');
            return;
        }

        dashboardModule.loadDashboardData();
        dashboardModule.initializeCharts();
        dashboardModule.setupEventListeners();
    },

    loadDashboardData: async () => {
        try {
            app.utils.showLoading();
            const [transactions, budgets, reports] = await Promise.all([
                dashboardModule.fetchTransactions(),
                dashboardModule.fetchBudgets(),
                dashboardModule.fetchReports()
            ]);

            dashboardModule.updateDashboardStats(transactions, budgets);
            dashboardModule.updateRecentTransactions(transactions);
            dashboardModule.updateBudgetProgress(budgets);
            dashboardModule.updateCharts(transactions, budgets, reports);
        } catch (error) {
            app.utils.showNotification('Error loading dashboard data', 'error');
            console.error('Dashboard data error:', error);
        } finally {
            app.utils.hideLoading();
        }
    },

    fetchTransactions: async () => {
        const response = await fetch(`${app.API.transactions}/recent`, {
            headers: {
                'Authorization': `Bearer ${app.auth.getToken()}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch transactions');
        return response.json();
    },

    fetchBudgets: async () => {
        const response = await fetch(`${app.API.budgets}/active`, {
            headers: {
                'Authorization': `Bearer ${app.auth.getToken()}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch budgets');
        return response.json();
    },

    fetchReports: async () => {
        const response = await fetch(`${app.API.reports}/summary`, {
            headers: {
                'Authorization': `Bearer ${app.auth.getToken()}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch reports');
        return response.json();
    },

    updateDashboardStats: (transactions, budgets) => {
        const stats = {
            totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            budgetStatus: budgets.reduce((acc, budget) => {
                acc[budget.category] = {
                    spent: budget.spent,
                    limit: budget.amount,
                    percentage: (budget.spent / budget.amount) * 100
                };
                return acc;
            }, {})
        };

        // Update DOM
        document.getElementById('totalIncome').textContent = app.utils.formatCurrency(stats.totalIncome);
        document.getElementById('totalExpenses').textContent = app.utils.formatCurrency(stats.totalExpenses);
        document.getElementById('netSavings').textContent = app.utils.formatCurrency(stats.totalIncome - stats.totalExpenses);
    },

    updateRecentTransactions: (transactions) => {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        container.innerHTML = transactions.slice(0, 5).map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <h4>${transaction.description}</h4>
                    <p class="text-muted">${app.utils.formatDate(transaction.date)}</p>
                </div>
                <div class="transaction-amount ${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${app.utils.formatCurrency(transaction.amount)}
                </div>
            </div>
        `).join('');
    },

    updateBudgetProgress: (budgets) => {
        const container = document.getElementById('budgetProgress');
        if (!container) return;

        container.innerHTML = budgets.map(budget => {
            const percentage = (budget.spent / budget.amount) * 100;
            const status = percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : 'success';

            return `
                <div class="budget-item">
                    <div class="budget-header">
                        <h4>${budget.category}</h4>
                        <span>${app.utils.formatCurrency(budget.spent)} / ${app.utils.formatCurrency(budget.amount)}</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar bg-${status}" role="progressbar" 
                             style="width: ${Math.min(percentage, 100)}%" 
                             aria-valuenow="${percentage}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    initializeCharts: () => {
        // Spending by Category Chart
        const spendingChart = new Chart(
            document.getElementById('spendingByCategory'),
            {
                type: 'doughnut',
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
            document.getElementById('incomeVsExpenses'),
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
        dashboardModule.charts = {
            spending: spendingChart,
            incomeExpenses: incomeExpensesChart
        };
    },

    updateCharts: (transactions, budgets, reports) => {
        // Update Spending by Category Chart
        const spendingData = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});

        dashboardModule.charts.spending.data.labels = Object.keys(spendingData);
        dashboardModule.charts.spending.data.datasets[0].data = Object.values(spendingData);
        dashboardModule.charts.spending.update();

        // Update Income vs Expenses Chart
        const monthlyData = transactions.reduce((acc, t) => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short' });
            if (!acc[month]) {
                acc[month] = { income: 0, expenses: 0 };
            }
            acc[month][t.type] += t.amount;
            return acc;
        }, {});

        const months = Object.keys(monthlyData);
        dashboardModule.charts.incomeExpenses.data.labels = months;
        dashboardModule.charts.incomeExpenses.data.datasets[0].data = months.map(m => monthlyData[m].income);
        dashboardModule.charts.incomeExpenses.data.datasets[1].data = months.map(m => monthlyData[m].expenses);
        dashboardModule.charts.incomeExpenses.update();
    },

    setupEventListeners: () => {
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                dashboardModule.loadDashboardData();
            });
        }

        // Date range selector
        const dateRange = document.getElementById('dateRange');
        if (dateRange) {
            dateRange.addEventListener('change', () => {
                dashboardModule.loadDashboardData();
            });
        }
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (app.state.currentPage === 'dashboard') {
        dashboardModule.init();
    }
});

// Export dashboard module
window.dashboardModule = dashboardModule; 