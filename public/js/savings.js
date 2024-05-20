var shortTermBalance = 0;
var longTermBalance = 0;

function showPopup(action, type) {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('addWithdrawPopup').style.display = 'block';
    document.getElementById('popupHeading').innerText = action === 'add' ? 'Add to Savings' : 'Withdraw from Savings';

    document.getElementById('addWithdrawPopup').setAttribute('data-action', action);
    document.getElementById('addWithdrawPopup').setAttribute('data-type', type);
}

function hidePopup() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('addWithdrawPopup').style.display = 'none';
    document.getElementById('popupAmount').value = '';
}

function performAction() {
    var amount = parseFloat(document.getElementById('popupAmount').value) || 0;
    var action = document.getElementById('addWithdrawPopup').getAttribute('data-action');
    var type = document.getElementById('addWithdrawPopup').getAttribute('data-type');

    if (amount <= 0 || isNaN(amount)) {
        alert('Please enter a valid amount.');
        return;
    }

    // Update the API endpoint based on the action and type
    var apiEndpoint = action === 'add' ? '/add-ShortTermSavings' : '/withdraw-ShortTermSavings';
    if (type === 'longTerm') {
        apiEndpoint = action === 'add' ? '/add-LongTermSavings' : '/withdraw-LongTermSavings';
    }

    // Send the savings request to the backend
    var xhr = new XMLHttpRequest();
    xhr.open('POST', apiEndpoint);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
        amount: amount
    }));

    // Update the balances and last updated labels
    if (type === 'shortTerm') {
        if (action === 'add') {
            shortTermBalance += amount;
        } else if (action === 'withdraw') {
            shortTermBalance -= amount;
        }
        updateSavingsDisplay('shortTermBalanceLabel', 'shortTermLastUpdatedLabel', shortTermBalance);
    } else if (type === 'longTerm') {
        if (action === 'add') {
            longTermBalance += amount;
        } else if (action === 'withdraw') {
            longTermBalance -= amount;
        }
        updateSavingsDisplay('longTermBalanceLabel', 'longTermLastUpdatedLabel', longTermBalance);
    }

    hidePopup();
}

function updateSavingsDisplay(balanceLabelId, lastUpdatedLabelId, balance) {
    document.getElementById(balanceLabelId).innerText = 'Balance: KES ' + balance.toFixed(2);

    var currentDate = new Date();
    var lastUpdated = 'Last Updated: ' + currentDate.toLocaleString();
    document.getElementById(lastUpdatedLabelId).innerText = lastUpdated;
}

document.addEventListener('DOMContentLoaded', () => {
    // Call the function to initially display the short-term and long-term savings
    displayShortTermSavings();
    displayLongTermSavings();
});

var xhr = new XMLHttpRequest();
    xhr.open('POST', '/add-income'); // Replace '/add-income' with your backend endpoint URL
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({
      amount: totalIncome
    }));
function addLongTermSavings(longTermAmount) {
    fetch('/add-LongTermSavings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ longTermAmount }),
    })
      .then(response => response.json())
      .then(data => {
        // Handle successful response
        console.log('Long-term savings added successfully:', data);
      })
      .catch(error => {
        // Handle error
        console.error('Error adding long-term savings:', error);
      });
  }
  