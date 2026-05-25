// Attendance status values
export type AttendanceStatus = 'Present' | 'Absent' | 'Remote' | 'Half-day' | 'Leave';

// Attendance entity interface
export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// Attendance form data (for creation/editing)
export interface AttendanceFormData {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
}
