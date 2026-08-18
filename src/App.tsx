import React, { useState } from 'react';
import Layout from './components/Layout';
import DashboardOverview from './components/DashboardOverview';
import Analytics from './components/Analytics';
import InventoryTable from './components/InventoryTable';
import History from './components/History';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <DashboardOverview />}
      {activeTab === 'inventory' && <InventoryTable />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'history' && <History />}
    </Layout>
  );
}

export default App;