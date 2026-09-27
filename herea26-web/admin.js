try {
const supabaseUrl = 'https://cnhprpdqrbpqilxtkurf.supabase.co';
const supabaseKey = 'sb_publishable_URKmPy7y6OtNvIwXTHz6TQ_2s6PG0YA';
const isPlaceholder = supabaseUrl === 'YOUR_SUPABASE_URL';
const supabase = (window.supabase && !isPlaceholder) ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;
let allData = [];

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');

async function initAdmin() {
    if (isPlaceholder) {
        dashboardSection.classList.remove('hidden');
        loadDummyData();
    } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            dashboardSection.classList.remove('hidden');
            fetchData();
        } else {
            loginSection.classList.remove('hidden');
        }
    }
}
initAdmin();

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    if (!isPlaceholder) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { alert(error.message); return; }
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        fetchData();
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    if (!isPlaceholder) await supabase.auth.signOut();
    window.location.reload();
});

document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allData.filter(item => 
        item.full_name.toLowerCase().includes(term) ||
        item.registration_id.toLowerCase().includes(term) ||
        item.college_name.toLowerCase().includes(term)
    );
    renderTable(filtered);
});

async function fetchData() {
    const { data, error } = await supabase.from('registrations').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error(error);
        return;
    }
    allData = data;
    updateStats(data);
    renderTable(data);
}

function loadDummyData() {
    allData = [
        { id: 1, registration_id: 'HER26-1045', full_name: 'Alice Smith', college_name: 'Tech University', department: 'CS', email: 'alice@test.com', whatsapp: '9876543210', selected_event: 'BETQUEST', payment_status: 'Pending', payment_screenshot: '#' },
        { id: 2, registration_id: 'HER26-2938', full_name: 'Sarah Johnson', college_name: 'City College', department: 'IT', email: 'sarah@test.com', whatsapp: '8765432109', selected_event: 'HER HORIZON', payment_status: 'Verified', payment_screenshot: '#' },
        { id: 3, registration_id: 'HER26-9283', full_name: 'John Doe', college_name: 'State Engineering', department: 'ECE', email: 'john@test.com', whatsapp: '7654321098', selected_event: 'BOTH', payment_status: 'Rejected', payment_screenshot: '#' }
    ];
    updateStats(allData);
    renderTable(allData);
}

function updateStats(data) {
    document.getElementById('stat-total').textContent = data.length;
    document.getElementById('stat-bq').textContent = data.filter(d => d.selected_event === 'BETQUEST').length;
    document.getElementById('stat-hh').textContent = data.filter(d => d.selected_event === 'HER HORIZON').length;
    document.getElementById('stat-pending').textContent = data.filter(d => d.payment_status === 'Pending').length;
}

window.updateStatus = async function(id, status) {
    if (!isPlaceholder) {
        await supabase.from('registrations').update({ payment_status: status }).eq('id', id);
        fetchData();
    } else {
        const item = allData.find(d => d.id === id);
        if (item) item.payment_status = status;
        updateStats(allData);
        renderTable(allData);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('registrationsTableBody');
    tbody.innerHTML = '';
    data.forEach(item => {
        let statusBadge = 'bg-yellow-500/20 text-yellow-500';
        if (item.payment_status === 'Verified') statusBadge = 'bg-green-500/20 text-green-400';
        if (item.payment_status === 'Rejected') statusBadge = 'bg-red-500/20 text-red-400';

        const tr = document.createElement('tr');
        tr.className = 'border-t border-gray-700';
        tr.innerHTML = `
            <td class="p-4 font-mono text-yellow-500">${item.registration_id}</td>
            <td class="p-4">
                <p class="font-bold text-white">${item.full_name}</p>
                <p class="text-xs text-gray-400">${item.college_name} - ${item.department}</p>
            </td>
            <td class="p-4">
                <p class="text-sm">${item.email}</p>
                <p class="text-xs text-gray-400">WA: ${item.whatsapp}</p>
            </td>
            <td class="p-4">
                <span class="px-2 py-1 bg-white/10 rounded text-xs font-medium">${item.selected_event}</span>
            </td>
            <td class="p-4">
                <span class="px-2 py-1 rounded text-xs font-bold ${statusBadge}">${item.payment_status}</span>
            </td>
            <td class="p-4 text-center">
                <div class="flex gap-2 justify-center">
                    <a href="${item.payment_screenshot}" target="_blank" class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 text-xs">View Image</a>
                    <button onclick="updateStatus(${item.id}, 'Verified')" class="px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 text-xs">Verify</button>
                    <button onclick="updateStatus(${item.id}, 'Rejected')" class="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs">Reject</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
} catch (e) {
    document.body.innerHTML = '<h1 style="color:red;font-size:20px;padding:50px;">Error: ' + e.message + '<br>' + e.stack + '</h1>';
}
