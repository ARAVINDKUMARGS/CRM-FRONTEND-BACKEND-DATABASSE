import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Lead, Deal, Task } from '../types';
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
import { TrendingUp, Users, DollarSign, CheckCircle } from 'lucide-react';
import QuickAddMenu from '../components/QuickAddMenu';

const Dashboard = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user) return null;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [leadsData, dealsData, tasksData] = await Promise.all([
          api.getLeads(),
          api.getDeals(),
          api.getTasks()
        ]);
        setLeads(leadsData);
        setDeals(dealsData);
        setTasks(tasksData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate KPIs
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'Qualified').length;
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  // Pending tasks - filter logic may need adjustment based on how "Pending" is defined vs "In Progress"
  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress');

  // Chart data construction

  // Lead Status Distribution
  const leadStatusData = [
    { name: 'New', value: leads.filter(l => l.status === 'New').length },
    { name: 'Contacted', value: leads.filter(l => l.status === 'Contacted').length },
    { name: 'Qualified', value: leads.filter(l => l.status === 'Qualified').length },
    { name: 'Lost', value: leads.filter(l => l.status === 'Lost').length }
  ].filter(item => item.value > 0);

  // Deal Pipeline by Stage
  const dealStageData = [
    { name: 'Prospecting', value: deals.filter(d => d.stage === 'Prospecting').length },
    { name: 'Proposal', value: deals.filter(d => d.stage === 'Proposal').length },
    { name: 'Negotiation', value: deals.filter(d => d.stage === 'Negotiation').length },
    { name: 'Closed Won', value: deals.filter(d => d.stage === 'Closed Won').length },
    { name: 'Closed Lost', value: deals.filter(d => d.stage === 'Closed Lost').length }
  ].filter(item => item.value > 0);

  // Monthly Revenue Calculation (based on Closed Won deals expected close date)
  const processMonthlyRevenue = () => {
    const data: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    deals.forEach(deal => {
      if (deal.stage === 'Closed Won' && deal.expectedCloseDate) {
        const date = new Date(deal.expectedCloseDate);
        const month = months[date.getMonth()];
        data[month] = (data[month] || 0) + deal.value;
      }
    });

    return Object.entries(data).map(([month, revenue]) => ({
      month,
      revenue
    })).sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
  };

  const monthlyRevenue = processMonthlyRevenue();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const kpiCards = [
    {
      title: 'Total Leads',
      value: totalLeads,
      change: 'Real-time',
      icon: <Users className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Qualified Leads',
      value: qualifiedLeads,
      change: 'Real-time',
      icon: <CheckCircle className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Deals',
      value: totalDeals,
      change: 'Real-time',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Pipeline Value',
      value: `$${(totalValue / 1000).toFixed(0)}K`,
      change: 'Real-time',
      icon: <DollarSign className="w-8 h-8" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ];

  if (loading && leads.length === 0 && deals.length === 0 && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {kpi.change}
                </p>
              </div>
              <div className={`${kpi.bgColor} ${kpi.color} p-4 rounded-lg`}>
                {kpi.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue (Closed Won)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue.length > 0 ? monthlyRevenue : [{ month: 'No Data', revenue: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Status Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadStatusData.length > 0 ? leadStatusData : [{ name: 'No Data', value: 1 }]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {leadStatusData.length > 0 ? leadStatusData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                )) : <Cell fill="#e5e7eb" />}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deal Pipeline Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Pipeline by Stage</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dealStageData.length > 0 ? dealStageData : [{ name: 'No Data', value: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" name="Deals" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tasks</h3>
          <div className="space-y-3">
            {pendingTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-600">{task.type} • Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-800' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                  }`}>
                  {task.priority}
                </span>
              </div>
            ))}
            {pendingTasks.length === 0 && <p className="text-gray-500">No pending tasks.</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="font-medium text-gray-900 mb-1">High-Value Opportunity</p>
              <p className="text-sm text-gray-600">
                Check "Closed Won" deals to identify patterns for success.
              </p>
            </div>
            {qualifiedLeads > 0 && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <p className="font-medium text-gray-900 mb-1">Conversion Opportunity</p>
                <p className="text-sm text-gray-600">
                  You have {qualifiedLeads} qualified leads ready for follow-up.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <QuickAddMenu />
    </div>
  );
};

export default Dashboard;
