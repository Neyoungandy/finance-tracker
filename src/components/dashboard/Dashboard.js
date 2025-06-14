import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const HERO_IMAGE = 'https://undraw.co/api/illustrations/finance/undraw_savings_re_eq4w.svg';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    recentTransactions: [],
    categorySpending: [],
    monthlyTrend: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, transactionsRes, categoryRes, trendRes] = await Promise.all([
          axios.get('/api/transactions/summary'),
          axios.get('/api/transactions/recent'),
          axios.get('/api/transactions/categories'),
          axios.get('/api/transactions/trend'),
        ]);

        setSummary({
          totalIncome: summaryRes.data.totalIncome,
          totalExpenses: summaryRes.data.totalExpenses,
          balance: summaryRes.data.balance,
          recentTransactions: transactionsRes.data,
          categorySpending: categoryRes.data,
          monthlyTrend: trendRes.data,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Hero Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: { xs: 'column', md: 'row' },
          mb: 4,
          mt: 2,
          gap: 4,
        }}
      >
        <Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Welcome to Finance Tracker!
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Take control of your finances, track your spending, and achieve your goals.
          </Typography>
        </Box>
        <Box>
          <img
            src={HERO_IMAGE}
            alt="Finance Tracker Hero"
            style={{
              maxWidth: 350,
              width: '100%',
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              background: '#fff',
            }}
          />
        </Box>
      </Box>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Total Income
            </Typography>
            <Typography component="p" variant="h4">
              ${summary.totalIncome.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="error" gutterBottom>
              Total Expenses
            </Typography>
            <Typography component="p" variant="h4">
              ${summary.totalExpenses.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="success" gutterBottom>
              Balance
            </Typography>
            <Typography component="p" variant="h4">
              ${summary.balance.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>

        {/* Monthly Trend Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Monthly Trend
            </Typography>
            <ResponsiveContainer>
              <BarChart data={summary.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#4CAF50" name="Income" />
                <Bar dataKey="expenses" fill="#F44336" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Spending Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Category Spending
            </Typography>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={summary.categorySpending}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {summary.categorySpending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Transactions
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '8px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentTransactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td style={{ padding: '8px' }}>
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '8px' }}>{transaction.description}</td>
                      <td style={{ padding: '8px' }}>{transaction.category}</td>
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'right',
                          color: transaction.type === 'income' ? '#4CAF50' : '#F44336',
                        }}
                      >
                        ${transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 