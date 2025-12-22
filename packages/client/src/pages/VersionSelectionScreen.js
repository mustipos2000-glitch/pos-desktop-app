import { useNavigate } from 'react-router-dom';
import { useVersion } from '../context/VersionContext';

const VersionSelectionScreen = () => {
  const navigate = useNavigate();
  const { changeVersion } = useVersion();

  // Check if we should show only mosque version (you can modify this logic)
  const showOnlyMosque = window.location.search.includes('mosque-only');

  const allVersions = [
    {
      id: 'horeca',
      name: 'Horeca POS',
      icon: '🍽️'
    },
    {
      id: 'retail',
      name: 'Retail POS',
      icon: '🛒'
    },
    {
      id: 'kiosk',
      name: 'Kiosk POS',
      icon: '🖥️'
    },
    {
      id: 'mosque',
      name: 'Kiosk Mosque',
      icon: '🕌'
    }
  ];

  // Filter versions based on context
  const versions = showOnlyMosque 
    ? allVersions.filter(v => v.id === 'mosque')
    : allVersions;

  const handleVersionSelect = (versionId) => {
    changeVersion(versionId);
    
    // Route to appropriate app based on version
    if (versionId === 'mosque') {
      navigate('/mosque');
    } else {
      navigate('/pos');
    }
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col items-center justify-center">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-pos-text-primary mb-4">
          POS System
        </h1>
        <p className="text-xl text-pos-text-secondary">
          Select Module
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-8">
        {versions.map((version) => (
          <div
            key={version.id}
            onClick={() => handleVersionSelect(version.id)}
            className="card card-hover bg-pos-bg-secondary p-8 flex flex-col items-center gap-4 min-w-[180px] cursor-pointer"
          >
            <div className="text-7xl mb-2">{version.icon}</div>
            <h2 className="text-xl font-semibold text-pos-text-primary text-center">
              {version.name}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VersionSelectionScreen;
