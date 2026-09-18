// ============================================================
// 📅 DATE + YEAR DISPLAY
// ============================================================
function initDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dateEl = document.getElementById('dateDisplay');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', options);

    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = now.getFullYear();
}
initDate();


// ============================================================
// ✅ TASK MANAGER
// ============================================================
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('wina_tasks')) || [];
        this.currentFilter = 'all';

        this.inputEl     = document.getElementById('taskInput');
        this.priorityEl  = document.getElementById('prioritySelect');
        this.dueDateEl   = document.getElementById('dueDate');
        this.addBtn      = document.getElementById('addTaskBtn');
        this.listEl      = document.getElementById('taskList');
        this.emptyEl     = document.getElementById('emptyState');

        this.completedEl = document.getElementById('completedCount');
        this.pendingEl   = document.getElementById('pendingCount');
        this.scoreEl     = document.getElementById('productivityScore');

        this.filterBtns = document.querySelectorAll('.filter-btn');

        if (!this.addBtn || !this.inputEl) return;

        this.addBtn.addEventListener('click', () => this.addTask());
        this.inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                this.filterBtns.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.render();
            });
        });

        this.render();
    }

    addTask() {
        const text = this.inputEl.value.trim();
        if (!text) return;

        this.tasks.unshift({
            id: Date.now(),
            text,
            priority: this.priorityEl ? this.priorityEl.value : 'medium',
            dueDate: this.dueDateEl ? (this.dueDateEl.value || null) : null,
            done: false,
            createdAt: new Date().toISOString(),
        });

        this.inputEl.value = '';
        if (this.dueDateEl) this.dueDateEl.value = '';
        if (this.priorityEl) this.priorityEl.value = 'medium';

        this.save();
        this.render();
    }

    toggle(id) {
        const task = this.tasks.find((t) => t.id === id);
        if (task) task.done = !task.done;
        this.save();
        this.render();
    }

    remove(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        this.tasks = this.tasks.filter((t) => t.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('wina_tasks', JSON.stringify(this.tasks));
    }

    getFiltered() {
        switch (this.currentFilter) {
            case 'active':    return this.tasks.filter((t) => !t.done);
            case 'completed': return this.tasks.filter((t) => t.done);
            case 'high':      return this.tasks.filter((t) => t.priority === 'high');
            default:          return this.tasks;
        }
    }

    updateStats() {
        const total     = this.tasks.length;
        const completed = this.tasks.filter((t) => t.done).length;
        const pending   = total - completed;
        const score     = total === 0 ? 0 : Math.round((completed / total) * 100);

        if (this.completedEl) this.completedEl.textContent = completed;
        if (this.pendingEl)   this.pendingEl.textContent   = pending;
        if (this.scoreEl)     this.scoreEl.textContent     = score + '%';
    }

    render() {
        if (!this.listEl) return;

        const filtered = this.getFiltered();
        this.listEl.innerHTML = '';

        if (this.emptyEl) {
            if (filtered.length === 0) {
                this.emptyEl.classList.add('show');
            } else {
                this.emptyEl.classList.remove('show');
            }
        }

        filtered.forEach((task) => {
            const item = document.createElement('div');
            item.className = 'task-item' + (task.done ? ' completed' : '');

            // Checkbox
            const checkbox = document.createElement('div');
            checkbox.className = 'task-checkbox' + (task.done ? ' checked' : '');
            checkbox.addEventListener('click', () => this.toggle(task.id));

            // Content
            const content = document.createElement('div');
            content.className = 'task-content';

            const text = document.createElement('div');
            text.className = 'task-text';
            text.textContent = task.text;
            content.appendChild(text);

            const meta = document.createElement('div');
            meta.className = 'task-meta';

            const badge = document.createElement('span');
            badge.className = 'priority-badge priority-' + task.priority;
            badge.textContent =
                task.priority === 'high' ? '❤️ High'
              : task.priority === 'low'  ? '💚 Low'
              : '💛 Medium';
            meta.appendChild(badge);

            if (task.dueDate) {
                const due = document.createElement('span');
                due.className = 'due-date';
                const d = new Date(task.dueDate);
                due.textContent = '📅 ' + d.toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                });
                meta.appendChild(due);
            }

            content.appendChild(meta);

            // Actions
            const actions = document.createElement('div');
            actions.className = 'task-actions';

            const del = document.createElement('button');
            del.className = 'delete-btn';
            del.innerHTML = '<i class="fas fa-trash"></i>';
            del.addEventListener('click', () => this.remove(task.id));
            actions.appendChild(del);

            item.appendChild(checkbox);
            item.appendChild(content);
            item.appendChild(actions);
            this.listEl.appendChild(item);
        });

        this.updateStats();
    }
}
new TaskManager();


// ============================================================
// 💰 BUDGET PLANNER (Money Manager v2)
// ============================================================
class MoneyManager {
    constructor() {
        this.tx      = JSON.parse(localStorage.getItem('wina_transactions')) || [];
        this.budgets = JSON.parse(localStorage.getItem('wina_budgets')) || {
            kuliah:  0,
            makan:   0,
            darurat: 0,
            nabung:  0,
            jajan:   0,
        };

        // Input transaction
        this.descEl   = document.getElementById('moneyDesc');
        this.amountEl = document.getElementById('moneyAmount');
        this.typeEl   = document.getElementById('moneyType');
        this.catEl    = document.getElementById('moneyCategory');
        this.addBtn   = document.getElementById('addMoneyBtn');
        this.listEl   = document.getElementById('moneyList');

        // Summary
        this.incomeEl  = document.getElementById('totalIncome');
        this.expenseEl = document.getElementById('totalExpense');
        this.balanceEl = document.getElementById('balance');

        // Budget inputs
        this.budgetInputs = {
            kuliah:  document.getElementById('budgetKuliah'),
            makan:   document.getElementById('budgetMakan'),
            darurat: document.getElementById('budgetDarurat'),
            nabung:  document.getElementById('budgetNabung'),
            jajan:   document.getElementById('budgetJajan'),
        };
        this.saveBudgetBtn = document.getElementById('saveBudgetBtn');
        this.resetBtn      = document.getElementById('resetDataBtn');

        if (!this.addBtn) return;

        this.addBtn.addEventListener('click', () => this.add());
        this.amountEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.add();
        });

        if (this.saveBudgetBtn) {
            this.saveBudgetBtn.addEventListener('click', () => this.saveBudgets());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetAll());
        }

        this.loadBudgetInputs();
        this.render();
    }

    loadBudgetInputs() {
        Object.keys(this.budgetInputs).forEach((key) => {
            const el = this.budgetInputs[key];
            if (el && this.budgets[key]) el.value = this.budgets[key];
        });
    }

    saveBudgets() {
        const newBudgets = {};
        Object.keys(this.budgetInputs).forEach((key) => {
            const el  = this.budgetInputs[key];
            const val = el ? parseFloat(el.value) || 0 : 0;
            newBudgets[key] = val;
        });
        this.budgets = newBudgets;
        localStorage.setItem('wina_budgets', JSON.stringify(this.budgets));
        this.render();

        const status = document.getElementById('budgetStatus');
        if (status) {
            status.textContent = '✅ Budget berhasil disimpan!';
            status.className = 'status connected';
            setTimeout(() => { status.textContent = ''; }, 2500);
        }
    }

    resetAll() {
        if (!confirm('Hapus SEMUA data transaksi & budget? Tindakan ini tidak bisa dibatalkan.')) return;
        this.tx = [];
        this.budgets = { kuliah: 0, makan: 0, darurat: 0, nabung: 0, jajan: 0 };
        localStorage.removeItem('wina_transactions');
        localStorage.removeItem('wina_budgets');
        this.loadBudgetInputs();
        this.render();
        alert('Semua data berhasil dihapus.');
    }

    add() {
        const desc   = this.descEl.value.trim();
        const amount = parseFloat(this.amountEl.value);
        const type   = this.typeEl.value;
        const cat    = this.catEl.value;

        if (!desc || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid description and amount.');
            return;
        }

        this.tx.unshift({
            id: Date.now(),
            desc,
            amount,
            type,
            cat,
            date: new Date().toISOString(),
        });

        this.descEl.value   = '';
        this.amountEl.value = '';

        this.save();
        this.render();
    }

    remove(id) {
        if (!confirm('Delete this transaction?')) return;
        this.tx = this.tx.filter((t) => t.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('wina_transactions', JSON.stringify(this.tx));
    }

    // Hitung total per kategori (hanya expense)
    getSpentByCategory() {
        const spent = { kuliah: 0, makan: 0, darurat: 0, nabung: 0, jajan: 0 };
        this.tx
            .filter((t) => t.type === 'expense')
            .forEach((t) => {
                if (spent[t.cat] !== undefined) spent[t.cat] += t.amount;
            });
        return spent;
    }

    render() {
        // ---- Total income / expense / balance ----
        const inc = this.tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const exp = this.tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        if (this.incomeEl)  this.incomeEl.textContent  = '$' + inc.toFixed(2);
        if (this.expenseEl) this.expenseEl.textContent = '$' + exp.toFixed(2);
        if (this.balanceEl) this.balanceEl.textContent = '$' + (inc - exp).toFixed(2);

        // ---- Per-category progress ----
        const spent = this.getSpentByCategory();
        const cats  = ['kuliah', 'makan', 'darurat', 'nabung', 'jajan'];

        cats.forEach((cat) => {
            const budgetEl  = document.getElementById('budgetVal_'  + cat);
            const spentEl   = document.getElementById('spentVal_'   + cat);
            const remainEl  = document.getElementById('remainVal_'  + cat);
            const barEl     = document.getElementById('bar_'        + cat);
            const percentEl = document.getElementById('percent_'    + cat);

            const budget  = this.budgets[cat] || 0;
            const used    = spent[cat] || 0;
            const remain  = budget - used;
            const percent = budget === 0 ? 0 : Math.min(Math.round((used / budget) * 100), 100);

            if (budgetEl)  budgetEl.textContent  = '$' + budget.toFixed(2);
            if (spentEl)   spentEl.textContent   = '$' + used.toFixed(2);
            if (remainEl) {
                remainEl.textContent = '$' + remain.toFixed(2);
                remainEl.style.color = remain < 0 ? '#dc2626' : '#059669';
            }
            if (barEl) {
                barEl.style.width = percent + '%';
                barEl.style.background =
                    percent >= 100 ? '#dc2626'
                  : percent >= 75  ? '#f59e0b'
                  : '#10b981';
            }
            if (percentEl) percentEl.textContent = percent + '%';
        });

        // ---- Transaction list ----
        if (!this.listEl) return;

        if (this.tx.length === 0) {
            this.listEl.innerHTML =
                '<li style="justify-content:center;color:#94a3b8;">No transactions yet.</li>';
            return;
        }

        const catLabels = {
            kuliah:  '🎓 Kuliah',
            makan:   '🍱 Makan',
            darurat: '🚨 Darurat',
            nabung:  '💰 Nabung',
            jajan:   '🎮 Jajan',
            other:   '📦 Lainnya',
        };

        this.listEl.innerHTML = this.tx.map((t) => `
            <li class="${t.type}">
                <span>
                    <strong>${t.desc}</strong><br>
                    <small style="color:#888;">${catLabels[t.cat] || '📦 Lainnya'}</small>
                </span>
                <span>
                    ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
                    <button class="delete-btn" style="margin-left:8px;padding:4px 8px;font-size:0.8rem;"
                        onclick="window._removeTx(${t.id})">✕</button>
                </span>
            </li>`).join('');
    }
}

const moneyManagerInstance = new MoneyManager();
window._removeTx = function (id) { moneyManagerInstance.remove(id); };

      
  


// ============================================================
// 🎓 CLASS MANAGER
// ============================================================
class ClassManager {
    constructor() {
        this.classes = JSON.parse(localStorage.getItem('wina_classes')) || [];

        this.nameEl     = document.getElementById('className');
        this.locationEl = document.getElementById('classLocation');
        this.dayEl      = document.getElementById('classDay');
        this.startEl    = document.getElementById('classStart');
        this.endEl      = document.getElementById('classEnd');
        this.addBtn     = document.getElementById('addClassBtn');
        this.listEl     = document.getElementById('classList');

        if (!this.addBtn) return;

        this.addBtn.addEventListener('click', () => this.add());
        this.render();
    }

    add() {
        const name     = this.nameEl.value.trim();
        const location = this.locationEl.value.trim();
        const day      = this.dayEl.value;
        const start    = this.startEl.value;
        const end      = this.endEl.value;

        if (!name || !start || !end) {
            alert('Please fill in class name, start time, and end time.');
            return;
        }
        if (start >= end) {
            alert('End time must be after start time.');
            return;
        }

        this.classes.push({ id: Date.now(), name, location, day, start, end });

        this.nameEl.value     = '';
        this.locationEl.value = '';
        this.startEl.value    = '';
        this.endEl.value      = '';

        this.save();
        this.render();
    }

    remove(id) {
        if (!confirm('Delete this class?')) return;
        this.classes = this.classes.filter((c) => c.id !== id);
        this.save();
        this.render();
    }

    save() {
        localStorage.setItem('wina_classes', JSON.stringify(this.classes));
    }

    render() {
        if (!this.listEl) return;

        const dayNames = {
            MO: 'Monday', TU: 'Tuesday', WE: 'Wednesday',
            TH: 'Thursday', FR: 'Friday', SA: 'Saturday', SU: 'Sunday',
        };

        if (this.classes.length === 0) {
            this.listEl.innerHTML =
                '<li style="justify-content:center;color:#94a3b8;">No classes added yet.</li>';
            return;
        }

        this.listEl.innerHTML = this.classes.map((c) => `
            <li>
                <span>
                    <strong>${c.name}</strong><br>
                    <small>${dayNames[c.day]} · ${c.start} – ${c.end}${c.location ? ' · ' + c.location : ''}</small>
                </span>
                <button class="delete-btn" onclick="window._removeClass(${c.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </li>`).join('');
    }
}

const classManagerInstance = new ClassManager();
window._removeClass = function (id) { classManagerInstance.remove(id); };


// ============================================================
// 📆 EXPORT CLASSES TO .ics
// ============================================================
const downloadBtn = document.getElementById('downloadIcsBtn');

if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadClassesAsIcs);
}

function downloadClassesAsIcs() {
    const statusEl
