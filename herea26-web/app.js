try {
// Supabase configuration - these need to be replaced with real values
const supabaseUrl = 'https://cnhprpdqrbpqilxtkurf.supabase.co';
const supabaseKey = 'sb_publishable_URKmPy7y6OtNvIwXTHz6TQ_2s6PG0YA';

// Initialize Supabase only if real keys are provided to prevent crash
const isPlaceholder = supabaseUrl === 'YOUR_SUPABASE_URL';
const supabase = (window.supabase && !isPlaceholder) ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;


    const regForm = document.getElementById('regForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');

    if(regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            submitBtn.textContent = 'PROCESSING...';
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50');

            try {
                // Collect form data
                const fullName = document.getElementById('fullName').value;
                const teammateName = document.getElementById('teammateName') ? document.getElementById('teammateName').value : '';
                const collegeName = document.getElementById('collegeName').value;
                const department = document.getElementById('department').value;
                const email = document.getElementById('email').value;
                const whatsapp = document.getElementById('whatsapp').value;
                const selectedEvent = document.getElementById('selectedEvent').value;
                const fileInput = document.getElementById('paymentScreenshot');
                
                if (fileInput.files.length === 0) {
                    throw new Error('Please upload a payment screenshot.');
                }

                const file = fileInput.files[0];
                
                // Generate Registration ID
                const regId = 'HER26-' + Math.floor(1000 + Math.random() * 9000);

                let publicUrl = 'dummy-url-for-demo.png';

                // Real Supabase Logic (only runs if real keys are provided)
                if (supabaseUrl !== 'YOUR_SUPABASE_URL') {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${regId}-${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage.from('payments').upload(fileName, file);
                    if (uploadError) throw uploadError;

                    const { data: urlData } = supabase.storage.from('payments').getPublicUrl(fileName);
                    publicUrl = urlData.publicUrl;

                    const { error: insertError } = await supabase.from('registrations').insert([{
                        registration_id: regId,
                        full_name: fullName + (teammateName ? ' & ' + teammateName : ''),
                        team_leader_name: fullName,
                        teammate_name: teammateName,
                        college_name: collegeName,
                        department: department,
                        email: email,
                        whatsapp: whatsapp,
                        selected_event: selectedEvent,
                        payment_screenshot: publicUrl,
                        payment_status: 'Pending'
                    }]);
                    
                    if (insertError) throw insertError;
                } else {
                    // Simulate network delay for demo mode
                    await new Promise(r => setTimeout(r, 1500));
                    console.log('Demo Mode: Form submitted successfully.', { regId, fullName, teammateName, selectedEvent });
                }

                // Show Success Message
                document.getElementById('s-regId').textContent = regId;
                document.getElementById('s-event').textContent = selectedEvent;
                
                regForm.style.opacity = '0';
                setTimeout(() => {
                    successMessage.classList.remove('hidden');
                    successMessage.style.animation = 'fadeIn 0.5s ease forwards';
                }, 300);

            } catch (error) {
                alert(error.message);
                submitBtn.textContent = 'SUBMIT REGISTRATION';
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50');
            }
        });
    }


} catch (e) {
    document.body.innerHTML = '<h1 style="color:red;font-size:20px;padding:50px;">Error: ' + e.message + '<br>' + e.stack + '</h1>';
}
