const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { scheduleDailyNotifications } = require('./src/schedulers/appointmentScheduler');
const appointmentService = require('./src/services/appointmentService');

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URL here
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files from the 'static' directory
app.use(express.static(path.join(__dirname, 'static')));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// Start the scheduler
scheduleDailyNotifications();

// API Routes
app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/appointments/:barberName/today', async (req, res) => {
  try {
    const appointments = await appointmentService.getBarberDayAppointments(
      req.params.barberName,
      new Date()
    );
    res.json(appointments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const { data, error } = await appointmentService.getAllAppointments();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get booked time slots for a specific date and barber
app.get('/api/appointments/booked-slots', async (req, res) => {
  try {
    const { date, barberName } = req.query;
    if (!date || !barberName) {
      return res.status(400).json({ error: 'Date and barber name are required' });
    }
    
    const bookedSlots = await appointmentService.getBookedTimeSlots(new Date(date), barberName);
    res.json(bookedSlots);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get available barbers
app.get('/api/barbers', (req, res) => {
  const { BARBERS } = require('./src/utils/barberUtils');
  res.json(Object.values(BARBERS).map(barber => ({
    name: barber.name
  })));
});

app.listen(port, () => {
  console.log(`Barbershop backend running on port ${port}`);
  console.log(`Visit http://localhost:${port} to access the application`);
});