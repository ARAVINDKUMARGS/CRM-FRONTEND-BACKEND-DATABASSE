import { useMemo, useState, useEffect } from 'react';
import { Edit2, Search, Shield, ToggleLeft, ToggleRight, RefreshCw, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { User, UserRole } from '../types';
import { api } from '../services/api';

const allRoles: UserRole[] = [
  'System Admin',
  'Sales Manager',
  'Sales Executive',
  'Marketing Executive',
  'Support Executive',
  'Customer',
];

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Sales Executive' as UserRole,
    enabled: true,
    password: ''
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, enabled: u.enabled, password: '' });
    setIsModalOpen(true);
  };

  const toggleEnabled = async (user: User) => {
    try {
      const updated = await api.updateUser(user.id, { enabled: !user.enabled });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.adminDeleteUser(user.authId || user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      alert('User deleted successfully.');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + (err.message || 'Unknown error'));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editing) {
      try {
        const updated = await api.updateUser(editing.id, {
          role: form.role,
          enabled: form.enabled
          // Name and email updates might require different auth handling, 
          // ignoring them for now or assuming they are just db updates
        });

        if (form.password) {
          await api.adminUpdateUserPassword(editing.id, form.password);
          alert('Password updated.');
        }

        setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...updated } : u)));
        setIsModalOpen(false);
      } catch (err) {
        alert('Failed to update user');
      }
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User & Role Management</h1>
          <p className="text-gray-600 mt-1">Manage users, assign roles, and control access.</p>
        </div>
        <button onClick={() => setIsInviteModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Add User
        </button>
        <button onClick={fetchUsers} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Refresh">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, role…"
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            Admin-only module
          </div>
        </div>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-3 rounded">{error}</div>}

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{u.name}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                </td>
                <td className="py-3 px-4 text-gray-700">{u.role}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${u.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {u.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {!u.authId && (
                      <span className="text-xs text-orange-600 font-medium flex items-center">
                        ⚠ Pending Sign Up
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleEnabled(u)}
                      className={`p-2 rounded ${u.enabled ? 'text-gray-700 hover:bg-gray-100' : 'text-green-700 hover:bg-green-50'
                        }`}
                      title={u.enabled ? 'Disable user' : 'Enable user'}
                    >
                      {u.enabled ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No users found.</div>}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit User Access"
        size="md"
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              disabled
              value={form.name}
              className="input-field bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              disabled
              value={form.email}
              className="input-field bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <select
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="input-field"
              >
                {allRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={form.enabled ? 'enabled' : 'disabled'}
                onChange={(e) => setForm({ ...form, enabled: e.target.value === 'enabled' })}
                className="input-field"
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Change Password</h3>
              <input
                type="password"
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="New password (leave empty to keep current)"
                minLength={6}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Add New User"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api.adminCreateUser({
              email: form.email,
              password: form.password,
              name: form.name,
              role: form.role
            });

            // Refresh list
            fetchUsers();
            setIsInviteModalOpen(false);
            setForm({ name: '', email: '', role: 'Sales Executive', enabled: true, password: '' });
            alert('User created successfully with password.');
          } catch (err: any) {
            console.error(err);
            alert('Failed to create user. ' + (err.message || ''));
          }
        }} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mb-4">
            Creating a user here will immediately create their account with the password you provide.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field"
              placeholder="e.g. john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input-field"
              placeholder="Set initial password"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
              className="input-field"
            >
              {allRoles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
