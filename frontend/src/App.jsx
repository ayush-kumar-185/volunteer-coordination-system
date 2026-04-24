import { useState } from 'react';
import IntakeForm from './components/IntakeForm';
import NeedsMap from './components/NeedsMap';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshMap = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        <div className="mb-10 text-center w-full">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            Community Need <span className="text-blue-600">Intake</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Help us understand and prioritize local issues in your neighborhood. Your report makes a difference.
          </p>
        </div>
        
        <IntakeForm refreshMap={handleRefreshMap} />
      </div>

      <div className="max-w-4xl mx-auto mt-12 bg-white rounded-xl shadow overflow-hidden h-[500px]">
        <NeedsMap refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}

export default App;
