import { useState } from 'react';
import { KeyRound, ShieldCheck, FileSearch, Lock,} from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  ip: string;
  details: string;
};

// Mock audit logs for display (real implementation requires backend logging table)
const mockAudit: AuditEvent[] = [
  { id: '1', at: '2026-01-23T10:12:00Z', actor: 'John Admin', action: 'User role updated', ip: '10.0.0.12', details: 'Updated user role to Manager' },
  { id: '2', at: '2026-01-23T09:41:00Z', actor: 'Sarah Manager', action: 'Report exported', ip: '10.0.0.8', details: 'Exported Monthly Sales Report' },
  { id: '3', at: '2026-01-22T18:05:00Z', actor: 'Mike Sales', action: 'Deal stage changed', ip: '10.0.0.21', details: 'Moved deal to Closed Won' },
];

const Security = () => {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security & Access Control</h1>
          <p className="text-gray-600 mt-1">Manage your security settings and view audit logs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            {message.text && (
              <div className={`text-sm p-2 rounded ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message.text}
              </div>
            )}

            <button
              onClick={updatePassword}
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-gray-700">Enable 2FA for your account.</p>
              <p className="text-sm text-gray-500 mt-1">Enhance your account security.</p>
            </div>
            <button
              onClick={() => setTwoFAEnabled((v) => !v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${twoFAEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}
            >
              {twoFAEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-700">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Recovery codes</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Generate recovery codes in case you lose access to your 2FA device. (Feature coming soon)
            </p>
          </div>
        </div>

        <div className="card lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <FileSearch className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Audit Logs (Sample)</h2>
          </div>
          <div className="space-y-3">
            {mockAudit.map((e) => (
              <div key={e.id} className="p-3 rounded-lg bg-gray-50">
                <p className="text-sm font-semibold text-gray-900">{e.action}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {e.actor} • {new Date(e.at).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">{e.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
