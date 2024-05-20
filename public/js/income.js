
document.addEventListener('DOMContentLoaded', () => {
    // Call the function to initially display the income total
    displayIncomeTotal();
  });
  
function calculateAndAddIncome() {
    // Calculate monthly income
    var payAfterTaxAmount = parseFloat(document.getElementById('payAfterTaxAmount').value) || 0;
    var bonusAmount = parseFloat(document.getElementById('bonusAmount').value) || 0;
    var additionalIncomeAmount = parseFloat(document.getElementById('additionalIncomeAmount').value) || 0;
    var frequency = document.getElementById('payAfterTaxFrequency').value;
    var monthlyIncome = calculateMonthlyIncome(payAfterTaxAmount, frequency);
    var totalIncome = monthlyIncome + bonusAmount + additionalIncomeAmount;
  
    // Send monthly income to backend
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/add-income'); // Replace '/add-income' with your backend endpoint URL
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      amount: totalIncome
    }));
    displayIncomeTotal();
}
 
function calculateMonthlyIncome(amount, frequency) {
    switch (frequency) {
        case 'weekly':
            return amount * 4; // Assuming 4 weeks in a month
        case 'bi-weekly':
            return amount * 2; // Assuming 2 bi-weekly payments in a month
        case 'monthly':
            return amount;
        case 'quarterly':
            return amount / 3; // Assuming 3 payments in a quarter
        case 'annually':
            return amount / 12; // Assuming 12 payments in a year
        default:
            return 0;
    }

}
        
async function displayIncomeTotal() {
    try {
      const response = await fetch('/get-income', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to retrieve income total');
      }
  
      const data = await response.json();
  
      // Update the HTML element with the retrieved income total
      updateIncomeTotal(data.userIncomeAmount);
    } catch (error) {
      console.error('Error retrieving income total:', error.message);
    }
  }
          
  function updateIncomeTotal(total) {
    // Update the HTML element with the income total
    const totalAmountElement = document.getElementById('totalAmount');
    if (totalAmountElement) {
      totalAmountElement.innerText = 'KES ' + total.toFixed(2);
    } else {
      console.error('Element with id "totalAmount" not found.');
    }
  }
  