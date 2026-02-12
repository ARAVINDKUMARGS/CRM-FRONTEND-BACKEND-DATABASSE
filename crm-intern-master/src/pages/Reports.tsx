import { useState, useEffect } from 'react';
import { Download, FileText, TrendingUp, Users, DollarSign, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Lead, Deal, Campaign } from '../types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Reports = () => {
  const [reportType, setReportType] = useState<'sales' | 'leads' | 'deals' | 'campaigns'>('sales');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsData, dealsData, campaignsData] = await Promise.all([
        api.getLeads(),
        api.getDeals(),
        api.getCampaigns()
      ]);
      setLeads(leadsData);
      setDeals(dealsData);
      setCampaigns(campaignsData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching report data:', err);
      setError('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // --- Data Processing for Charts ---

  // Sales Report Data (Group deals by month)
  const processSalesData = () => {
    const data: Record<string, { revenue: number, deals: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    deals.forEach(deal => {
      if (deal.stage === 'Closed Won' && deal.expectedCloseDate) {
        const date = new Date(deal.expectedCloseDate);
        const month = months[date.getMonth()];
        if (!data[month]) {
          data[month] = { revenue: 0, deals: 0 };
        }
        data[month].revenue += deal.value;
        data[month].deals += 1;
      }
    });

    // Convert to array and sort by month index
    return Object.entries(data).map(([month, stats]) => ({
      month,
      revenue: stats.revenue,
      deals: stats.deals
    })).sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
  };

  const salesData = processSalesData();

  // Leads Report Data
  const leadsBySource = Object.entries(leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));

  const leadsByStatus = Object.entries(leads.reduce((acc, lead) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));


  // Deals Pipeline Data
  const dealsByStage = Object.entries(deals.reduce((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)).map(([name, value]) => ({ name, value }));

  // Sort stages logically
  const stageOrder = ['Prospecting', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  dealsByStage.sort((a, b) => stageOrder.indexOf(a.name) - stageOrder.indexOf(b.name));

  const handleExport = (format: 'excel' | 'pdf') => {
    // Mock export functionality
    alert(`Exporting ${reportType} report as ${format.toUpperCase()}...`);
  };

  const totalRevenue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = deals.filter(d => d.stage === 'Closed Won');
  const wonRevenue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const conversionRate = leads.length > 0 ? (wonDeals.length / leads.length) * 100 : 0;

  if (loading && leads.length === 0 && deals.length === 0 && campaigns.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full" title="Refresh">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="btn-secondary flex items-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="btn-secondary flex items-center"
          >
            <FileText className="w-5 h-5 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
          <span>{error}</span>
        </div>
      )}

      {/* Report Type Selector */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {(['sales', 'leads', 'deals', 'campaigns'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${reportType === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Report
            </button>
          ))}
        </div>
      </div>

      {/* Sales Report */}
      {reportType === 'sales' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${(totalRevenue / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Won Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${(wonRevenue / 1000).toFixed(0)}K</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
                </div>
                <FileText className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Sales Performance (Closed Won)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={salesData.length > 0 ? salesData : [{ month: 'No Data', revenue: 0, deals: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Revenue ($)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="deals"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Deals"
                />
              </LineChart>
            </ResponsiveContainer>
            {salesData.length === 0 && <p className="text-center text-gray-500 mt-2">No closed won deals found yet.</p>}
          </div>
        </>
      )}

      {/* Leads Report */}
      {reportType === 'leads' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                </div>
                <Users className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Qualified Leads</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leads.filter(l => l.status === 'Qualified').length}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lead Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${leads.reduce((sum, l) => sum + (l.value || 0), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads by Source</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadsBySource.length > 0 ? leadsBySource : [{ name: 'No Data', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadsBySource.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    {leadsBySource.length === 0 && <Cell fill="#e5e7eb" />}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadsByStatus.length > 0 ? leadsByStatus : [{ name: 'No Data', value: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Deals Report */}
      {reportType === 'deals' && (
        <>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Pipeline by Stage</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dealsByStage.length > 0 ? dealsByStage : [{ name: 'No Data', value: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" name="Deals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Campaigns Report */}
      {reportType === 'campaigns' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Leads Generated</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {campaigns.reduce((sum, c) => sum + c.leadsGenerated, 0)}
                  </p>
                </div>
                <Users className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {campaigns.length > 0
                      ? (campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length).toFixed(1)
                      : '0.0'}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={campaigns.length > 0 ? campaigns.map(c => ({ name: c.name, leads: c.leadsGenerated, conversion: c.conversionRate })) : [{ name: 'No Data', leads: 0, conversion: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="leads" fill="#3b82f6" name="Leads Generated" />
                <Bar yAxisId="right" dataKey="conversion" fill="#10b981" name="Conversion Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
