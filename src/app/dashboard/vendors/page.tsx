'use client';

import React, { useState } from 'react';
import { Package, Plus, Pencil, Trash2, Users } from 'lucide-react';
import VendorModal from '@/components/dashboard/VendorModal';
import DeleteConfirmModal from '@/components/dashboard/DeleteConfirmModal';
import { useVendors } from '@/context/VendorContext';
import { useEmployees } from '@/context/EmployeeContext';
import { Vendor } from '@/types/vendor';

export default function VendorsPage() {
  const { vendors, isLoading, deleteVendor } = useVendors();
  const { employees } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    vendor?: Vendor;
  }>({
    isOpen: false,
    mode: 'create',
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    vendor: Vendor | null;
  }>({
    isOpen: false,
    vendor: null,
  });

  // Get employee count for each vendor
  const getEmployeeCount = (vendorId: string): number => {
    return employees.filter((emp) => emp.vendorId === vendorId || emp.vendorName === vendors.find(v => v.id === vendorId)?.name).length;
  };

  // Filter vendors based on search
  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (vendor: Vendor) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      vendor,
    });
  };

  const handleDelete = (vendor: Vendor) => {
    setDeleteModal({
      isOpen: true,
      vendor,
    });
  };

  const confirmDelete = async () => {
    if (deleteModal.vendor) {
      try {
        await deleteVendor(deleteModal.vendor.id);
        setDeleteModal({ isOpen: false, vendor: null });
      } catch (error) {
        console.error('Error deleting vendor:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-600" />
            Vendors
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your vendor partners
          </p>
        </div>
        <button
          onClick={() => setModalState({ isOpen: true, mode: 'create' })}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Vendor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Vendors</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{vendors.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Vendors</p>
          <p className="text-2xl font-bold text-green-600">{vendors.filter(v => v.status === 'Active').length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Inactive Vendors</p>
          <p className="text-2xl font-bold text-gray-600">{vendors.filter(v => v.status === 'Inactive').length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <input
          type="text"
          placeholder="Search vendors by name, contact person, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Vendor List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredVendors.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No vendors found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first vendor'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setModalState({ isOpen: true, mode: 'create' })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Vendor
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Vendor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">{vendor.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {vendor.contactPerson || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {vendor.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {vendor.phone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                      <Users className="w-3 h-3" />
                      {getEmployeeCount(vendor.id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      vendor.status === 'Active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <VendorModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        mode={modalState.mode}
        vendor={modalState.vendor}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, vendor: null })}
        onConfirm={confirmDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete ${deleteModal.vendor?.name}? This action cannot be undone.`}
      />
    </div>
  );
}
