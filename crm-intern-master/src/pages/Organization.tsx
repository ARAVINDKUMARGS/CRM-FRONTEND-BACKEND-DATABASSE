import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Settings, Trash2 } from 'lucide-react';
import { api } from '../services/api';

const Organization = () => {
  const [settings, setSettings] = useState({
    companyName: '',
    currency: 'USD',
    timezone: 'UTC',
    workingHours: { start: '09:00', end: '18:00' },
    holidays: [] as string[]
  });
  const [newHoliday, setNewHoliday] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getOrganizationSettings();
        if (data) {
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const currencies = useMemo(() => ['USD', 'EUR', 'GBP', 'INR', 'AED', 'JPY'], []);
  const timezones = useMemo(() => ['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Dubai'], []);

  const save = async () => {
    try {
      setLoading(true);
      await api.updateOrganizationSettings(settings);
      setSavedMsg('Saved successfully.');
      window.setTimeout(() => setSavedMsg(''), 1500);
    } catch (err) {
      console.error('Failed to save settings', err);
      setSavedMsg('Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const addHoliday = () => {
    if (!newHoliday) return;
    if (settings.holidays.includes(newHoliday)) return;
    setSettings((s) => ({ ...s, holidays: [...s.holidays, newHoliday].sort() }));
    setNewHoliday('');
  };

  const removeHoliday = (date: string) => {
    setSettings((s) => ({ ...s, holidays: s.holidays.filter((h) => h !== date) }));
  };

  if (loading && !settings.companyName) {
    return <div>Loading...</div>; // Simple loading state
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organization & System Setup</h1>
          <p className="text-gray-600 mt-1">Company info, currency, timezone, working hours, and holidays.</p>
        </div>
        <button onClick={save} disabled={loading} className="btn-primary flex items-center">
          <Save className="w-5 h-5 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">General</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                value={settings.companyName}
                onChange={(e) => setSettings((s) => ({ ...s, companyName: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))}
                className="input-field"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
                className="input-field"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours (Start)</label>
              <input
                type="time"
                value={settings.workingHours.start}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, workingHours: { ...s.workingHours, start: e.target.value } }))
                }
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours (End)</label>
              <input
                type="time"
                value={settings.workingHours.end}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, workingHours: { ...s.workingHours, end: e.target.value } }))
                }
                className="input-field"
              />
            </div>
          </div>

          {savedMsg && <p className={`text-sm mt-4 ${savedMsg.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>{savedMsg}</p>}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Holidays</h2>

          <div className="flex gap-2 mb-4">
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              className="input-field"
            />
            <button type="button" onClick={addHoliday} className="btn-primary px-3">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {settings.holidays.map((d) => (
              <div key={d} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-800">{d}</span>
                <button
                  onClick={() => removeHoliday(d)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {settings.holidays.length === 0 && <p className="text-sm text-gray-500">No holidays configured.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Organization;
