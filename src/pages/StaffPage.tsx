import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Staff } from '../types';
import { Plus, Trash2, Edit2, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    fetchStaff();

    // Subscribe to changes
    const channel = supabase
      .channel('staff-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, () => {
        fetchStaff();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching staff:', error.message);
    } else {
      setStaff(data as Staff[]);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setName('');
    setStaffId('');
    setRole('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Staff) => {
    setEditingStaff(s);
    setName(s.name);
    setStaffId(s.staffId);
    setRole(s.role || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staff.length >= 15 && !editingStaff) {
      alert("Maximum 15 staff members allowed.");
      return;
    }

    const payload = {
      name,
      staffId,
      role,
    };

    try {
      if (editingStaff) {
        const { error } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', editingStaff.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('staff')
          .insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving staff:", error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);
      if (error) console.error("Error deleting staff:", error.message);
    }
  };

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staffId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage your {staff.length}/15 office team members</p>
        </div>
        <button
          onClick={openAddModal}
          disabled={staff.length >= 15}
          className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Plus size={20} />
          Add Staff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-bottom border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder-gray-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-gray-900">{s.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono tracking-tight">{s.staffId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.role || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden shadow-gray-900/10"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  {editingStaff ? 'Edit Staff Member' : 'New Staff Member'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Staff ID</label>
                  <input
                    required
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all font-mono"
                    placeholder="EMP001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Role (Optional)</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                    placeholder="Developer"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all active:scale-[0.98]"
                  >
                    {editingStaff ? 'Update Member' : 'Create Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
