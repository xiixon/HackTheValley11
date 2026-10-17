import { Medication } from '../types/medication';

export const todaysMedications: Medication[] = [
  {
    id: 'vitamin-d',
    name: 'Vitamin D',
    dosage: '1000 IU · 1 capsule',
    time: '8:00 AM',
    status: 'taken',
    color: '#E5B96B',
  },
  {
    id: 'lisinopril',
    name: 'Lisinopril',
    dosage: '10 mg · 1 tablet',
    time: '12:30 PM',
    status: 'upcoming',
    color: '#93B9A6',
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    dosage: '200 mg · 1 capsule',
    time: '8:00 PM',
    status: 'upcoming',
    color: '#B2A1C7',
  },
];
