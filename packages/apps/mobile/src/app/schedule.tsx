import { Schedule } from '../components/dashboard/Schedule';
import { useMedications } from '../context/MedicationContext';

export default function ScheduleScreen() {
  const { addMedication, medicationsByDate, cycleMedicationStatus } = useMedications();

  return (
    <Schedule
      medicationsByDate={medicationsByDate}
      onCycleMedicationStatus={cycleMedicationStatus}
      onAddMedication={addMedication}
    />
  );
}
