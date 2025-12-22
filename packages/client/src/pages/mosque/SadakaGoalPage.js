import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  KioskLayout, 
  KioskHeader, 
  KioskCard, 
  KioskButton, 
  KioskInfoPanel 
} from '../../components/mosque';

const SadakaGoalPage = () => {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    loadSelectedGoal();
  }, []);

  const loadSelectedGoal = () => {
    const storedGoal = localStorage.getItem('sadakaGoal');
    if (storedGoal) {
      try {
        const goal = JSON.parse(storedGoal);
        setSelectedGoal(goal);
      } catch (error) {
        console.error('Error loading selected goal:', error);
      }
    }
  };

  const goals = [
    {
      id: 'mosque',
      titleEn: 'Mosque',
      titleFr: 'Mosquée',
      titleNl: 'Mosque',
      titleAr: 'المسجد',
      icon: '🕌'
    },
    {
      id: 'mortuary',
      titleEn: 'Mortuary',
      titleFr: 'Funeral home',
      titleNl: 'Mortuary',
      titleAr: 'المقبلة',
      icon: '🏛️'
    },
    {
      id: 'renovation',
      titleEn: 'Renovation',
      titleFr: 'Rénovation',
      titleNl: 'Renovation',
      titleAr: 'التجديد',
      icon: '🔨'
    }
  ];

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
    localStorage.setItem('sadakaGoal', JSON.stringify(goal));
    // Automatically navigate to next page
    navigate('/mosque/amount-entry');
  };

  const handleGoBack = () => {
    const sadakaType = localStorage.getItem('sadakaType');
    if (sadakaType === 'named') {
      navigate('/mosque/member-selection');
    } else {
      navigate('/mosque/sadaka-selection');
    }
  };

  return (
    <KioskLayout maxWidth="5xl">
      <KioskHeader 
        title="Choose the Goal"
        subtitle="Select what the sadaka is for"
        step={1}
        totalSteps={3}
      />

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {goals.map((goal) => (
          <KioskCard
            key={goal.id}
            title={goal.titleEn}
            subtitle={goal.titleFr}
            subtitleNl={goal.titleNl}
            subtitleAr={goal.titleAr}
            icon={goal.icon}
            onClick={() => handleGoalSelect(goal)}
            selected={selectedGoal?.id === goal.id}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center">
        <KioskButton
          variant="secondary"
          size="medium"
          onClick={handleGoBack}
        >
          ← Go Back
        </KioskButton>
      </div>
    </KioskLayout>
  );
};

export default SadakaGoalPage;
