// Helper function to get times between start and end times
// Parameters:
//   start_time: string - start time in HH:MM format
//   end_time: string - end time in HH:MM format
export const getTimes = (start_time, end_time, interval) => {
  const start = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
  const end = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
  const times = [];
  for (let i = start; i <= end; i += interval) {
    const hours = Math.floor(i / 60).toString().padStart(2, '0');
    const minutes = (i % 60 === 0 ? '00' : '30');
    times.push(`${hours}:${minutes}`);
  }
  return times;
};