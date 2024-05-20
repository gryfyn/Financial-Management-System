var ctx = document.getElementById('expenseChart').getContext('2d');
        var expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Household', 'Insurance', 'Family & Friends', 'Health', 'Travel', 'Leisure'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: ['#FF5733', '#33FF57', '#0000FF', '#800080', '#DFFF00', '#DE3163'],
                }]
            },
            options: {
                legend: {
                    position: 'bottom',
                }
            }
        });

        function toggleExpensePopup() {
            var popup = document.getElementById('expensePopup');
            popup.style.display = (popup.style.display === 'none' || popup.style.display === '') ? 'block' : 'none';
        }

        var idCounter = 1;

        function addExpense() {
            var name = document.getElementById('expenseName').value;
            var category = document.getElementById('expenseCategory').value;
            var amount = document.getElementById('expenseAmount').value;
            var categoryPrefix = category.substring(0, 2).toUpperCase();
            var id = categoryPrefix + idCounter;
            idCounter += 2;
            var date = new Date().toLocaleDateString();
        
            var table = document.getElementById('expenseTable').getElementsByTagName('tbody')[0];
            var newRow = table.insertRow(0);
            var cell1 = newRow.insertCell(0);
            var cell2 = newRow.insertCell(1);
            var cell3 = newRow.insertCell(2);
            var cell4 = newRow.insertCell(3);
            var cell5 = newRow.insertCell(4);
            cell1.innerHTML = id;
            cell2.innerHTML = name;
            cell3.innerHTML = category;
            cell4.innerHTML = amount;
            cell5.innerHTML = date;
        
            addButtonsToTableRow(newRow, id);
        
            var data = expenseChart.data.datasets[0].data;
            var categoryIndex = expenseChart.data.labels.indexOf(category);
            data[categoryIndex] += parseInt(amount);
            expenseChart.update();
        
            document.getElementById('expenseName').value = '';
            document.getElementById('expenseAmount').value = '';
            
            // Hide the popup container after adding an expense
            toggleExpensePopup();
        }
        

        function addButtonsToTableRow(row, id) {
            var editBtn = document.createElement('button');
            editBtn.innerHTML = 'Edit';
            editBtn.className = 'edit-btn';
            editBtn.onclick = function () {
                editExpense(id);
            };

            var deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = function () {
                deleteExpense(id);
            };

            var editCell = row.insertCell(-1);
            var deleteCell = row.insertCell(-1);
            editCell.appendChild(editBtn);
            deleteCell.appendChild(deleteBtn);
        }

        function editExpense(rowId) {
            var newName = prompt('Enter the new name for the expense:');
            if (newName !== null) {
                var table = document.getElementById('expenseTable').getElementsByTagName('tbody')[0];
                var rows = table.getElementsByTagName('tr');

                for (var i = 0; i < rows.length; i++) {
                    var idCell = rows[i].cells[0];
                    if (idCell.innerHTML === rowId) {
                        var categoryCell = rows[i].cells[2];
                        var oldCategory = categoryCell.innerHTML;

                        // Update the table
                        categoryCell.innerHTML = newName;

                        // Update the pie chart
                        var data = expenseChart.data.datasets[0].data;
                        data[expenseChart.data.labels.indexOf(oldCategory)] -= parseInt(rows[i].cells[3].innerHTML);
                        data[expenseChart.data.labels.indexOf(newName)] += parseInt(rows[i].cells[3].innerHTML);
                        expenseChart.update();
                    }
                }
            }
        }

        function deleteExpense(rowId) {
            var table = document.getElementById('expenseTable').getElementsByTagName('tbody')[0];
            var rows = table.getElementsByTagName('tr');

            for (var i = 0; i < rows.length; i++) {
                var idCell = rows[i].cells[0];
                if (idCell.innerHTML === rowId) {
                    var categoryCell = rows[i].cells[2];
                    var amountCell = rows[i].cells[3];

                    // Update the pie chart
                    var data = expenseChart.data.datasets[0].data;
                    data[expenseChart.data.labels.indexOf(categoryCell.innerHTML)] -= parseInt(amountCell.innerHTML);
                    expenseChart.update();

                    // Remove the row from the table
                    table.removeChild(rows[i]);
                }
            }
        }

        function updateExcelLink() {
            var excelData = 'ID,Name,Category,Amount,Date\n';
            var tableRows = document.getElementById('expenseTable').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
            for (var i = 0; i < tableRows.length; i++) {
                for (var j = 0; j < tableRows[i].cells.length; j++) {
                    excelData += tableRows[i].cells[j].innerHTML + ',';
                }
                excelData = excelData.slice(0, -1) + '\n';
            }

            var blob = new Blob([excelData], { type: 'text/csv' });
            var link = document.getElementById('downloadExcelLink');
            link.href = window.URL.createObjectURL(blob);
        }

        function downloadExcel() {
            updateExcelLink();
        }

        document.getElementById('viewFullHistory').addEventListener('click', function () {
            downloadExcel();
        });