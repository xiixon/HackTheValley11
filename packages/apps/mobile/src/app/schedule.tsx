import { todaysMedications } from '../data/medications';
import { Schedule } from '../components/dashboard/Schedule';

export default function ScheduleScreen() {
  return <Schedule medications={todaysMedications} />;
}
