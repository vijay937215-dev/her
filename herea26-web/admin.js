try {
    const supabaseUrl = 'https://cnhprpdqrbpqilxtkurf.supabase.co';
    const supabaseKey = 'sb_publishable_URKmPy7y6OtNvIwXTHz6TQ_2s6PG0YA';
    const supabase = window.supabase?.createClient(supabaseUrl, supabaseKey);
    let allData = [];

    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');

    loginSection.classList.remove('hidden');

    function isAdmin(user) {
        return user?.app_metadata?.role === 'admin';
    }

    async function openDashboard(user) {
        if (!isAdmin(user)) {
            await supabase.auth.signOut();
            loginSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
            alert('This account is not authorized to access the admin dashboard.');
            return;
        }

        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        await fetchData();
    }

    loginForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = loginForm.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Signing in...';

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: document.getElementById('adminEmail').value.trim(),
                password: document.getElementById('adminPassword').value
            });
            if (error) throw error;
            await openDashboard(data.user);
        } catch (error) {
            alert(`Login failed: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = 'Login';
        }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        dashboardSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        document.getElementById('adminPassword').value = '';
    });

    document.getElementById('searchInput')?.addEventListener('input', (event) => {
        const term = event.target.value.toLowerCase();
        const filtered = allData.filter(item =>
            [item.full_name, item.registration_id, item.college_name]
                .some(value => String(value ?? '').toLowerCase().includes(term))
        );
        renderTable(filtered);
    });

    async function fetchData() {
        const { data, error } = await supabase
            .from('registrations')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error(error);
            alert(`Could not load registrations: ${error.message}`);
            return;
        }
        allData = data ?? [];
        updateStats(allData);
        renderTable(allData);
    }

    function updateStats(data) {
        document.getElementById('stat-total').textContent = data.length;
        document.getElementById('stat-bq').textContent = data.filter(d => d.selected_event === 'BETQUEST' || d.selected_event === 'BOTH').length;
        document.getElementById('stat-hh').textContent = data.filter(d => d.selected_event === 'HER HORIZON' || d.selected_event === 'BOTH').length;
        document.getElementById('stat-pending').textContent = data.filter(d => d.payment_status === 'Pending').length;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    window.updateStatus = async function(id, status) {
        const { error } = await supabase
            .from('registrations')
            .update({ payment_status: status })
            .eq('id', id);
        if (error) {
            alert(`Could not update payment status: ${error.message}`);
            return;
        }
        await fetchData();
    };

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
                <td class="p-4 font-mono text-yellow-500">${escapeHtml(item.registration_id)}</td>
                <td class="p-4">
                    <p class="font-bold text-white">${escapeHtml(item.full_name)}</p>
                    <p class="text-xs text-gray-400">${escapeHtml(item.college_name)} - ${escapeHtml(item.department)}</p>
                </td>
                <td class="p-4">
                    <p class="text-sm">${escapeHtml(item.email)}</p>
                    <p class="text-xs text-gray-400">WA: ${escapeHtml(item.whatsapp)}</p>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 bg-white/10 rounded text-xs font-medium">${escapeHtml(item.selected_event)}</span>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded text-xs font-bold ${statusBadge}">${escapeHtml(item.payment_status)}</span>
                </td>
                <td class="p-4 text-center">
                    <div class="flex gap-2 justify-center">
                        <a href="${escapeHtml(item.payment_screenshot)}" target="_blank" rel="noopener noreferrer" class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 text-xs">View Image</a>
                        <button onclick="updateStatus(${Number(item.id)}, 'Verified')" class="px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 text-xs">Verify</button>
                        <button onclick="updateStatus(${Number(item.id)}, 'Rejected')" class="px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 text-xs">Reject</button>
                    </div>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    if (!supabase) {
        alert('Supabase client could not be initialized. Check the Supabase URL and public key.');
    } else {
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                alert(`Could not check admin session: ${error.message}`);
                return;
            }
            if (data.session) openDashboard(data.session.user);
        });
    }
} catch (error) {
    document.body.innerHTML = '<h1 style="color:red;font-size:20px;padding:50px;">Error: ' + error.message + '<br>' + error.stack + '</h1>';
}
