import { Schedule } from '../components/dashboard/Schedule';
import { useMedications } from '../context/MedicationContext';

export default function ScheduleScreen() {
  const { now, pendingIds, addMedication, medicationsByDate, cycleMedicationStatus, updateMedication, deleteMedication } = useMedications();

  return (
    <Schedule
      now={now}
      pendingIds={pendingIds}
      medicationsByDate={medicationsByDate}
      onCycleMedicationStatus={cycleMedicationStatus}
      onAddMedication={addMedication}
      onUpdateMedication={updateMedication}
      onDeleteMedication={deleteMedication}
    />
  );
}
