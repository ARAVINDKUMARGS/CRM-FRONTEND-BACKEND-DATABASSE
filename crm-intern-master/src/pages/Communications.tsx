import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Mail, Phone, FileText, MessageSquare, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { Communication, User, Lead, Contact, Account, Deal } from '../types';
import Modal from '../components/Modal';
import { api } from '../services/api';

const Communications = () => {
  const { user } = useAuth();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'Email' as Communication['type'],
    subject: '',
    content: '',
    relatedToType: 'Lead' as 'Lead' | 'Contact' | 'Deal' | 'Account',
    relatedToId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commsData, usersData, leadsData, contactsData, accountsData, dealsData] = await Promise.all([
        api.getCommunications(),
        api.getUsers(),
        api.getLeads(),
        api.getContacts(),
        api.getAccounts(),
        api.getDeals()
      ]);
      setCommunications(commsData);
      setUsers(usersData);
      setLeads(leadsData);
      setContacts(contactsData);
      setAccounts(accountsData);
      setDeals(dealsData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching communications data:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const types: Communication['type'][] = ['Email', 'Call', 'Note', 'Document'];

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch =
      comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || comm.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      type: 'Email',
      subject: '',
      content: '',
      relatedToType: 'Lead',
      relatedToId: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (comm: Communication) => {
    setEditingId(comm.id);
    setFormData({
      type: comm.type,
      subject: comm.subject,
      content: comm.content,
      relatedToType: comm.relatedTo.type,
      relatedToId: comm.relatedTo.id
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this communication?')) {
      try {
        await api.deleteCommunication(id);
        setCommunications(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        alert('Failed to delete communication');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user) {
        alert('You must be logged in to create a communication');
        return;
      }

      if (!formData.relatedToId) {
        alert('Please select a related entity');
        return;
      }

      const commonData = {
        type: formData.type,
        subject: formData.subject,
        content: formData.content,
        relatedTo: {
          type: formData.relatedToType,
          id: formData.relatedToId
        }
      };

      if (editingId) {
        // Update
        const updated = await api.updateCommunication(editingId, commonData);
        setCommunications(prev => prev.map(c => c.id === editingId ? updated : c));
      } else {
        // Create
        const createdBy = user.id;
        const newCommData = {
          ...commonData,
          createdBy
        };
        const newComm = await api.createCommunication(newCommData);
        setCommunications([newComm, ...communications]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving communication:', err);
      if (err.message && err.message.includes('invalid input syntax for type uuid')) {
        alert('Invalid ID format. Please ensure you selected a valid record.');
      } else {
        alert('Failed to save communication');
      }
    }
  };

  const getTypeIcon = (type: Communication['type']) => {
    switch (type) {
      case 'Email': return <Mail className="w-5 h-5" />;
      case 'Call': return <Phone className="w-5 h-5" />;
      case 'Note': return <MessageSquare className="w-5 h-5" />;
      case 'Document': return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Communication['type']) => {
    switch (type) {
      case 'Email': return 'bg-blue-100 text-blue-800';
      case 'Call': return 'bg-green-100 text-green-800';
      case 'Note': return 'bg-yellow-100 text-yellow-800';
      case 'Document': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelatedOptions = () => {
    switch (formData.relatedToType) {
      case 'Lead': return leads.map(l => ({ id: l.id, name: l.name }));
      case 'Contact': return contacts.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }));
      case 'Account': return accounts.map(a => ({ id: a.id, name: a.name }));
      case 'Deal': return deals.map(d => ({ id: d.id, name: d.title }));
      default: return [];
    }
  };

  if (loading && communications.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600 mt-1">Track all customer interactions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={handleAdd} className="btn-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Log Communication
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="All">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Communications Timeline */}
      <div className="space-y-4">
        {filteredCommunications.map((comm) => {
          const createdByUser = users.find(u => u.id === comm.createdBy);
          let relatedName = 'Unknown';
          if (comm.relatedTo.type === 'Lead') relatedName = leads.find(l => l.id === comm.relatedTo.id)?.name || 'Unknown Lead';
          else if (comm.relatedTo.type === 'Contact') {
            const c = contacts.find(c => c.id === comm.relatedTo.id);
            relatedName = c ? `${c.firstName} ${c.lastName}` : 'Unknown Contact';
          }
          else if (comm.relatedTo.type === 'Account') relatedName = accounts.find(a => a.id === comm.relatedTo.id)?.name || 'Unknown Account';
          else if (comm.relatedTo.type === 'Deal') relatedName = deals.find(d => d.id === comm.relatedTo.id)?.title || 'Unknown Deal';

          const canEdit = user && (user.role === 'System Admin' || user.id === comm.createdBy);

          return (
            <div key={comm.id} className="card group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getTypeColor(comm.type)}`}>
                  {getTypeIcon(comm.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{comm.subject}</h3>
                      <p className="text-sm text-gray-600">
                        {createdByUser?.name || 'Unknown User'} • {new Date(comm.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(comm.type)}`}>
                        {comm.type}
                      </span>
                      {canEdit && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(comm)}
                            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(comm.id, e)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{comm.content}</p>
                  <div className="text-sm text-gray-500">
                    Related to: <span className="font-medium">{comm.relatedTo.type}</span> - {relatedName}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCommunications.length === 0 && !loading && (
        <div className="card text-center py-12 text-gray-500">
          No communications found. Log your first communication to get started.
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Communication" : "Log Communication"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Communication['type'] })}
                className="input-field"
              >
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Related To Type</label>
              <select
                value={formData.relatedToType}
                onChange={(e) => setFormData({ ...formData, relatedToType: e.target.value as any, relatedToId: '' })}
                className="input-field"
              >
                <option value="Lead">Lead</option>
                <option value="Contact">Contact</option>
                <option value="Deal">Deal</option>
                <option value="Account">Account</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Related To Record *</label>
              <select
                required
                value={formData.relatedToId}
                onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                className="input-field"
              >
                <option value="">Select {formData.relatedToType}</option>
                {getRelatedOptions().map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="input-field"
              rows={5}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? 'Save Changes' : 'Log Communication'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Communications;
