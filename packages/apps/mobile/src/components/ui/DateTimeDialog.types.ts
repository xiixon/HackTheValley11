export type DateTimeDialogProps = {
  mode: 'date' | 'time';
  value: Date;
  onConfirm: (value: Date) => void;
  onCancel: () => void;
};
