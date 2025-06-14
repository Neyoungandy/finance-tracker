// Budget module
const budgetModule = {
    init: () => {
        if (!app.auth.isAuthenticated()) {
            app.navigation.navigateTo('login');
            return;
        }

        budgetModule.loadBudgets();
        budgetModule.setupEventListeners();
        budgetModule.initializeCharts();
    },

    loadBudgets: async () => {
        try {
            app.utils.showLoading();
            const response = await fetch(`${app.API.budgets}`, {
                headers: {
                    'Authorization': `Bearer ${app.auth.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch budgets');
            const budgets = await response.json();

            budgetModule.renderBudgets(budgets);
            budgetModule.updateBudgetStats(budgets);
            budgetModule.updateCharts(budgets);
        } catch (error) {
            app.utils.showNotification('Error loading budgets', 'error');
            console.error('Budgets error:', error);
        } finally {
            app.utils.hideLoading();
        }
    },

    renderBudgets: (budgets) => {
        const container = document.getElementById('budgetsList');
        if (!container) return;

        if (budgets.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <p class="text-muted">No budgets found</p>
                    <button class="btn btn-primary" onclick="budgetModule.showBudgetModal()">
                        Create Your First Budget
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = budgets.map(budget => `
            <div class="budget-item card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h5 class="card-title mb-1">${budget.category}</h5>
                            <p class="card-text text-muted mb-0">
                                ${budget.period} • ${app.utils.formatDate(budget.startDate)} - ${app.utils.formatDate(budget.endDate)}
                            </p>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" 
                                    onclick="budgetModule.editBudget('${budget._id}')">
                                Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger" 
                                    onclick="budgetModule.deleteBudget('${budget._id}')">
                                Delete
                            </button>
                        </div>
                    </div>
                    <div class="budget-progress">
                        <div class="d-flex justify-content-between mb-2">
                            <span>${app.utils.formatCurrency(budget.spent)} / ${app.utils.formatCurrency(budget.amount)}</span>
                            <span>${Math.round((budget.spent / budget.amount) * 100)}%</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar ${budgetModule.getProgressBarClass(budget)}" 
                                 role="progressbar" 
                                 style="width: ${Math.min((budget.spent / budget.amount) * 100, 100)}%" 
                                 aria-valuenow="${budget.spent}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="${budget.amount}">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    getProgressBarClass: (budget) => {
        const percentage = (budget.spent / budget.amount) * 100;
        if (percentage > 100) return 'bg-danger';
        if (percentage > 80) return 'bg-warning';
        return 'bg-success';
    },

    updateBudgetStats: (budgets) => {
        const stats = budgets.reduce((acc, budget) => {
            acc.totalBudget += budget.amount;
            acc.totalSpent += budget.spent;
            acc.byCategory[budget.category] = {
                budget: budget.amount,
                spent: budget.spent
            };
            return acc;
        }, {
            totalBudget: 0,
            totalSpent: 0,
            byCategory: {}
        });

        // Update DOM
        document.getElementById('totalBudget').textContent = app.utils.formatCurrency(stats.totalBudget);
        document.getElementById('totalSpent').textContent = app.utils.formatCurrency(stats.totalSpent);
        document.getElementById('remainingBudget').textContent = 
            app.utils.formatCurrency(stats.totalBudget - stats.totalSpent);
    },

    initializeCharts: () => {
        // Budget Overview Chart
        const overviewChart = new Chart(
            document.getElementById('budgetOverview'),
            {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Budget',
                            data: [],
                            backgroundColor: '#3498db'
                        },
                        {
                            label: 'Spent',
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

        // Store chart instance
        budgetModule.chart = overviewChart;
    },

    updateCharts: (budgets) => {
        const categories = budgets.map(b => b.category);
        const budgetAmounts = budgets.map(b => b.amount);
        const spentAmounts = budgets.map(b => b.spent);

        budgetModule.chart.data.labels = categories;
        budgetModule.chart.data.datasets[0].data = budgetAmounts;
        budgetModule.chart.data.datasets[1].data = spentAmounts;
        budgetModule.chart.update();
    },

    setupEventListeners: () => {
        // Add budget button
        const addBtn = document.getElementById('addBudget');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                budgetModule.showBudgetModal();
            });
        }

        // Budget form submission
        const form = document.getElementById('budgetForm');
        if (form) {
            form.addEventListener('submit', budgetModule.handleBudgetSubmit);
        }
    },

    showBudgetModal: (budget = null) => {
        const modal = new bootstrap.Modal(document.getElementById('budgetModal'));
        const form = document.getElementById('budgetForm');
        const title = document.getElementById('budgetModalTitle');

        // Reset form
        form.reset();

        if (budget) {
            // Edit mode
            title.textContent = 'Edit Budget';
            form.dataset.mode = 'edit';
            form.dataset.id = budget._id;

            // Fill form with budget data
            Object.keys(budget).forEach(key => {
                const input = form.elements[key];
                if (input) input.value = budget[key];
            });
        } else {
            // Add mode
            title.textContent = 'Create Budget';
            form.dataset.mode = 'add';
            delete form.dataset.id;
        }

        modal.show();
    },

    handleBudgetSubmit: async (e) => {
        e.preventDefault();
        const form = e.target;
        const mode = form.dataset.mode;
        const formData = new FormData(form);
        const budgetData = Object.fromEntries(formData.entries());

        try {
            app.utils.showLoading();
            const url = mode === 'edit' 
                ? `${app.API.budgets}/${form.dataset.id}`
                : app.API.budgets;
            
            const response = await fetch(url, {
                method: mode === 'edit' ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${app.auth.getToken()}`
                },
                body: JSON.stringify(budgetData)
            });

            if (!response.ok) throw new Error('Failed to save budget');

            app.utils.showNotification(
                `Budget ${mode === 'edit' ? 'updated' : 'created'} successfully`,
                'success'
            );

            // Close modal and refresh list
            const modal = bootstrap.Modal.getInstance(document.getElementById('budgetModal'));
            modal.hide();
            budgetModule.loadBudgets();
        } catch (error) {
            app.utils.showNotification(error.message, 'error');
        } finally {
            app.utils.hideLoading();
        }
    },

    editBudget: async (id) => {
        try {
            app.utils.showLoading();
            const response = await fetch(`${app.API.budgets}/${id}`, {
                headers: {
                    'Authorization': `Bearer ${app.auth.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch budget');
            const budget = await response.json();

            budgetModule.showBudgetModal(budget);
        } catch (error) {
            app.utils.showNotification(error.message, 'error');
        } finally {
            app.utils.hideLoading();
        }
    },

    deleteBudget: async (id) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;

        try {
            app.utils.showLoading();
            const response = await fetch(`${app.API.budgets}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${app.auth.getToken()}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete budget');

            app.utils.showNotification('Budget deleted successfully', 'success');
            budgetModule.loadBudgets();
        } catch (error) {
            app.utils.showNotification(error.message, 'error');
        } finally {
            app.utils.hideLoading();
        }
    }
};

// Initialize budget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (app.state.currentPage === 'budget') {
        budgetModule.init();
    }
});

// Export budget module
window.budgetModule = budgetModule; 