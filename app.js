/**
 * app.js — Personal Finance Tracker
 * CSE 310 - JavaScript Module
 *
 * Tracks income and expense transactions saved in finance.json.
 * Run with: node app.js
 *
 * Library used: ./colors.js (local JS library using ANSI escape codes)
 * No npm install needed — just run: node app.js
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');
const colors   = require('./colors'); // local JS library — no npm needed

const DATA_FILE = path.join(__dirname, 'finance.json');

// ─────────────────────────────────────────────────────────────
//  Data Layer
// ─────────────────────────────────────────────────────────────

/**
 * Loads transaction data from finance.json.
 * Returns a safe default if the file is missing or empty.
 * Throws an Error if the file contains corrupted JSON.
 * @returns {{ transactions: Array }} Parsed data object
 */
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { transactions: [] };
  }
  const rawText = fs.readFileSync(DATA_FILE, 'utf8');
  if (rawText.trim() === '') {
    return { transactions: [] };
  }
  try {
    const data = JSON.parse(rawText);
    if (!Array.isArray(data.transactions)) {
      data.transactions = [];
    }
    return data;
  } catch (err) {
    throw new Error('finance.json is corrupted and cannot be read: ' + err.message);
  }
}

/**
 * Saves the data object to finance.json.
 * Throws an Error if the file cannot be written.
 * @param {{ transactions: Array }} data
 */
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    throw new Error('Could not save data: ' + err.message);
  }
}

// ─────────────────────────────────────────────────────────────
//  Validation — throws exceptions on bad input
// ─────────────────────────────────────────────────────────────

/**
 * Validates that an amount is a positive number.
 * Throws a RangeError if the value is zero, negative, or not a number.
 * @param {string|number} amount - Raw input from the user
 * @returns {number} Parsed positive float
 */
function validateAmount(amount) {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) {
    throw new RangeError('Amount must be a positive number greater than zero.');
  }
  return parsed;
}

/**
 * Validates that a description is not blank.
 * Throws a TypeError if the description is empty after trimming.
 * @param {string} desc - Raw input from the user
 * @returns {string} Trimmed description
 */
function validateDescription(desc) {
  const trimmed = desc.trim();
  if (trimmed === '') {
    throw new TypeError('Description cannot be empty.');
  }
  return trimmed;
}

// ─────────────────────────────────────────────────────────────
//  Recursion — recursive total calculator
// ─────────────────────────────────────────────────────────────

/**
 * Recursively sums the amounts in a list of transactions.
 * Base case: empty array returns 0.
 * Recursive case: first item's amount + sum of the rest.
 * @param {Array} transactions - Array of transaction objects
 * @returns {number} Total summed amount
 */
function sumTransactions(transactions) {
  if (transactions.length === 0) {
    return 0; // base case
  }
  return transactions[0].amount + sumTransactions(transactions.slice(1)); // recursive case
}

// ─────────────────────────────────────────────────────────────
//  Transaction Operations
// ─────────────────────────────────────────────────────────────

/**
 * Adds a new income or expense transaction to the data file.
 * Validates input first — throws if amount or description is invalid.
 * @param {'income'|'expense'} type
 * @param {string} description
 * @param {string|number} amount
 */
function addTransaction(type, description, amount) {
  const safeAmount = validateAmount(amount);
  const safeDesc   = validateDescription(description);
  const data = loadData();
  const transaction = {
    id: Date.now(),
    type,
    description: safeDesc,
    amount: safeAmount,
    date: new Date().toISOString(),
  };
  data.transactions.push(transaction);
  saveData(data);
  console.log(colors.green('\n✅ ' + type.toUpperCase() + ' of ₦' + safeAmount.toFixed(2) + ' added!\n'));
}

/**
 * Deletes a transaction by its 1-based display index.
 * Throws a RangeError if the index does not match any transaction.
 * @param {string} indexInput - 1-based number the user typed
 */
function deleteTransaction(indexInput) {
  const i = parseInt(indexInput, 10) - 1;
  const data = loadData();
  if (isNaN(i) || i < 0 || i >= data.transactions.length) {
    throw new RangeError('No transaction found at position ' + indexInput + '.');
  }
  const [removed] = data.transactions.splice(i, 1);
  saveData(data);
  console.log(colors.yellow('\n🗑️  Deleted: [' + removed.type.toUpperCase() + '] ₦' + removed.amount.toFixed(2) + ' — ' + removed.description + '\n'));
}

/**
 * Prints all transactions to the terminal, filtered by type.
 * Uses ES6 .filter() and .forEach() with arrow functions.
 * @param {'income'|'expense'|'all'} filter
 */
function viewTransactions(filter) {
  filter = filter || 'all';
  const data = loadData();

  // ES6 .filter() with arrow function
  const list = filter === 'all'
    ? data.transactions
    : data.transactions.filter(t => t.type === filter);

  if (list.length === 0) {
    const msg = filter === 'all'
      ? 'No transactions yet. Add income or an expense to get started.'
      : 'No ' + filter + ' transactions found.';
    console.log(colors.yellow('\n📭 ' + msg + '\n'));
    return;
  }

  const label = filter === 'all' ? 'ALL TRANSACTIONS' : filter.toUpperCase() + ' ONLY';
  console.log(colors.cyan('\n────────────────────────────────────────────────────────────'));
  console.log(colors.cyan('         📒 ' + label));
  console.log(colors.cyan('────────────────────────────────────────────────────────────'));

  // ES6 .forEach() with arrow function
  list.forEach((t, idx) => {
    const icon    = t.type === 'income' ? '🟢' : '🔴';
    const dateStr = t.date.slice(0, 10);
    const typeStr = t.type.toUpperCase().padEnd(8);
    const amtStr  = ('₦' + t.amount.toFixed(2)).padStart(14);
    console.log('  #' + String(idx + 1).padStart(3) + '  ' + icon + ' [' + dateStr + '] ' + typeStr + ' | ' + amtStr + ' | ' + t.description);
  });

  console.log(colors.cyan('────────────────────────────────────────────────────────────\n'));
}

/**
 * Calculates income, expenses, and net balance using ES6 .filter() and .reduce().
 * Prints a formatted summary to the terminal.
 */
function checkBalance() {
  const data = loadData();

  // ES6 .filter() + .reduce() with arrow functions
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  console.log(colors.cyan('\n────────────────────────────────────────────────'));
  console.log(colors.cyan('         💰 BALANCE SUMMARY'));
  console.log(colors.cyan('────────────────────────────────────────────────'));
  console.log('  Total Income:    ' + colors.green('₦' + totalIncome.toFixed(2)));
  console.log('  Total Expenses:  ' + colors.red('₦' + totalExpenses.toFixed(2)));
  console.log('  ─────────────────────────────────');
  if (balance >= 0) {
    console.log('  ✅ Net Balance:   ' + colors.green('₦' + balance.toFixed(2)));
  } else {
    console.log('  ❌ Net Balance:  ' + colors.red('-₦' + Math.abs(balance).toFixed(2)));
  }
  console.log(colors.cyan('────────────────────────────────────────────────\n'));
}

/**
 * Prints a summary report using the recursive sumTransactions function.
 * Demonstrates recursion clearly — totals are calculated by recursion, not .reduce().
 */
function showRecursiveSummary() {
  const data = loadData();

  // ES6 .filter() to separate types, then recursive sum
  const incomeList  = data.transactions.filter(t => t.type === 'income');
  const expenseList = data.transactions.filter(t => t.type === 'expense');

  const totalIncome   = sumTransactions(incomeList);   // recursive call
  const totalExpenses = sumTransactions(expenseList);  // recursive call
  const balance       = totalIncome - totalExpenses;

  console.log(colors.magenta('\n════════════════════════════════════════════════'));
  console.log(colors.magenta('     📊 RECURSIVE SUMMARY REPORT'));
  console.log(colors.magenta('════════════════════════════════════════════════'));
  console.log('  Income entries:   ' + incomeList.length);
  console.log('  Expense entries:  ' + expenseList.length);
  console.log('  Total Income:     ' + colors.green('₦' + totalIncome.toFixed(2)) + ' (calculated recursively)');
  console.log('  Total Expenses:   ' + colors.red('₦' + totalExpenses.toFixed(2)) + ' (calculated recursively)');
  if (balance >= 0) {
    console.log('  Net Balance:      ' + colors.green('₦' + balance.toFixed(2)));
  } else {
    console.log('  Net Balance:      ' + colors.red('-₦' + Math.abs(balance).toFixed(2)));
  }
  console.log(colors.magenta('════════════════════════════════════════════════\n'));
}

// ─────────────────────────────────────────────────────────────
//  Prompt helper
// ─────────────────────────────────────────────────────────────

/**
 * Wraps rl.question in a Promise so it works with async/await.
 * @param {readline.Interface} rl
 * @param {string} prompt
 * @returns {Promise<string>} Trimmed user input
 */
function ask(rl, prompt) {
  return new Promise(resolve => rl.question(prompt, answer => resolve(answer.trim())));
}

// ─────────────────────────────────────────────────────────────
//  Menu
// ─────────────────────────────────────────────────────────────

/**
 * Prints the main menu options to the terminal.
 */
function printMenu() {
  console.log(colors.bold('\n════════════════════════════════════════════════'));
  console.log(colors.bold('        💼 PERSONAL FINANCE TRACKER'));
  console.log(colors.bold('════════════════════════════════════════════════'));
  console.log('  1. Add Income');
  console.log('  2. Add Expense');
  console.log('  3. View All Transactions');
  console.log('  4. View Income Only');
  console.log('  5. View Expenses Only');
  console.log('  6. Delete a Transaction');
  console.log('  7. Check Balance');
  console.log('  8. Recursive Summary Report');
  console.log('  9. Exit');
  console.log(colors.bold('════════════════════════════════════════════════'));
}

/**
 * Main event loop — shows the menu and handles all user input.
 * Every action is wrapped in try/catch to handle thrown exceptions gracefully.
 * @param {readline.Interface} rl
 */
async function runMenu(rl) {
  let running = true;
  while (running) {
    printMenu();
    const choice = await ask(rl, '👉 Enter your choice (1–9): ');
    try {
      switch (choice) {
        case '1': {
          const desc = await ask(rl, '📝 Description (e.g. Salary): ');
          const amt  = await ask(rl, '💵 Amount (₦): ');
          addTransaction('income', desc, amt);   // may throw RangeError or TypeError
          break;
        }
        case '2': {
          const desc = await ask(rl, '📝 Description (e.g. Rent): ');
          const amt  = await ask(rl, '💸 Amount (₦): ');
          addTransaction('expense', desc, amt);  // may throw RangeError or TypeError
          break;
        }
        case '3':
          viewTransactions('all');
          break;
        case '4':
          viewTransactions('income');
          break;
        case '5':
          viewTransactions('expense');
          break;
        case '6': {
          viewTransactions('all');
          const idx = await ask(rl, '🗑️  Enter the # to delete: ');
          deleteTransaction(idx);  // may throw RangeError
          break;
        }
        case '7':
          checkBalance();
          break;
        case '8':
          showRecursiveSummary();
          break;
        case '9':
          console.log(colors.green('\n👋 Goodbye! Your data is saved in finance.json.\n'));
          running = false;
          break;
        default:
          console.log(colors.yellow('\n⚠️  Invalid choice. Please enter a number from 1 to 9.\n'));
      }
    } catch (err) {
      // Catches RangeError, TypeError, and any other thrown exceptions
      console.log(colors.red('\n❌ Error: ' + err.message + '\n'));
    }
  }
  rl.close();
}

// ─────────────────────────────────────────────────────────────
//  Entry point
// ─────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log(colors.bold(colors.green('\n🎉 Welcome to your Personal Finance Tracker!\n')));
runMenu(rl);