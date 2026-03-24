'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { useVendors } from '@/context/VendorContext';
import { format } from 'date-fns';
import {
  ArrowLeft,
  User,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Package,
  FileText,
  Shield,
  Globe,
  CreditCard,
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Cake,
  Award,
} from 'lucide-react';

interface EmployeeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  const router = useRouter();
  const { employees, deleteEmployee, isLoading } = useEmployees();
  const { clients } = useClients();
  const { vendors } = useVendors();
  const [employeeId, setEmployeeId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(p => setEmployeeId(p.id));
  }, [params]);

  const employee = useMemo(() => {
    if (!employeeId) return undefined;
    return employees.find(e => e.id === employeeId);
  }, [employees, employeeId]);

  const clientName = useMemo(() => {
    if (!employee) return '';
    return employee.clientId
      ? clients.find(c => c.id === employee.clientId)?.name || employee.client
      : employee.client || 'N/A';
  }, [employee, clients]);

  const vendorName = useMemo(() => {
    if (!employee) return '';
    return employee.vendorId
      ? vendors.find(v => v.id === employee.vendorId)?.name || employee.vendorName
      : employee.vendorName || 'N/A';
  }, [employee, vendors]);

  const age = useMemo(() => {
    if (!employee?.dob) return null;
    const today = new Date();
    const birthDate = new Date(employee.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [employee]);

  const yearsOfService = useMemo(() => {
    if (!employee?.hireDate) return null;
    const today = new Date();
    const hireDate = new Date(employee.hireDate);
    let years = today.getFullYear() - hireDate.getFullYear();
    const monthDiff = today.getMonth() - hireDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hireDate.getDate())) {
      years--;
    }
    return years;
  }, [employee]);

  const nextBirthday = useMemo(() => {
    if (!employee?.dob) return null;
    const today = new Date();
    const birthDate = new Date(employee.dob);
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }
    return thisYearBirthday;
  }, [employee]);

  const nextAnniversary = useMemo(() => {
    if (!employee?.hireDate) return null;
    const today = new Date();
    const hireDate = new Date(employee.hireDate);
    const thisYearAnniversary = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate());
    if (thisYearAnniversary < today) {
      thisYearAnniversary.setFullYear(today.getFullYear() + 1);
    }
    return thisYearAnniversary;
  }, [employee]);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await deleteEmployee(employeeId);
      router.push('/dashboard/employees');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Employee Not Found</h2>
        <button
          onClick={() => router.push('/dashboard/employees')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/employees')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Employees
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold">
            {employee.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{employee.name}</h1>
            <p className="text-lg opacity-90 mb-1">{employee.position}</p>
            <div className="flex items-center gap-4 text-sm opacity-80">
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {employee.type}
              </span>
              {'status' in employee && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {employee.status}
                </span>
              )}
            </div>
          </div>
          {'status' in employee && (
            <>
              {employee.status === 'Active' && (
                <div className="px-4 py-2 bg-green-500 rounded-full font-semibold">
                  Active
                </div>
              )}
              {employee.status === 'Terminated' && (
                <div className="px-4 py-2 bg-red-500 rounded-full font-semibold">
                  Terminated
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {age !== null && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <Cake className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Age</p>
                <p className="text-2xl font-bold">{age}</p>
              </div>
            </div>
          </div>
        )}
        {yearsOfService !== null && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Years of Service</p>
                <p className="text-2xl font-bold">{yearsOfService}</p>
              </div>
            </div>
          </div>
        )}
        {nextBirthday && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Next Birthday</p>
                <p className="text-lg font-semibold">{format(nextBirthday, 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        )}
        {nextAnniversary && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Next Anniversary</p>
                <p className="text-lg font-semibold">{format(nextAnniversary, 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Details Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-indigo-600" />
            Personal Information
          </h2>
          <div className="space-y-3">
            {employee.personalEmail && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                  <p className="font-medium">{employee.personalEmail}</p>
                </div>
              </div>
            )}
            {employee.contactNo && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                  <p className="font-medium">{employee.contactNo}</p>
                </div>
              </div>
            )}
            {employee.dob && (
              <div className="flex items-start gap-3">
                <Cake className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Date of Birth</p>
                  <p className="font-medium">{format(new Date(employee.dob), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            )}
            {employee.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Address</p>
                  <p className="font-medium">{employee.address}</p>
                </div>
              </div>
            )}
            {employee.city && (
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">City, State</p>
                  <p className="font-medium">{employee.city}{employee.state && `, ${employee.state}`}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Employment Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Employee Type</p>
                <p className="font-medium">{employee.type}</p>
              </div>
            </div>
            {employee.hireDate && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Hire Date</p>
                  <p className="font-medium">{format(new Date(employee.hireDate), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            )}
            {'status' in employee && (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                  <p className="font-medium">{employee.status}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Client</p>
                <p className="font-medium">{clientName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Vendor</p>
                <p className="font-medium">{vendorName}</p>
              </div>
            </div>
            {('salary' in employee && employee.salary) && (
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Salary</p>
                  <p className="font-medium">${employee.salary.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Work Authorization (Not for Offshore) */}
        {employee.type !== 'Offshore' && 'workAuthorization' in employee && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-indigo-600" />
              Work Authorization
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Type</p>
                  <p className="font-medium">{employee.workAuthorization}</p>
                </div>
              </div>
              {'expiryDate' in employee && employee.expiryDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Expiry Date</p>
                    <p className="font-medium">{format(new Date(employee.expiryDate), 'MMMM d, yyyy')}</p>
                    {new Date(employee.expiryDate) < new Date() && (
                      <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Expired
                      </span>
                    )}
                    {new Date(employee.expiryDate) >= new Date() && new Date(employee.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                      <span className="inline-block mt-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                        Expiring Soon
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tax & Provident Fund (Offshore Only) */}
        {employee.type === 'Offshore' && 'panNumber' in employee && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Tax & Provident Fund
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Aadhar Number</p>
                  <p className="font-medium">{employee.aadharNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">PAN Number</p>
                  <p className="font-medium">{employee.panNumber}</p>
                </div>
              </div>
              {employee.pfNumber && (
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">PF Number</p>
                    <p className="font-medium">{employee.pfNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Timestamps */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border">
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <div>
            <span className="font-medium">Created:</span> {format(new Date(employee.createdAt), 'MMMM d, yyyy h:mm a')}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {format(new Date(employee.updatedAt), 'MMMM d, yyyy h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
}
