document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const appointmentForm = document.getElementById('appointment-form');
  const barberSelect = document.getElementById('barber');
  const appointmentDateInput = document.getElementById('appointment-date');
  const appointmentTimeSelect = document.getElementById('appointment-time');
  const appointmentsList = document.getElementById('appointments-list');
  const barberTabs = document.querySelector('.barber-tabs');
  
  // Base API URL - Using HTTP instead of HTTPS
  const API_URL = window.location.protocol === 'https:' 
    ? 'https://localhost:3001/api'
    : 'http://localhost:3001/api';
  
  // Set minimum date to today
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  appointmentDateInput.min = formattedDate;
  appointmentDateInput.value = formattedDate;
  
  // Generate time slots (8:00 - 17:00)
  function generateTimeSlots(bookedSlots = []) {
    appointmentTimeSelect.innerHTML = '<option value="">Selecione um horário</option>';
    
    for (let hour = 8; hour < 17; hour++) {
      const formattedHour = hour.toString().padStart(2, '0');
      const timeValue = `${formattedHour}:00`;
      
      const option = document.createElement('option');
      option.value = timeValue;
      option.textContent = timeValue;
      
      // Disable booked slots
      if (bookedSlots.includes(hour)) {
        option.disabled = true;
        option.textContent = `${timeValue} - Ocupado`;
      }
      
      appointmentTimeSelect.appendChild(option);
    }
  }
  
  // Fetch booked time slots for a specific date and barber
  async function fetchBookedTimeSlots() {
    const barberName = barberSelect.value;
    const date = appointmentDateInput.value;
    
    if (!barberName || !date) {
      generateTimeSlots();
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/appointments/booked-slots?date=${date}&barberName=${encodeURIComponent(barberName)}`);
      if (!response.ok) throw new Error('Failed to fetch booked slots');
      const bookedSlots = await response.json();
      generateTimeSlots(bookedSlots);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      generateTimeSlots();
    }
  }
  
  // Fetch barbers and populate select
  async function fetchBarbers() {
    try {
      const response = await fetch(`${API_URL}/barbers`);
      if (!response.ok) throw new Error('Failed to fetch barbers');
      const barbers = await response.json();
      
      barberSelect.innerHTML = '<option value="">Selecione um barbeiro</option>';
      
      barbers.forEach(barber => {
        const option = document.createElement('option');
        option.value = barber.name;
        option.textContent = barber.name;
        barberSelect.appendChild(option);
        
        // Also add barber tabs
        if (!document.querySelector(`[data-barber="${barber.name}"]`)) {
          const tabBtn = document.createElement('button');
          tabBtn.className = 'tab-btn';
          tabBtn.setAttribute('data-barber', barber.name);
          tabBtn.textContent = barber.name;
          barberTabs.appendChild(tabBtn);
        }
      });
      
      // Add event listeners to tabs
      document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
          document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          fetchAppointments(this.getAttribute('data-barber'));
        });
      });
      
    } catch (error) {
      console.error('Error fetching barbers:', error);
    }
  }
  
  // Fetch appointments
  async function fetchAppointments(barberFilter = 'all') {
    appointmentsList.innerHTML = '<p class="loading">Carregando agendamentos...</p>';
    
    try {
      const response = await fetch(`${API_URL}/appointments`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const appointments = await response.json();
      
      // Filter appointments for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let filteredAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.appointment_time);
        return appointmentDate >= today && appointmentDate < tomorrow;
      });
      
      // Apply barber filter if not "all"
      if (barberFilter !== 'all') {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.barber_name === barberFilter
        );
      }
      
      // Sort by time
      filteredAppointments.sort((a, b) => 
        new Date(a.appointment_time) - new Date(b.appointment_time)
      );
      
      // Display appointments
      if (filteredAppointments.length === 0) {
        appointmentsList.innerHTML = '<p>Nenhum agendamento para hoje.</p>';
      } else {
        appointmentsList.innerHTML = '';
        
        filteredAppointments.forEach(appointment => {
          const appointmentTime = new Date(appointment.appointment_time);
          const timeString = appointmentTime.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          const card = document.createElement('div');
          card.className = 'appointment-card';
          card.innerHTML = `
            <p><span class="appointment-time">${timeString}</span> - 
               <span class="appointment-client">${appointment.client_name}</span></p>
            <p class="appointment-phone">Telefone: ${appointment.phone_number}</p>
            <p class="appointment-barber">Barbeiro: ${appointment.barber_name}</p>
          `;
          
          appointmentsList.appendChild(card);
        });
      }
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
      appointmentsList.innerHTML = '<p>Erro ao carregar agendamentos.</p>';
    }
  }
  
  // Event listeners for form fields
  barberSelect.addEventListener('change', fetchBookedTimeSlots);
  appointmentDateInput.addEventListener('change', fetchBookedTimeSlots);
  
  // Handle form submission
  appointmentForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const clientName = document.getElementById('client-name').value;
    const clientPhone = document.getElementById('client-phone').value;
    const barberName = barberSelect.value;
    const appointmentDate = appointmentDateInput.value;
    const appointmentTime = appointmentTimeSelect.value;
    
    // Create appointment datetime
    const [hours, minutes] = appointmentTime.split(':');
    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const appointmentData = {
      client_name: clientName,
      phone_number: clientPhone,
      barber_name: barberName,
      appointment_time: appointmentDateTime.toISOString()
    };
    
    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create appointment');
      }
      const result = await response.json();
      
      // Show success message
      alert(`Agendamento confirmado para ${clientName} às ${appointmentTime} com ${barberName}`);
      
      // Reset form
      appointmentForm.reset();
      appointmentDateInput.value = formattedDate;
      
      // Refresh appointments list and available time slots
      fetchAppointments('all');
      fetchBookedTimeSlots();
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert(`Erro ao criar agendamento: ${error.message}`);
    }
  });
  
  // Initialize
  generateTimeSlots();
  fetchBarbers();
  fetchAppointments('all');
});