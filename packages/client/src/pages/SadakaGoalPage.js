import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
      titleEn: 'Sadaka Mosque',
      titleFr: 'Sadaka mosquée',
      titleNl: 'Sadaka mosque',
      titleAr: 'صدقة للمسجد'
    },
    {
      id: 'mortuary',
      titleEn: 'Sadaka mortuary',
      titleFr: 'Sadaka funeral home',
      titleNl: 'Sadaka mortuary',
      titleAr: 'صدقة للمقبلة'
    },
    {
      id: 'renovation',
      titleEn: 'Sadaka renovation',
      titleFr: 'Sadaka rénovation',
      titleNl: 'Sadaka renovation',
      titleAr: 'صدقة للتجديد'
    }
  ];

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal);
    localStorage.setItem('sadakaGoal', JSON.stringify(goal));
    navigate('/amount-entry');
  };

  const handleGoBack = () => {
    const sadakaType = localStorage.getItem('sadakaType');
    
    if (sadakaType === 'named') {
      navigate('/member-selection');
    } else {
      navigate('/sadaka-selection');
    }
  };

  return (
    <div className="min-h-screen bg-pos-bg-primary flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pos-text-primary mb-2">
            Choose the Goal
          </h1>
          <p className="text-base text-pos-text-secondary">
            Choose what the sadaka is for
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {goals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => handleGoalSelect(goal)}
              className="card card-hover bg-pos-bg-secondary cursor-pointer rounded-xl p-8 transition-all duration-300 border-2 border-pos-border-primary"
            >
              <div className="text-center space-y-2">
                <div className="text-lg font-semibold text-pos-text-primary">
                  {goal.titleEn}
                </div>
                <div className="text-base text-pos-text-secondary">
                  {goal.titleFr}
                </div>
                <div className="text-base text-pos-text-secondary">
                  {goal.titleNl}
                </div>
                <div className="text-lg text-pos-text-secondary" dir="rtl">
                  {goal.titleAr}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-5">
          <p className="text-pos-text-primary text-sm">
            Chosen Goal: <span className="font-semibold">{selectedGoal ? selectedGoal.titleEn : 'None'}</span>
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
          >
            Go back
          </button>
          
          <button
            onClick={() => selectedGoal && navigate('/amount-entry')}
            disabled={!selectedGoal}
            className={`px-6 py-2 rounded-lg font-medium transition-colors border text-sm ${
              selectedGoal
                ? 'bg-pos-bg-secondary text-pos-text-primary hover:bg-pos-interactive-hover border-pos-border-primary'
                : 'bg-pos-interactive-primary text-pos-text-disabled cursor-not-allowed border-pos-border-primary opacity-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SadakaGoalPage;
