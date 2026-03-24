'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployees } from '@/context/EmployeeContext';
import { useClients } from '@/context/ClientContext';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
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

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const router = useRouter();
  const { employees } = useEmployees();
  const { clients } = useClients();
  const [clientId, setClientId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(p => setClientId(p.id));
  }, [params]);

  const client = useMemo(() => {
    if (!clientId) return undefined;
    return clients.find(c => c.id === clientId);
  }, [clients, clientId]);

  const clientEmployees = useMemo(() => {
    if (!client) return [];
    return employees.filter(emp => emp.clientId === client.id || emp.client === client.name);
  }, [employees, client]);

  const activeEmployees = useMemo(() => {
    return clientEmployees.filter(emp => 'status' in emp && emp.status === 'Active').length;
  }, [clientEmployees]);

  const typeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    clientEmployees.forEach(emp => {
      dist[emp.type] = (dist[emp.type] || 0) + 1;
    });
    return dist;
  }, [clientEmployees]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Client Not Found</h2>
        <button
          onClick={() => router.push('/dashboard/clients')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/clients')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Clients
        </button>
        <button
          onClick={() => router.push(`/dashboard/clients?edit=${clientId}`)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Edit className="w-4 h-4" />
          Edit Client
        </button>
      </div>

      {/* Client Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold">
            <Building2 className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{client.name}</h1>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {clientEmployees.length} Employees
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {client.status}
              </span>
            </div>
          </div>
          {client.status === 'Active' && (
            <div className="px-4 py-2 bg-green-500 rounded-full font-semibold">
              Active
            </div>
          )}
          {client.status === 'Inactive' && (
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
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Employees</p>
              <p className="text-2xl font-bold">{clientEmployees.length}</p>
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
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">W2 Employees</p>
              <p className="text-2xl font-bold">{typeDistribution.W2 || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Offshore</p>
              <p className="text-2xl font-bold">{typeDistribution.Offshore || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Details */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Client Information
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {client.contactPerson && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Contact Person</p>
                <p className="font-medium">{client.contactPerson}</p>
              </div>
            </div>
          )}
          {client.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
            </div>
          )}
          {client.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
          )}
          {client.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Address</p>
                <p className="font-medium">{client.address}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Created Date</p>
              <p className="font-medium">{format(new Date(client.createdAt), 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Last Updated</p>
              <p className="font-medium">{format(new Date(client.updatedAt), 'MMMM d, yyyy')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Employees ({clientEmployees.length})
          </h2>
        </div>
        {clientEmployees.length > 0 ? (
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
                {clientEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
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
            <p className="mt-4 text-slate-500 dark:text-slate-400">No employees found for this client</p>
          </div>
        )}
      </div>
    </div>
  );
}
