import { Schedule } from '../components/dashboard/Schedule';
import { useMedications } from '../context/MedicationContext';

export default function ScheduleScreen() {
  const { medicationsByDate, toggleMedicationTaken } = useMedications();

  return (
    <Schedule
      medicationsByDate={medicationsByDate}
      onToggleMedication={toggleMedicationTaken}
    />
  );
}
