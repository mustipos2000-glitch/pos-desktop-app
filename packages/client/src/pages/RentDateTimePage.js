import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RentDateTimePage = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    loadSelectedMember();
    loadSavedDateTime();
  }, []);

  const loadSelectedMember = () => {
    const storedMember = localStorage.getItem('selectedMember');
    if (storedMember) {
      try {
        const member = JSON.parse(storedMember);
        setSelectedMember(member);
      } catch (error) {
        console.error('Error loading selected member:', error);
      }
    }
  };

  const loadSavedDateTime = () => {
    const saved = localStorage.getItem('rentDateTime');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStartDate(data.startDate || '');
        setEndDate(data.endDate || '');
        setStartTime(data.startTime || '');
        setEndTime(data.endTime || '');
      } catch (error) {
        console.error('Error loading saved date/time:', error);
      }
    }
  };

  const handleGoBack = () => {
    navigate('/member-selection');
  };

  const handleNext = () => {
    if (!startDate || !endDate || !startTime || !endTime) {
      alert('Please fill in all date and time fields');
      return;
    }

    // Validate that end date is after start date
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (end <= start) {
      alert('End date/time must be after start date/time');
      return;
    }

    // Save the date/time information
    const rentDateTime = {
      startDate,
      endDate,
      startTime,
      endTime
    };
    localStorage.setItem('rentDateTime', JSON.stringify(rentDateTime));

    // Navigate to amount entry page
    navigate('/amount-entry');
  };

  return (
    <div className="min-h-screen bg-pos-bg-primary flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-pos-text-primary mb-2">
            Choose Date and Time
          </h1>
          <p className="text-base text-pos-text-secondary">
            Select the rental period for the space/kitchen
          </p>
        </div>

        {selectedMember && (
          <div className="text-center mb-6 bg-pos-bg-secondary border border-pos-border-primary rounded-lg px-4 py-3">
            <p className="text-xs text-pos-text-secondary">Member</p>
            <p className="text-sm text-pos-text-primary font-semibold">
              {selectedMember.fullName}
            </p>
          </div>
        )}

        <div className="bg-pos-bg-secondary rounded-lg p-6 mb-6 border border-pos-border-primary">
          <div className="space-y-5">
            {/* Start Date and Time */}
            <div>
              <h3 className="text-base font-semibold text-pos-text-primary mb-3">
                Start Date and Time
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-pos-text-muted mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-pos-bg-primary border border-pos-border-primary rounded text-pos-text-primary focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-pos-text-muted mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-pos-bg-primary border border-pos-border-primary rounded text-pos-text-primary focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover text-sm"
                  />
                </div>
              </div>
            </div>

            {/* End Date and Time */}
            <div>
              <h3 className="text-base font-semibold text-pos-text-primary mb-3">
                End Date and Time
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-pos-text-muted mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-pos-bg-primary border border-pos-border-primary rounded text-pos-text-primary focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-pos-text-muted mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-pos-bg-primary border border-pos-border-primary rounded text-pos-text-primary focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {startDate && endDate && startTime && endTime && (
              <div className="pt-3 border-t border-pos-border-primary">
                <p className="text-xs text-pos-text-secondary mb-1">Rental Period:</p>
                <p className="text-sm text-pos-text-primary">
                  <span className="font-semibold">From:</span> {startDate} at {startTime}
                </p>
                <p className="text-sm text-pos-text-primary">
                  <span className="font-semibold">To:</span> {endDate} at {endTime}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded-lg hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
          >
            Go back
          </button>
          
          <button
            onClick={handleNext}
            disabled={!startDate || !endDate || !startTime || !endTime}
            className={`px-6 py-2 rounded-lg font-medium transition-colors border text-sm ${
              startDate && endDate && startTime && endTime
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

export default RentDateTimePage;
