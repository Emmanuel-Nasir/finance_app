const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_FILE = path.join(__dirname, 'finance.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { transactions: [] };
  }

  const rawText = fs.readFileSync(DATA_FILE, 'utf8');

  if (rawText.trim() === '') {
    return { transactions: [] };
  }

  const data = JSON.parse(rawText);

  if (!data.transactions) {
    data.transactions = [];
  }

  return data;
}

function saveData(data) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(DATA_FILE, jsonData, 'utf8');
}

function addTransaction(type, description, amount) {
  const data = loadData();
  const transaction = {
    id: Date.now(),
    type: type,
    description: description,
    amount: parseFloat(amount),
    date: new Date().toISOString()
  };
  data.transactions.push(transaction);  // ✅ fixed - added the s
  saveData(data);
  console.log(`\n✅ ${type.toUpperCase()} of ₦${amount} added successfully!\n`);
}

function viewTransactions() {
  const data = loadData();
  if (data.transactions.length === 0) {
    console.log('\n📭 No transactions found. Start by adding income or an expense.\n');
    return;
  }
  console.log('\n────────────────────────────────────────────────');
  console.log('         📒 ALL TRANSACTIONS');
  console.log('────────────────────────────────────────────────');
  data.transactions.forEach(function(t) {
    const icon = t.type === 'income' ? '🟢' : '🔴';
    console.log(`${icon} [${t.date.slice(0, 10)}] ${t.type.toUpperCase().padEnd(8)} | ₦${t.amount.toFixed(2).padStart(12)} | ${t.description}`);
  });
  console.log('────────────────────────────────────────────────\n');
}

function checkBalance() {
  const data = loadData();
  const balance = data.transactions.reduce(function(total, t) {
    if (t.type === 'income') {
      return total + t.amount;
    } else {
      return total - t.amount;
    }
  }, 0);
  const totalIncome = data.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  console.log('\n────────────────────────────────────────────────');
  console.log('         💰 BALANCE SUMMARY');
  console.log('────────────────────────────────────────────────');
  console.log(`  Total Income:    ₦${totalIncome.toFixed(2)}`);
  console.log(`  Total Expenses:  ₦${totalExpenses.toFixed(2)}`);
  console.log(`  ─────────────────────────────────`);
  const balanceLabel = balance >= 0
    ? `  ✅ Net Balance:   ₦${balance.toFixed(2)}`
    : `  ❌ Net Balance:   -₦${Math.abs(balance).toFixed(2)}`;
  console.log(balanceLabel);
  console.log('────────────────────────────────────────────────\n');
}

function showMenu(rl) {
  console.log('════════════════════════════════════════════════');
  console.log('        💼 PERSONAL FINANCE TRACKER');
  console.log('════════════════════════════════════════════════');
  console.log('  1. Add Income');
  console.log('  2. Add Expense');
  console.log('  3. View All Transactions');
  console.log('  4. Check Balance');
  console.log('  5. Exit');
  console.log('════════════════════════════════════════════════');
  rl.question('👉 Enter your choice (1–5): ', function(choice) {
    const trimmed = choice.trim();
    switch (trimmed) {
      case '1':
        rl.question('📝 Description (e.g. Salary, Freelance): ', function(desc) {
          rl.question('💵 Amount (₦): ', function(amt) {
            if (isNaN(amt) || parseFloat(amt) <= 0) {
              console.log('\n⚠️  Invalid amount. Please enter a positive number.\n');
            } else {
              addTransaction('income', desc.trim(), amt.trim());
            }
            showMenu(rl);
          });
        });
        break;
      case '2':
        rl.question('📝 Description (e.g. Rent, Groceries): ', function(desc) {
          rl.question('💸 Amount (₦): ', function(amt) {
            if (isNaN(amt) || parseFloat(amt) <= 0) {
              console.log('\n⚠️  Invalid amount. Please enter a positive number.\n');
            } else {
              addTransaction('expense', desc.trim(), amt.trim());
            }
            showMenu(rl);
          });
        });
        break;
      case '3':
        viewTransactions();
        showMenu(rl);
        break;
      case '4':
        checkBalance();
        showMenu(rl);
        break;
      case '5':
        console.log('\n👋 Goodbye! Your data has been saved to finance.json.\n');
        rl.close();
        break;
      default:
        console.log('\n⚠️  Invalid choice. Please enter a number from 1 to 5.\n');
        showMenu(rl);
        break;
    }
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🎉 Welcome to your Personal Finance Tracker!\n');
showMenu(rl);