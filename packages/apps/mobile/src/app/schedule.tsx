import { todaysMedications } from '../data/medications';
import { Schedule } from '../components/dashboard/Schedule';

export default function ScheduleScreen() {
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  return <Schedule medicationsByDate={{ [todayKey]: todaysMedications }} />;
}
