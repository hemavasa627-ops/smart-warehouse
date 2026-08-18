import React, { useState } from 'react';
import Layout from './components/Layout';
import ActiveOrders from './components/ActiveOrders';
import InventoryHealth from './components/InventoryHealth';
import ControlTower from './components/ControlTower';

function App() {
  const [activeTab, setActiveTab] = useState('active-orders');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'active-orders' && <ActiveOrders />}
      {activeTab === 'inventory-health' && <InventoryHealth />}
      {activeTab === 'control-tower' && <ControlTower />}
    </Layout>
  );
}

export default App;
