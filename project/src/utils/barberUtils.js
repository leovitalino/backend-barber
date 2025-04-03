const BARBERS = {
  CARLAO: {
    name: 'Carlão',
    phone: process.env.CARLAO_PHONE,
  },
  TIGRAO: {
    name: 'Tigrão',
    phone: process.env.TIGRAO_PHONE,
  },
};

const WORKING_HOURS = {
  start: 8, // 8:00
  end: 17, // 17:00
};

const isWorkingHours = (date) => {
  const hour = date.getHours();
  return hour >= WORKING_HOURS.start && hour < WORKING_HOURS.end;
};

const isWorkingDay = (date) => {
  const day = date.getDay();
  return day !== 0 && day !== 1; // Not Sunday (0) or Monday (1)
};

module.exports = {
  BARBERS,
  WORKING_HOURS,
  isWorkingHours,
  isWorkingDay,
};