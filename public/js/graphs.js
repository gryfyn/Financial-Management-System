// graph.js

document.addEventListener('DOMContentLoaded', function () {
    // Fetch savings data from the backend
    fetch('/get-savings-data')
      .then(response => response.json())
      .then(data => {
        // Extract shortTermSavings and longTermSavings from the data
        const shortTermSavings = data.shortTermSavings || 0;
        const longTermSavings = data.longTermSavings || 0;
  
        // Create a bar graph
        const ctx = document.getElementById('savingsGraph').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Short Term', 'Long Term'],
            datasets: [{
              label: 'Savings',
              data: [shortTermSavings, longTermSavings],
              backgroundColor: ['rgb(255, 192, 203)', 'rgb(144, 238, 144)'], // Pink and Green
              borderColor: ['rgb(255, 192, 203)', 'rgb(144, 238, 144)'],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      })
      .catch(error => {
        console.error('Error fetching savings data:', error);
      });
  });
  

  document.addEventListener("DOMContentLoaded", function () {
    // Fetch data for savings
    fetch('/get-savings-data') // Assuming you have an endpoint to get savings data
        .then(response => response.json())
        .then(data => {
            // Extract relevant data for savings
            const shortTermSavings = data.shortTermSavings;
            const longTermSavings = data.longTermSavings;

            // Call a function to render savings graph
            renderSavingsGraph(shortTermSavings, longTermSavings);
        })
        .catch(error => console.error('Error fetching savings data:', error));

    // Fetch data for loans
    fetch('/get-loans-data') // Assuming you have an endpoint to get loans data
        .then(response => response.json())
        .then(data => {
            // Extract relevant data for loans
            const shortTermLoans = data.shortTermLoans;
            const longTermLoans = data.longTermLoans;

            // Call a function to render loans graph
            renderLoansGraph(shortTermLoans, longTermLoans);
        })
        .catch(error => console.error('Error fetching loans data:', error));
});

function renderSavingsGraph(shortTermSavings, longTermSavings) {
    const savingsCanvas = document.getElementById('savingsGraph').getContext('2d');

    new Chart(savingsCanvas, {
        type: 'bar',
        data: {
            labels: ['Short Term', 'Long Term'],
            datasets: [{
                label: 'Savings',
                data: [shortTermSavings, longTermSavings],
                backgroundColor: ['#FF69B4', '#00FF00'], // Pink for short term, Green for long term
            }],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderLoansGraph(shortTermLoans, longTermLoans) {
    const loansCanvas = document.getElementById('loansGraph').getContext('2d');

    new Chart(loansCanvas, {
        type: 'bar',
        data: {
            labels: ['Short Term', 'Long Term'],
            datasets: [{
                label: 'Loans',
                data: [shortTermLoans, longTermLoans],
                backgroundColor: ['#FF69B4', '#00FF00'], // Pink for short term, Green for long term
            }],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// Update the pie chart with expenses data
function updateExpenseChart(expensesData) {
    const categories = expensesData.map((expense) => expense.category);
    const amounts = expensesData.map((expense) => expense.total);
  
    expenseChart.data.labels = categories;
    expenseChart.data.datasets[0].data = amounts;
    expenseChart.update();
  }
  
  // Fetch expenses data and update the chart
  function fetchExpensesDataAndDrawChart() {
    fetch('/get-expenses-data')
      .then((response) => response.json())
      .then((expensesData) => {
        updateExpenseChart(expensesData);
      })
      .catch((error) => {
        console.error('Error fetching expenses data:', error.stack);
      });
  }
  
  // Call the function to fetch expenses data and draw the chart
  fetchExpensesDataAndDrawChart();

  // Display pie chart comparing total expense vs income
function displayExpenseVsIncomePieChart() {
    // Fetch total income from the backend
    fetch('/get-total-income')
        .then(response => response.json())
        .then(data => {
            const totalIncome = data.totalIncome;

            // Fetch total expense from the backend
            fetch('/get-total-expense')
                .then(response => response.json())
                .then(data => {
                    const totalExpense = data.totalExpense;

                    // Display pie chart
                    displayPieChart('expenseVsIncomeChart', ['Income', 'Expense'], [totalIncome, totalExpense]);
                })
                .catch(error => {
                    console.error('Error fetching total expense:', error);
                });
        })
        .catch(error => {
            console.error('Error fetching total income:', error);
        });
}

// Function to display a pie chart
function displayPieChart(chartId, labels, data) {
    var ctx = document.getElementById(chartId).getContext('2d');
    var pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#33FF57', '#FF5733'], // Green for Income, Red for Expense
            }]
        },
        options: {
            legend: {
                position: 'bottom',
            }
        }
    });
}

// Call the function to display the pie chart
displayExpenseVsIncomePieChart();

// Assume you have a function to fetch the total budget
async function getTotalBudget(userId) {
    // Implement your logic to fetch the total budget from the backend
    // For demonstration purposes, returning a placeholder value
    const response = await fetch(`/get-total-budget?userId=${userId}`);
    const data = await response.json();
    return data.totalBudget || 0;
  }
  
  // Assume you have a function to fetch the total expense
  async function getTotalExpense(userId) {
    // Implement your logic to fetch the total expense from the backend
    // For demonstration purposes, returning a placeholder value
    const response = await fetch('/get-total-expense', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include credentials (e.g., cookies) for session
    });
    const data = await response.json();
    return data.totalExpense || 0;
  }
  
  // Function to draw the bar graph
  async function drawBarGraph() {
    const userId = 'your-user-id'; // Replace with the actual user ID
    const totalBudget = await getTotalBudget(userId);
    const totalExpense = await getTotalExpense(userId);
  
    // Now, use a chart library (e.g., Chart.js) to draw the bar graph
    // Assume you have an HTML canvas element with id 'budgetVsExpenseChart'
    const ctx = document.getElementById('budgetVsExpenseChart').getContext('2d');
  
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total Budget', 'Total Expense'],
        datasets: [{
          label: 'Budget vs Expense',
          data: [totalBudget, totalExpense],
          backgroundColor: ['#36A2EB', '#FF6384'],
          borderWidth: 1,
        }],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }
  
  // Call the function to draw the bar graph when the page is loaded
  document.addEventListener('DOMContentLoaded', drawBarGraph);
  