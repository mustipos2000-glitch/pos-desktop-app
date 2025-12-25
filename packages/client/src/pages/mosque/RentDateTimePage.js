import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import { KioskButton } from '../../components/mosque';

const RentDateTimePage = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startHour, setStartHour] = useState('09');
  const [endHour, setEndHour] = useState('17');
  const [validationError, setValidationError] = useState('');
  const [rentalCharge, setRentalCharge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingOverlap, setCheckingOverlap] = useState(false);
  const [overlappingBookings, setOverlappingBookings] = useState([]);

  useEffect(() => {
    loadSelectedMember();
    loadSavedDateTime();
    fetchRentalCharge();
  }, []);

  useEffect(() => {
    // Real-time validation and overlap checking
    if (startDate && endDate && startHour && endHour) {
      validateAndCheckOverlap();
    } else {
      setValidationError('');
      setOverlappingBookings([]);
    }
  }, [startDate, endDate, startHour, endHour]);

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
        setStartHour(data.startHour || '09');
        setEndHour(data.endHour || '17');
      } catch (error) {
        console.error('Error loading saved date/time:', error);
      }
    }
  };

  const fetchRentalCharge = async () => {
    try {
      const response = await ApiService.getRentalCharges();
      if (response && response.data && response.data.length > 0) {
        const charge = response.data[0];
        setRentalCharge(charge);
        console.log('✅ Rental charge loaded:', charge);
      } else {
        console.warn('⚠️ No rental charge found in settings');
        alert('Please configure rental charge in settings first');
      }
    } catch (error) {
      console.error('Error fetching rental charge:', error);
      alert('Failed to load rental charge settings');
    }
  };

  const validateAndCheckOverlap = async () => {
    // Basic validation
    const start = new Date(`${startDate}T${startHour}:00:00`);
    const end = new Date(`${endDate}T${endHour}:00:00`);
    
    if (end <= start) {
      setValidationError('End date/time must be after start date/time');
      setOverlappingBookings([]);
      return;
    }

    // Check for overlapping bookings
    setCheckingOverlap(true);
    try {
      const startDatetime = `${startDate}T${startHour}:00:00`;
      const endDatetime = `${endDate}T${endHour}:00:00`;
      
      const response = await ApiService.checkRentalOverlap(startDatetime, endDatetime);
      
      if (response.hasOverlap) {
        setValidationError('⚠️ Time slot conflict: This period overlaps with an existing booking');
        setOverlappingBookings(response.overlappingBookings || []);
      } else {
        setValidationError('');
        setOverlappingBookings([]);
      }
    } catch (error) {
      console.error('Error checking overlap:', error);
      setValidationError('Failed to check availability');
    } finally {
      setCheckingOverlap(false);
    }
  };

  const calculateDuration = () => {
    if (!startDate || !endDate || !startHour || !endHour) return { hours: 0, days: 0 };
    
    const start = new Date(`${startDate}T${startHour}:00:00`);
    const end = new Date(`${endDate}T${endHour}:00:00`);
    
    if (end <= start) return { hours: 0, days: 0 };
    
    const diffMs = end - start;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    return { hours: diffHours, days: diffDays };
  };

  const calculateTotalAmount = () => {
    if (!rentalCharge) return 0;
    const { hours } = calculateDuration();
    // Calculate based on hours - charge for any part of a day
    const days = Math.ceil(hours / 24); // Round up to next day
    return days * parseFloat(rentalCharge.rental_charge);
  };

  const formatDuration = () => {
    const { hours, days } = calculateDuration();
    if (hours === 0) return null;
    
    const remainingHours = hours % 24;
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${remainingHours > 0 ? ` ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}` : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const handleGoBack = () => {
    navigate('/mosque/member-selection');
  };

  const handleNext = async () => {
    if (!startDate || !endDate || !startHour || !endHour) {
      alert('Please fill in all date and time fields');
      return;
    }

    if (validationError) {
      alert(validationError);
      return;
    }

    if (!rentalCharge) {
      alert('Rental charge not configured. Please contact administrator.');
      return;
    }

    const { hours, days } = calculateDuration();
    if (hours <= 0) {
      alert('Invalid rental period');
      return;
    }

    setLoading(true);

    try {
      // Store rental date/time data
      const rentDateTime = {
        startDate,
        endDate,
        startHour,
        endHour,
        startDatetime: `${startDate}T${startHour}:00:00`,
        endDatetime: `${endDate}T${endHour}:00:00`,
        durationHours: hours,
        durationDays: days
      };
      localStorage.setItem('rentDateTime', JSON.stringify(rentDateTime));

      // Calculate and store amount
      const totalAmount = calculateTotalAmount();
      localStorage.setItem('paymentAmount', totalAmount.toString());

      console.log('📅 Rental booking details:', {
        member: selectedMember?.fullName,
        startDatetime: rentDateTime.startDatetime,
        endDatetime: rentDateTime.endDatetime,
        duration: `${days} days (${hours} hours)`,
        dailyRate: rentalCharge.rental_charge,
        totalAmount: totalAmount
      });

      // Navigate directly to payment method page (skip amount entry)
      navigate('/mosque/payment-method');
    } catch (error) {
      console.error('Error processing rental booking:', error);
      alert('Failed to process rental booking');
    } finally {
      setLoading(false);
    }
  };

  const isFormComplete = startDate && endDate && startHour && endHour && !validationError && !checkingOverlap;

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: hour, label: `${hour}:00` };
  });

  return (
    <div className="min-h-screen bg-pos-bg-primary flex flex-col">
      {/* Header */}
      {/* <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pos-text-primary mb-2 sm:mb-3">
            Select Rental Period
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-pos-text-secondary">
            Choose the date and time for space/kitchen rental
          </p>
        </div>
      </div> */}
      <div className="absolute left-2 top-1 w-24">
        <KioskButton
          variant="secondary"
          size="large"
          onClick={handleGoBack}
          disabled={loading}
          icon={true}
        >
          <img src="/icon kiosk/terug.png" alt="Go Back" className="rounded-2xl" />
          {/* Go Back */}
        </KioskButton>
      </div>
      {/* Member Info Banner */}
      {selectedMember && (
        <div className="flex max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 sm:pb-4 mt-2">
        
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 pb-3 sm:pb-4">
         {selectedMember && ( <div className="bg-pos-bg-secondary border-2 border-pos-border-primary rounded-xl sm:rounded-2xl p-3 sm:p-4 max-w-5xl mx-auto mb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-pos-text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="text-xs sm:text-sm text-pos-text-secondary">Renting for</div>
                  <div className="text-lg sm:text-xl font-bold text-pos-text-primary">{selectedMember.fullName}</div>
                </div>
              </div>
              {rentalCharge && (
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-pos-text-secondary">Daily Rate</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">€ {parseFloat(rentalCharge.rental_charge).toFixed(2)}/day</div>
                </div>
              )}
            </div>
          </div>)}
        <div className=" h-full flex flex-col">
          
          <div className="flex-1 bg-pos-bg-secondary rounded-xl sm:rounded-2xl border-2 border-pos-border-primary p-4 sm:p-6 lg:p-8 overflow-y-auto scrollbar-custom">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6 lg:gap-8 mb-4 sm:mb-6 px-1">
              
              {/* Start Date/Time Section */}
              <div className="w-full lg:flex-1">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-pos-text-primary">
                    Start Date & Time
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-5 text-3xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-hover"
                    />
                  </div>
                  <div>
                    <label className="block text-xl font-bold text-pos-text-primary mb-3">
                      Start Hour
                    </label>
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="px-6 py-5 text-3xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-hover"
                    >
                      {hourOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* End Date/Time Section */}
              <div className="w-full lg:flex-1">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-pos-text-primary">
                    End Date & Time
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xl font-bold text-pos-text-primary mb-3">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-5 text-3xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-hover"
                    />
                  </div>
                  <div>
                    <label className="block text-xl font-bold text-pos-text-primary mb-3">
                      End Hour
                    </label>
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="px-6 py-5 text-3xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-hover"
                    >
                      {hourOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Checking Overlap Indicator */}
            {checkingOverlap && (
              <div className="bg-blue-500 bg-opacity-10 border-2 border-blue-500 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 animate-spin flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <p className="text-base sm:text-lg font-semibold text-blue-600">Checking availability...</p>
                </div>
              </div>
            )}

            {/* Validation Error */}
            {validationError && !checkingOverlap && (
              <div className="bg-red-600 bg-opacity-20 border-2 border-red-600 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-base sm:text-lg font-semibold text-red-600 mb-2">{validationError}</p>
                    {overlappingBookings.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-semibold text-red-600">Conflicting bookings:</p>
                        {overlappingBookings.map((booking, idx) => (
                          <div key={idx} className="bg-red-500 bg-opacity-10 rounded-lg p-3 text-sm">
                            <div className="font-semibold text-pos-text-primary">{booking.member_name}</div>
                            <div className="text-pos-text-secondary text-xs sm:text-sm">
                              {new Date(booking.start_datetime).toLocaleString()} - {new Date(booking.end_datetime).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Summary Card */}
            {isFormComplete && (
              <div className="bg-green-600 bg-opacity-10 border-2 border-green-600 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-green-600 mb-4">✅ Time Slot Available</h4>
                    <div className="space-y-4">
                      {/* From → To → Duration in one line */}
                      <div className="flex items-center justify-between gap-4 bg-pos-bg-primary rounded-lg p-4">
                        <div className="flex-1">
                          <div className="text-base text-pos-text-secondary mb-1">From</div>
                          <div className="text-xl font-bold text-pos-text-primary">
                            {new Date(`${startDate}T${startHour}:00:00`).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        
                        <div className="text-3xl text-green-600 font-bold">→</div>
                        
                        <div className="flex-1">
                          <div className="text-base text-pos-text-secondary mb-1">To</div>
                          <div className="text-xl font-bold text-pos-text-primary">
                            {new Date(`${endDate}T${endHour}:00:00`).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        <div className="text-3xl text-green-600 font-bold">=</div>

                        <div className="flex-1">
                          <div className="text-base text-pos-text-secondary mb-1">Duration</div>
                          <div className="text-xl font-bold text-green-600">{formatDuration()}</div>
                        </div>
                      </div>
                     
                      {/* Total Amount - Prominent */}
                      <div className="bg-green-600 bg-opacity-10 rounded-lg p-5 border-2 border-green-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-pos-text-primary">Total Amount:</span>
                          <span className="text-4xl font-bold text-green-600">€ {calculateTotalAmount().toFixed(2)}</span>
                        </div>
                        <div className="text-base text-pos-text-secondary text-right">
                          ({Math.ceil(calculateDuration().hours / 24)} day{Math.ceil(calculateDuration().hours / 24) !== 1 ? 's' : ''} × €{rentalCharge ? parseFloat(rentalCharge.rental_charge).toFixed(2) : '0.00'}/day)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
          <KioskButton
          variant="success"
          size="large"
          onClick={handleNext}
          disabled={!isFormComplete || loading}
          fullWidth
          className='mt-2'
        >
          {loading ? 'Processing...' : 'Continue to Payment'}
        </KioskButton>
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
      
      </div>
    </div>
  );
};

export default RentDateTimePage;
