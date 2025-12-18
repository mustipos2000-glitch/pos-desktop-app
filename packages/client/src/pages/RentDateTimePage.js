import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import KioskButton from '../components/kiosk/KioskButton';

/**
 * RentDateTimePage - Modern kiosk-optimized date/time selection
 * 
 * Design Features:
 * - Large, touch-friendly date/time inputs
 * - Real-time validation feedback
 * - Clear visual summary of selection
 * - Optimized for landscape kiosk displays
 */
const RentDateTimePage = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    loadSelectedMember();
    loadSavedDateTime();
  }, []);

  useEffect(() => {
    // Real-time validation
    if (startDate && endDate && startTime && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      
      if (end <= start) {
        setValidationError('End date/time must be after start date/time');
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [startDate, endDate, startTime, endTime]);

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

    if (validationError) {
      alert(validationError);
      return;
    }

    const rentDateTime = {
      startDate,
      endDate,
      startTime,
      endTime
    };
    localStorage.setItem('rentDateTime', JSON.stringify(rentDateTime));
    navigate('/amount-entry');
  };

  const formatDuration = () => {
    if (!startDate || !endDate || !startTime || !endTime) return null;
    
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    
    if (end <= start) return null;
    
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };

  const isFormComplete = startDate && endDate && startTime && endTime && !validationError;

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pos-text-primary mb-3">
            Select Rental Period
          </h1>
          <p className="text-xl text-pos-text-secondary">
            Choose the date and time for space/kitchen rental
          </p>
        </div>
      </div>

      {/* Member Info Banner */}
      {selectedMember && (
        <div className="flex-shrink-0 px-8 pb-4">
          <div className="bg-pos-bg-secondary border-2 border-pos-border-primary rounded-2xl p-4 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-pos-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <div className="text-sm text-pos-text-secondary">Renting for</div>
                <div className="text-xl font-bold text-pos-text-primary">{selectedMember.fullName}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden px-8 pb-4">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          
          <div className="flex-1 bg-pos-bg-secondary rounded-2xl border-2 border-pos-border-primary p-8 overflow-y-auto scrollbar-custom">
            <div className="flex justify-between items-center mb-2">
              
              {/* Start Date/Time Section */}
              <div className="max-w-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-pos-text-primary">
                    Start Date & Time
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-semibold text-pos-text-primary mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-6 py-3 text-xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-hover"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-pos-text-primary mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-6 py-3 text-xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-hover"
                    />
                  </div>
                </div>
              </div>

              {/* End Date/Time Section */}
              <div className="max-w-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mb-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-pos-text-primary">
                    End Date & Time
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-semibold text-pos-text-primary mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-6 py-3 text-xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-hover"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-pos-text-primary mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-6 py-3 text-xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-hover"
                    />
                  </div>
                </div>
              </div>
            </div>
             {/* Validation Error */}
              {validationError && (
                <div className="bg-red-600 bg-opacity-20 border-2 border-red-600 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-lg font-semibold text-red-600">{validationError}</p>
                  </div>
                </div>
              )}

              {/* Summary Card */}
              {isFormComplete && (
                <div className="bg-green-600 bg-opacity-10 border-2 border-green-600 rounded-xl p-6 py-2 mt-2">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-green-600 mb-3">Rental Period Summary</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-pos-text-secondary">From:</span>
                          <span className="text-lg font-semibold text-pos-text-primary">
                            {new Date(`${startDate}T${startTime}`).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-pos-text-secondary">To:</span>
                          <span className="text-lg font-semibold text-pos-text-primary">
                            {new Date(`${endDate}T${endTime}`).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-green-600">
                          <span className="text-lg text-pos-text-secondary">Duration:</span>
                          <span className="text-xl font-bold text-green-600">{formatDuration()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 px-8 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-4">
          <KioskButton
            variant="secondary"
            size="large"
            onClick={handleGoBack}
          >
            Go Back
          </KioskButton>
          
          <KioskButton
            variant="primary"
            size="large"
            onClick={handleNext}
            disabled={!isFormComplete}
          >
            Continue
          </KioskButton>
        </div>
      </div>
    </div>
  );
};

export default RentDateTimePage;
