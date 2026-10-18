import { Schedule } from '../components/dashboard/Schedule';
import { useMedications } from '../context/MedicationContext';

export default function ScheduleScreen() {
  const { addMedication, medicationsByDate, cycleMedicationStatus, updateMedication, deleteMedication } = useMedications();

  return (
    <Schedule
      medicationsByDate={medicationsByDate}
      onCycleMedicationStatus={cycleMedicationStatus}
      onAddMedication={addMedication}
      onUpdateMedication={updateMedication}
      onDeleteMedication={deleteMedication}
    />
  );
}
