var shortTermLoanBalance = 0;
var longTermLoanBalance = 0;

function showPopup(action, type) {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('addWithdrawPopup').style.display = 'block';
    document.getElementById('popupHeading').innerText = action === 'add' ? 'Add to Loan' : 'Repay Loan';

    document.getElementById('addWithdrawPopup').setAttribute('data-action', action);
    document.getElementById('addWithdrawPopup').setAttribute('data-type', type);
}

function hidePopup() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('addWithdrawPopup').style.display = 'none';
}

// Function to perform loan action (add or repay)
async function performLoanAction() {
  var amount = parseFloat(document.getElementById('popupAmount').value) || 0;
  var dueDate = document.getElementById('popupDueDate').value;
  var action = document.getElementById('addWithdrawPopup').getAttribute('data-action');
  var type = document.getElementById('addWithdrawPopup').getAttribute('data-type');

  if (amount <= 0 || isNaN(amount) || !dueDate) {
    alert('Please enter a valid amount and due date.');
    return;
  }

  try {
    // Update the loan balances locally
    if (type === 'shortTermLoans') {
      if (action === 'add') {
        shortTermLoanBalance += amount;
      } else if (action === 'repay') {
        shortTermLoanBalance -= amount;
      }
      updateLoanDisplay('shortTermLoanBalanceLabel', 'shortTermLoanLastUpdatedLabel', shortTermLoanBalance, dueDate);
    } else if (type === 'longTermLoans') {
      if (action === 'add') {
        longTermLoanBalance += amount;
      } else if (action === 'repay') {
        longTermLoanBalance -= amount;
      }
      updateLoanDisplay('longTermLoanBalanceLabel', 'longTermLoanLastUpdatedLabel', longTermLoanBalance, dueDate);
    }

    // Fetch data from the user and send it to the backend
    const response = await fetch('/add-shortTermLoan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shortTermLoanBalance,
        dueDate,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to add short-term loan on the server');
    }

    console.log('Short-term loan added successfully on the server');
  } catch (error) {
    console.error('Error adding short-term loan:', error.message);
  }

  hidePopup();
}


// Modify the function to fetch short-term loan data
async function getShortTermLoanData() {
  try {
    const response = await fetch('/get-shortTerm-loan', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (response.ok) {
      const data = await response.json();
      shortTermLoanBalance = parseFloat(data.shortTermLoanBalance) || 0;
      const dueDate = data.dueDate || '-';
      updateLoanDisplay('shortTermLoanBalanceLabel', 'shortTermLoanLastUpdatedLabel', shortTermLoanBalance, dueDate);
    } else {
      console.error('Error fetching short-term loan data:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching short-term loan data:', error.message);
  }
}


  

// Call the function to fetch short-term loan data when the page loads
window.addEventListener('load', getShortTermLoanData);

function updateLoanDisplay(balanceLabelId, lastUpdatedLabelId, balance, dueDate) {
    document.getElementById(balanceLabelId).innerText = 'Loan Balance: KES ' + balance.toFixed(2);
    document.getElementById(lastUpdatedLabelId).innerText = 'Due Date: ' + dueDate;
}

