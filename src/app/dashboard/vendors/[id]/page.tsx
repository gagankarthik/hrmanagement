'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployees } from '@/context/EmployeeContext';
import { useVendors } from '@/context/VendorContext';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Package,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface VendorDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function VendorDetailPage({ params }: VendorDetailPageProps) {
  const router = useRouter();
  const { employees } = useEmployees();
  const { vendors } = useVendors();
  const [vendorId, setVendorId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(p => setVendorId(p.id));
  }, [params]);

  const vendor = useMemo(() => {
    if (!vendorId) return undefined;
    return vendors.find(v => v.id === vendorId);
  }, [vendors, vendorId]);

  const vendorEmployees = useMemo(() => {
    if (!vendor) return [];
    return employees.filter(emp => emp.vendorId === vendor.id || emp.vendorName === vendor.name);
  }, [employees, vendor]);

  const activeEmployees = useMemo(() => {
    return vendorEmployees.filter(emp => 'status' in emp && emp.status === 'Active').length;
  }, [vendorEmployees]);

  const typeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    vendorEmployees.forEach(emp => {
      dist[emp.type] = (dist[emp.type] || 0) + 1;
    });
    return dist;
  }, [vendorEmployees]);

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Vendor Not Found</h2>
        <button
          onClick={() => router.push('/dashboard/vendors')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Back to Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/vendors')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Vendors
        </button>
        <button
          onClick={() => router.push(`/dashboard/vendors?edit=${vendorId}`)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Edit className="w-4 h-4" />
          Edit Vendor
        </button>
      </div>

      {/* Vendor Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold">
            <Package className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{vendor.name}</h1>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {vendorEmployees.length} Employees
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {vendor.status}
              </span>
            </div>
          </div>
          {vendor.status === 'Active' && (
            <div className="px-4 py-2 bg-green-500 rounded-full font-semibold">
              Active
            </div>
          )}
          {vendor.status === 'Inactive' && (
            <div className="px-4 py-2 bg-red-500 rounded-full font-semibold">
              Inactive
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Employees</p>
              <p className="text-2xl font-bold">{vendorEmployees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active</p>
              <p className="text-2xl font-bold">{activeEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Contract</p>
              <p className="text-2xl font-bold">{typeDistribution.Contract || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">1099</p>
              <p className="text-2xl font-bold">{typeDistribution['1099'] || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Details */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-indigo-600" />
          Vendor Information
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {vendor.contactPerson && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Contact Person</p>
                <p className="font-medium">{vendor.contactPerson}</p>
              </div>
            </div>
          )}
          {vendor.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                <p className="font-medium">{vendor.email}</p>
              </div>
            </div>
          )}
          {vendor.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                <p className="font-medium">{vendor.phone}</p>
              </div>
            </div>
          )}
          {vendor.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Address</p>
                <p className="font-medium">{vendor.address}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Created Date</p>
              <p className="font-medium">{format(new Date(vendor.createdAt), 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Last Updated</p>
              <p className="font-medium">{format(new Date(vendor.updatedAt), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Employees ({vendorEmployees.length})
          </h2>
        </div>
        {vendorEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Hire Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {vendorEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                          {employee.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{employee.name}</p>
                          {employee.personalEmail && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{employee.personalEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {employee.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {'status' in employee && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          employee.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {employee.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {format(new Date(employee.hireDate), 'MM/dd/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-slate-500 dark:text-slate-400">No employees found for this vendor</p>
          </div>
        )}
      </div>
    </div>
  );
}
