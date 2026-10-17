import { Schedule } from '../components/dashboard/Schedule';
import { useMedications } from '../context/MedicationContext';

export default function ScheduleScreen() {
  const { addMedication, medicationsByDate, toggleMedicationTaken } = useMedications();

  return (
    <Schedule
      medicationsByDate={medicationsByDate}
      onToggleMedication={toggleMedicationTaken}
      onAddMedication={addMedication}
    />
  );
}
