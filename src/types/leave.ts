// Leave entity types
import { UploadedDoc } from './uploads';

export type LeaveType = 'Sick' | 'Casual' | 'PTO' | 'Long Leave' | 'Unpaid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export const LEAVE_TYPES: LeaveType[] = ['Sick', 'Casual', 'PTO', 'Long Leave', 'Unpaid'];

// Leave entity interface
export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: LeaveStatus;
  appliedDate: string;
  documents?: UploadedDoc[];
  createdAt: string;
  updatedAt: string;
}

// Leave form data (for creation/editing)
export interface LeaveFormData {
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  documents?: UploadedDoc[];
}
