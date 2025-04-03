const supabase = require('../config/supabase');
const { sendSMS } = require('../config/twilio');
const { BARBERS, isWorkingDay, isWorkingHours } = require('../utils/barberUtils');

const createAppointment = async (appointmentData) => {
  // Validate required fields
  if (!appointmentData.client_name || !appointmentData.phone_number || 
      !appointmentData.barber_name || !appointmentData.appointment_time) {
    throw new Error('Todos os campos são obrigatórios.');
  }

  const appointmentDate = new Date(appointmentData.appointment_time);

  if (!isWorkingDay(appointmentDate)) {
    throw new Error('A barbearia está fechada aos domingos e segundas-feiras.');
  }

  if (!isWorkingHours(appointmentDate)) {
    throw new Error('Horário fora do expediente (8:00 - 17:00).');
  }

  // Check if the time slot is already booked for this barber
  const startOfHour = new Date(appointmentDate);
  startOfHour.setMinutes(0, 0, 0);
  
  const endOfHour = new Date(startOfHour);
  endOfHour.setHours(endOfHour.getHours() + 1);

  try {
    const { data: existingAppointments, error: checkError } = await supabase
      .from('appointments')
      .select('*')
      .eq('barber_name', appointmentData.barber_name)
      .gte('appointment_time', startOfHour.toISOString())
      .lt('appointment_time', endOfHour.toISOString());

    if (checkError) {
      console.error('Error checking existing appointments:', checkError);
      throw new Error('Erro ao verificar disponibilidade do horário.');
    }

    if (existingAppointments && existingAppointments.length > 0) {
      throw new Error('Este horário já está reservado para este barbeiro.');
    }

    // Create the appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Erro ao criar agendamento no banco de dados.');
    }

    // Send SMS notification to the barber
    try {
      const barberName = appointmentData.barber_name.trim();
      const barber = Object.values(BARBERS).find(b => 
        b.name.toLowerCase() === barberName.toLowerCase()
      );
      
      if (barber && barber.phone) {
        console.log(`Found barber: ${barber.name}, phone: ${barber.phone}`);
        const message = `Novo corte marcado!\nCliente: ${appointmentData.client_name}\nTelefone: ${appointmentData.phone_number}\nHorário: ${new Date(appointmentData.appointment_time).toLocaleString('pt-BR')}`;
        await sendSMS(barber.phone, message);
      } else {
        console.warn(`Could not find barber or phone number for: ${barberName}`);
      }
    } catch (smsError) {
      console.error('Error sending SMS notification:', smsError);
    }

    return data;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

const getBarberDayAppointments = async (barberName, date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('barber_name', barberName)
      .gte('appointment_time', startOfDay.toISOString())
      .lte('appointment_time', endOfDay.toISOString())
      .order('appointment_time', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching barber appointments:', error);
    throw new Error('Erro ao buscar agendamentos do barbeiro.');
  }
};

const getAllAppointments = async () => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_time', { ascending: true });
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    return { data: null, error };
  }
};

const getBookedTimeSlots = async (date, barberName) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('barber_name', barberName)
      .gte('appointment_time', startOfDay.toISOString())
      .lte('appointment_time', endOfDay.toISOString());

    if (error) throw error;
    
    return data.map(appointment => {
      const date = new Date(appointment.appointment_time);
      return date.getHours();
    });
  } catch (error) {
    console.error('Error fetching booked time slots:', error);
    throw new Error('Erro ao buscar horários ocupados.');
  }
};

const cleanupOldAppointments = async () => {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .lt('appointment_time', new Date().toISOString());

    if (error) throw error;
  } catch (error) {
    console.error('Error cleaning up old appointments:', error);
    throw new Error('Erro ao limpar agendamentos antigos.');
  }
};

module.exports = {
  createAppointment,
  getBarberDayAppointments,
  getAllAppointments,
  getBookedTimeSlots,
  cleanupOldAppointments,
};