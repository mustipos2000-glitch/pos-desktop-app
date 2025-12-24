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
      icon: "/icon kiosk/mosque.png"
    },
    {
      id: 'mortuary',
      titleEn: 'Mortuary',
      titleFr: 'Funeral home',
      titleNl: 'Mortuary',
      titleAr: 'المقبلة',
      icon: "/icon kiosk/mortuarium.png"
    },
    {
      id: 'renovation',
      titleEn: 'Renovation',
      titleFr: 'Rénovation',
      titleNl: 'Renovation',
      titleAr: 'التجديد',
      icon: "/icon kiosk/renovation.png"
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
    <KioskLayout maxWidth="">
      {/* <KioskHeader 
        title="Choose the Goal"
        subtitle="Select what the sadaka is for"
        step={1}
        totalSteps={3}
      /> */}
    {/* Navigation Buttons */}
      <div className="absolute left-2 top-1 w-24">
        <KioskButton
          variant="secondary"
          size="medium"
          onClick={handleGoBack}
          icon={"true"}
        >
          <img 
            src="/icon kiosk/terug.png" 
            alt="Go Back" 
            className="rounded-3xl"
          />
          {/* ← Go Back */}
        </KioskButton>
      </div>
      {/* Goals Grid */}
      <div className="flex justify-center gap-6 ml-4">
        {goals.map((goal) => (
          <KioskCard
            key={goal.id}
            // title={goal.titleEn}
            // subtitle={goal.titleFr}
            // subtitleNl={goal.titleNl}
            // subtitleAr={goal.titleAr}
            icon={goal.icon}
            onClick={() => handleGoalSelect(goal)}
            className='max-w-sm'
            selected={selectedGoal?.id === goal.id}
          />
        ))}
      </div>
    </KioskLayout>
  );
};

export default SadakaGoalPage;
