const cron = require('node-cron');
const { sendSMS } = require('../config/twilio');
const { BARBERS } = require('../utils/barberUtils');
const { getBarberDayAppointments, cleanupOldAppointments } = require('../services/appointmentService');

// Schedule daily SMS at 7:00 AM
const scheduleDailyNotifications = () => {
  cron.schedule('0 7 * * *', async () => {
    try {
      // Send daily schedule to each barber
      for (const barber of Object.values(BARBERS)) {
        const appointments = await getBarberDayAppointments(barber.name, new Date());
        
        if (appointments.length > 0) {
          const message = `Bom dia ${barber.name}! Seus agendamentos para hoje:\n\n${
            appointments
              .map(apt => `${new Date(apt.appointment_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${apt.client_name}`)
              .join('\n')
          }`;
          
          await sendSMS(barber.phone, message);
        } else {
          await sendSMS(barber.phone, `Bom dia ${barber.name}! Você não tem agendamentos para hoje.`);
        }
      }

      // Cleanup old appointments
      await cleanupOldAppointments();
    } catch (error) {
      console.error('Error in daily notification scheduler:', error);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });
};

module.exports = { scheduleDailyNotifications };