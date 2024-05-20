const express = require('express');
const app = express();
const port = 3400;
const mysql = require('mysql');
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const filestore = require("session-file-store")(sessions);
const cors = require('cors');
const bcrypt = require('bcrypt');
const moment = require('moment');

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

// cookie parser middleware
app.use(cookieParser());

app.use(sessions({
  name: "User_Session",
  secret: "8Ge2xLWOImX2HP7R1jVy9AmIT0ZN68oSH4QXIyRZyVqtcl4z1Iu1234567819",
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: false },
  resave: false,
  store: new filestore({ logFn: function () {} }),
  path: "/sessions/"
}));


var session;
var message;

app.use(cors());
app.use(express.static('public'));
// Setting up the project
app.set('views', 'views') // Where the pages are going to be stored
app.set('view engine', 'hbs') // The view engine used
app.use(express.static('public')) //The folder for the assests

// mysql connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'e_finance',
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');
});


//FUNCTIONS MODULE
// Function to check if the user with given userID exists
async function checkUserExists(userID) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT COUNT(*) as count FROM users WHERE userId = ?';
    connection.query(query, [userID], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results[0].count > 0);
      }
    });
  });
}

// Middleware to check if the user is authenticated
function authenticateUser(req, res, next) {
  const userCookie = req.cookies.user;

  // Check if the user cookie exists and is not empty
  if (userCookie) {
    req.user = { email: userCookie };
    return next(); // User is authenticated, proceed to the next middleware or route handler
  } else {
    return res.status(401).send('/'); // User is not authenticated, returns to login page
  }
}

//function to get user by email id
async function getUserByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = ?';
  const results = await queryAsync(query, [email]);

  // Assuming the query returns an array of user objects
  return results[0];
}

//Function to generate user id
async function generateUserID() {
  let counter = 1000; // Starting counter

  while (true) {
    const userID = 'EF' + (counter + 1);
    const userExists = await checkUserExists(userID);
    if (!userExists) {
      return userID;
    }
    counter++;
  }
}

//function to insert user 
async function insertUser(userID, email, password) {
  const query = 'INSERT INTO users (userId, email, password) VALUES (?, ?, ?)';
  await queryAsync(query, [userID, email, password]);
}

//function to create promises.
async function queryAsync(query, values) {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Helper function to convert callback-based queries to promises
function promisifyQuery(query, params) {
  return new Promise((resolve, reject) => {
      connection.query(query, params, (error, results, fields) => {
          if (error) {
              reject(error);
          } else {
              resolve(results);
          }
      });
  });
}


//  LOGIN MODULE//
// The First page
app.get('/', (request, response) => {
  (request.session.userID) 
  response.render('./login');
});

// Login route with bcrypt
app.post('/login', async (req, res) => {
  try {
     const { email, password } = req.body;
 
     const user = await getUserByEmail(email);
 
     if (!user) {
       return res.status(404).send('No user found with that email');
     }
 
     const passwordMatch = await bcrypt.compare(password, user.password);
 
     if (passwordMatch) {
      session = req.session
      session.user = req.body
      console.log(session);
      session.save()
      res.cookie('user', user.email)
      message = null
     return res.redirect('/home-page')
      
              
       
     } else {
       console.log('Incorrect password');
       res.status(401).send('Incorrect password');
     }
  } catch (error) {
     console.error('Error during login:', error.stack);
 
     // Handle the case where setting the cookie or redirecting fails
     res.status(500).send('Error during login. Please try again.');
  }
 });
 

//SIGNUP MODULE//
//Signup Page
app.get('/sign-up-page', (request, response) => {
  response.render('./sign-up')
})


// Signup route with bcrypt
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      console.log('User with that email already exists');
      res.status(409).send('User with that email already exists');
      return;
    }

    const userID = await generateUserID();
    const hashedPassword = await bcrypt.hash(password, 10);

    await insertUser(userID, email, hashedPassword);

    // Store the user's data in the session
    req.session.userID = userID;
    req.session.userEmail = email;

    console.log('User created successfully');
    res.redirect('/');
  } catch (error) {
    console.error('Error during signup:', error.stack);
    res.status(500).send('Error during signup');
  }
});


//INCOME MODULE//
// Add income
app.post('/add-income', authenticateUser, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const incomeAmount = req.body.amount; // Assuming income amount is passed in the request body

    if (!incomeAmount || typeof incomeAmount !== 'number') {
      return res.status(400).json({ error: 'Invalid income amount provided' });
    }

    const query = 'INSERT INTO userincome (email, amount) VALUES (?, ?)';
    const values = [userEmail, incomeAmount];

    connection.query(query, values, (error, results) => {
      if (error) {
        console.error('Error adding income:', error.stack);
        return res.status(500).json({ error: 'Error adding income' });
      }

      res.status(201).json({ message: 'Income added successfully' });
    });
  } catch (error) {
    console.error('Error adding income:', error.stack);
    res.status(500).json({ error: 'Error adding income' });
  }
});


app.get('/get-income', authenticateUser, (req, res) => {
  try {
    const userEmail = req.user.email;

    // Select user income from the database based on email
    const query = 'SELECT amount FROM userincome WHERE email = ?';
    const values = [userEmail];

    connection.query(query, values, (error, results) => {
      if (error) {
        console.error('Error retrieving user income:', error.stack);
        return res.status(500).json({ error: 'Error retrieving user income' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'User income not found' });
      }

      const userIncomeAmount = results[0].amount;

      res.status(200).json({
        userEmail,
        userIncomeAmount,
      });
    });
  } catch (error) {
    console.error('Error retrieving user income:', error.stack);
    res.status(500).json({ error: 'Error retrieving user income' });
  }
});

//BUDGET MODULE//
// Endpoint to handle the budget form submission
app.post('/get-budget', authenticateUser, (req, res) => {
  try {
    const userEmail = req.user.email; // Assuming you have user authentication middleware
    
    const {amount1,amount2,amount3,amount4,amount5,amount6,amount7} = req.body;

    // Insert data into the userbudget table
    const query = `
      INSERT INTO userbudget (email, Household, Utilities, Health, Insurance, Leisure, Savings, Other)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Household = VALUES(Household),
        Utilities = VALUES(Utilities),
        Health = VALUES(Health),
        Insurance = VALUES(Insurance),
        Leisure = VALUES(Leisure),
        Savings = VALUES(Savings),
        Other = VALUES(Other)
       
    `;

    const values = [
      userEmail,amount1,amount2,amount3,amount4,amount5,amount6,amount7];
 
    connection.query(query, values, (error, results) => {
      if (error) {
        console.error('Error inserting budget data into the database:', error.stack);
        return res.status(500).send('Error inserting budget data into the database');
      }

      console.log('Budget data added successfully');
    });
  } catch (error) {
    console.error('Error processing budget data:', error.stack);
    res.status(500).send('Error processing budget data');
  }
});


//Display budget data
// Import necessary modules and setup your server

// Your other middleware and route handlers...

// Endpoint to fetch budget data
app.get('/display-budget', authenticateUser, (req, res) => {
  try {
    const userEmail = req.user.email;

    // Fetch budget data from the userbudget table
    const query = `
      SELECT Household, Utilities, Health, Insurance, Leisure, Savings, Other
      FROM userbudget
      WHERE email = ?
    `;

    connection.query(query, [userEmail], (error, results) => {
      if (error) {
        console.error('Error retrieving budget data:', error.stack);
        return res.status(500).json({ error: 'Failed to retrieve budget data' });
      }

      const [budgetData] = results;

      if (!budgetData) {
        res.status(404).json({ error: 'Budget data not found' });
        return;
      }

      res.status(200).json({
        amount1: budgetData.Household,
        amount2: budgetData.Utilities,
        amount3: budgetData.Health,
        amount4: budgetData.Insurance,
        amount5: budgetData.Leisure,
        amount6: budgetData.Savings,
        amount7: budgetData.Other,
        budgetTotal: calculateTotal(budgetData),
      });
    });
  } catch (error) {
    console.error('Error in display-budget route:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to calculate total budget
function calculateTotal(budgetData) {
  return (
    budgetData.Household +
    budgetData.Utilities +
    budgetData.Health +
    budgetData.Insurance +
    budgetData.Leisure +
    budgetData.Savings +
    budgetData.Other
  );
}





//SAVINGS MODULE//
// Add short term savings
app.post('/add-ShortTermSavings', authenticateUser, async (req, res) => {
  try {
    const { shortTermAmount } = req.body;
    const userEmail = req.user.email; // Retrieve user's email from the session

    // Check if shortTermAmount is undefined or null
    if (shortTermAmount === undefined || shortTermAmount === null) {
      return res.status(400).send('Missing required field: shortTermAmount');
    }

    // Convert shortTermAmount to a valid number
    const amount = parseFloat(shortTermAmount);

    // Check if shortTermAmount is a valid number
    if (isNaN(amount)) {
      return res.status(400).send('Invalid shortTermAmount value');
    }

    const query = `
      INSERT INTO usershorttermsavings (email, shortTermSavings, shortDate)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON DUPLICATE KEY UPDATE
        shortTermSavings = shortTermSavings + ?,
        shortDate = CURRENT_TIMESTAMP;
    `;

    await connection.query(query, [userEmail, amount, amount], (error) => {
      if (error) {
        console.error('Error adding short-term savings:', error.stack);
        return res.status(500).send('Error adding short-term savings. Please try again.');
      }

      console.log('Short-term savings added successfully');
      res.status(200).send('Short-term savings added successfully');
    });
  } catch (error) {
    console.error('Error adding short-term savings:', error.stack);
    res.status(500).send('Error adding short-term savings. Please try again.');
  }
});



//add long term savings
app.post('/add-LongTermSavings', authenticateUser, async (req, res) => {
  try {
    const { longTermAmount } = req.body;
    const userEmail = req.user.email; // Retrieve user's email from the session

    const query = `
      INSERT INTO userLongTermSavings (email, LongTermSavings, longDate) 
      VALUES (?, ?, CURRENT_TIMESTAMP) 
      ON DUPLICATE KEY UPDATE 
        LongTermSavings = LongTermSavings + VALUES(LongTermSavings),
        longDate = CURRENT_TIMESTAMP;
    `;

    connection.query(query, [userEmail, longTermAmount], (error, results, fields) => {
      if (error) {
        console.error('Error inserting long-term savings data into the database:', error.stack);
        res.status(500).send('Error inserting long-term savings data into the database');
        return;
      }

      console.log('Long-term savings added successfully');
      res.status(200).send('Long-term savings added successfully');
    });
  } catch (error) {
    console.error('Error adding long-term savings:', error.stack);
    res.status(500).send('Error adding long-term savings. Please try again.');
  }
});


// Display short-term savings
app.get('/get-ShortTermSavings', authenticateUser, (req, res) => {
  try {
    const userEmail = req.user.email;

    // Select user short-term savings and shortDate from the database based on email
    const query = 'SELECT shortTermSavings, shortDate FROM usershorttermsavings WHERE email = ?';
    const values = [userEmail];

    connection.query(query, values, (error, results) => {
      if (error) {
        console.error('Error retrieving user short-term savings:', error.stack);
        return res.status(500).json({ error: 'Error retrieving user short-term savings' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'User short-term savings not found' });
      }

      const shortTermSavingsAmount = results[0].shortTermSavings;
      const shortTermLastUpdated = results[0].shortDate;

      res.status(200).json({
        userEmail,
        shortTermSavingsAmount,
        shortTermLastUpdated,
      });
    });
  } catch (error) {
    console.error('Error retrieving user short-term savings:', error.stack);
    res.status(500).json({ error: 'Error retrieving user short-term savings' });
  }
});


// Display long-term savings
app.post('/add-LongTermSavings', authenticateUser, async (req, res) => {
  try {
    // Retrieve user email from the session
    const userEmail = req.user.email;

    // Get user's long-term savings before adding the new amount
    const getLongTermSavingsQuery = `SELECT LongTermSavings FROM userlongtermsavings WHERE email = ?`;
    const [existingLongTermSavings] = await connection.query(getLongTermSavingsQuery, [userEmail]);

    if (!existingLongTermSavings.length) {
      // User doesn't have any long-term savings yet, so create a new entry
      const longTermAmount = req.body.longTermAmount;
      const query = `INSERT INTO userLongTermSavings (email, LongTermSavings, longDate) VALUES (?, ?, CURRENT_TIMESTAMP)`;
      await connection.query(query, [userEmail, longTermAmount]);
      console.log('New long-term savings entry created');
    } else {
      // Update existing long-term savings
      const additionalLongTermAmount = req.body.longTermAmount;
      const newLongTermAmount = existingLongTermSavings[0].LongTermSavings + additionalLongTermAmount;
      const updateQuery = `UPDATE userLongTermSavings SET LongTermSavings = ?, longDate = CURRENT_TIMESTAMP WHERE email = ?`;
      await connection.query(updateQuery, [newLongTermAmount, userEmail]);
      console.log('Existing long-term savings updated');
    }

    res.status(200).send('Long-term savings updated successfully');
  } catch (error) {
    console.error('Error adding long-term savings:', error.stack);
    res.status(500).send('Error adding long-term savings. Please try again.');
  }
});


//LOANS MODULE
// Add short loan
app.post('/add-shortTermloan', authenticateUser, async (req, res) => {
  try{
    const {shortTermLoanBalance, dueDate} = req.body;
    const userEmail = req.user.email;

    const query = 'INSERT INTO usershorttermloan (email, shortTermLoan, dueDate) VALUES (?, ?, ?)';
    const values = [userEmail, shortTermLoanBalance, dueDate];

    connection.query(query, values, (error, results) => {
      if (error) {
        console.error('Error adding loan:', error.stack);
        return res.status(500).json({ error: 'Error adding loan' });
      }
  
      res.status(201).json({ message: 'loan added successfully' });
    });
  } catch (error) {
    console.error('Error adding loan:', error.stack);
    res.status(500).json({ error: 'Error adding loan' });
  }
  });


//Add long term Loan
app.post('/add-longTermloan', authenticateUser, async (req, res) => {
  try{
    const {longTermLoanBalance, dueDate} = req.body;
    const userEmail = req.user.email;

    const query = 'INSERT INTO usershorttermloan (email, longTermLoan, dueDate) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE longTermLoan = longTermLoan + VALUES(longTermLoan)';
    const values = [userEmail, longTermLoanBalance, dueDate];

    connection.query(query, values, (error, results) => {
      if (error) {
        console.error('Error adding loan:', error.stack);
        return res.status(500).json({ error: 'Error adding loan' });
      }
  
      res.status(201).json({ message: 'loan added successfully' });
    });
  } catch (error) {
    console.error('Error adding loan:', error.stack);
    res.status(500).json({ error: 'Error adding loan' });
  }
  });



// Route to get long-term loan balance
app.get('/get-longTerm-loan', authenticateUser, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Assuming you have a database query to fetch short-term loan data for the logged-in user
    const query = 'SELECT longTermLoan, dueDate FROM userslongtermloan WHERE email = ? ORDER BY dueDate ASC LIMIT 1';


    connection.query(query, [userEmail], (error, results) => {
      if (error) {
        console.error('Error fetching short-term loan data:', error.stack);
        return res.status(500).json({ error: 'Error fetching long-term loan data' });
      }
      const [longLoanData]=results;

      if (!longLoanData) {
        res.status(404).json({ error: 'Loan not found' });
        return;
      }

      res.status(200).json({
        longTermLoanBalance: LoanData.longTermLoan,
        dueDate: shortLoanData.dueDate,
        
      });
    });
  } catch (error) {
    console.error('Error in display-budget route:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Endpoint to get short-term loan data
app.get('/get-shortTerm-loan', authenticateUser, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Assuming you have a database query to fetch short-term loan data for the logged-in user
    const query = 'SELECT shortTermLoan, dueDate FROM usershorttermloan WHERE email = ? ORDER BY dueDate ASC LIMIT 1';


    connection.query(query, [userEmail], (error, results) => {
      if (error) {
        console.error('Error fetching short-term loan data:', error.stack);
        return res.status(500).json({ error: 'Error fetching short-term loan data' });
      }
      const [shortLoanData]=results;

      if (!shortLoanData) {
        res.status(404).json({ error: 'Loan not found' });
        return;
      }

      res.status(200).json({
        shortTermLoanBalance: shortLoanData.shortTermLoan,
        dueDate: shortLoanData.dueDate,
        
      });
    });
  } catch (error) {
    console.error('Error in display-budget route:', error.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
});
      




//EXPENSES MODULE//
// End point to Add expense
app.post('/add-expense', authenticateUser, async (req, res) => {
  try {
      const {Id, expenseName, expenseCategory, expenseAmount } = req.body;
      const userEmail = req.user.email; // Retrieve user's email from the session

      // Perform any necessary validation on the expense data

      // Insert the expense into the database
      const query = `
          INSERT INTO userexpenses (expenseId, email, expenseName, Category, amount, Date) 
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
      `;

      connection.query(query, [Id, userEmail, expenseName, expenseCategory, expenseAmount], (error, results, fields) => {
          if (error) {
              console.error('Error inserting expense data into the database:', error.stack);
              res.status(500).send('Error inserting expense data into the database');
              return;
          }

          console.log('Expense added successfully');
          res.status(200).send('Expense added successfully');
      });
  } catch (error) {
      console.error('Error adding expense:', error.stack);
      res.status(500).send('Error adding expense. Please try again.');
  }
});

app.post('/add-expense', (req, res) => {
  try {
    const { name, category, amount } = req.body;
    const categoryPrefix = category.substring(0, 2).toUpperCase();
    const id = categoryPrefix + new Date().getTime(); // Using timestamp as a simple ID
    const date = new Date().toLocaleDateString();

    // Insert the expense into the MySQL database
    const query = 'INSERT INTO expenses (id, name, category, amount, date) VALUES (?, ?, ?, ?, ?)';
    const values = [id, name, category, amount, date];

    connection.query(query, values, (error, results) => {
      if (error) {
        console.error('Error adding expense to MySQL:', error.stack);
        return res.status(500).json({ error: 'Error adding expense' });
      }

      res.status(201).json({ message: 'Expense added successfully' });
    });
  } catch (error) {
    console.error('Error adding expense:', error.stack);
    res.status(500).json({ error: 'Error adding expense' });
  }
});


// monthly expenses
app.get('/total-expenses', authenticateUser, async (req, res) => {
  try {
    const userEmail = req.user.email; // Retrieve user's email from the session

    // Calculate total expenses from the start of the month
    const query = `
      SELECT SUM(expenseAmount) AS totalExpenses
      FROM expenses
      WHERE userEmail = ? AND MONTH(expenseDate) = MONTH(CURRENT_DATE()) AND YEAR(expenseDate) = YEAR(CURRENT_DATE());
    `;

    connection.query(query, [userEmail], (error, results, fields) => {
      if (error) {
        console.error('Error calculating total expenses:', error.stack);
        res.status(500).send('Error calculating total expenses');
        return;
      }

      const totalExpenses = results[0].totalExpenses || 0;
      res.status(200).json({ totalExpenses });
    });
  } catch (error) {
    console.error('Error retrieving total expenses:', error.stack);
    res.status(500).send('Error retrieving total expenses. Please try again.');
  }
});


//Download expense history
app.get('/generate-csv', (req, res) => {
  // Replace 'your_query_here' with the actual query to fetch your expense data
  const query = 'SELECT * FROM userexpenses';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing query:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    const csv = convertToCsv(results);

    res.setHeader('Content-Disposition', 'attachment; filename=expense_data.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csv);
  });
});

function convertToCsv(data) {
  const header = Object.keys(data[0]).join(',') + '\n';
  const rows = data.map(item => Object.values(item).join(',') + '\n');
  return header + rows.join('');
}



//PROFILE PAGE MODULE//
//Get user profile
app.get('/get-user-profile', authenticateUser, (req, res) => {
  const userEmail = req.user.email;

  const query = 'SELECT userId, email FROM users WHERE email = ?';

  connection.query(query, [userEmail], (error, results, fields) => {
    if (error) {
      console.error('Error querying database:', error.stack);
      res.status(500).send('Error querying database');
      return;
    }

    if (results.length > 0) {
      const userInfo = results[0];
      res.status(200).json(userInfo);
    } else {
      res.status(404).send('User not found');
    }
  });
});

//Delete User 
app.delete('/delete-user', authenticateUser, (req, res) => {
  const userEmail = req.session.email;

  if (!userEmail) {
    return res.status(401).send('Unauthorized');
  }

  const query = 'DELETE FROM users WHERE email = ?';

  connection.query(query, [userEmail], (error, results, fields) => {
    if (error) {
      console.error('Error deleting user from the database:', error.stack);
      res.status(500).send('Error deleting user from the database');
      return;
    }

    console.log('User deleted successfully');
    req.session.destroy(); // Destroy the session after deleting the user
    res.render("/");
  });
});


//ROUTE PAGES MODULE//
//home page
app.get('/home-page', authenticateUser,(request, response) => {
  response.render('home')
})

//view budget Page
app.get('/viewBudget-page', authenticateUser,(request, response) => {
  response.render('viewBudget')
})

//income page
app.get('/income-page', authenticateUser,(request, response) => {
  response.render('income')
})

//profile page
app.get('/profile-page', authenticateUser,(request, response) => {
  response.render('profile')
})

//loans page
app.get('/loans-page', authenticateUser,(request, response) => {
  response.render('loans')
})

//savings page
app.get('/savings-page', authenticateUser,(request, response) => {
  response.render('savings')
})

//budget page
app.get('/budget-page', authenticateUser,(request, response) => {
  response.render('budget2')
})

//graph page
app.get('/graph-page',authenticateUser,(request, response) => {
  response.render('graphs')
})

//expenses page
app.get('/expenses-page', authenticateUser, (request, response) => {
  response.render('expenses')
})



//send user session info
app.get('/get-session-user', authenticateUser, (request, response) => {
  
});


//LOGOUT MODULE//
app.get('/logout', (request, response) => {
  session = request.session
  session.destroy((err) => {
      message = null

      if (err) throw err;
      session = null;
      response.clearCookie('user')
      response.clearCookie('User_Session')
      response.redirect('/')
  })
})


//CONNECTION MODULE//
//server listening
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
