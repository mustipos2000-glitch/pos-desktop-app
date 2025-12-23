import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import KioskButton from '../../components/kiosk/KioskButton';

/**
 * MemberSelectionPage - Modern kiosk-optimized member selection interface
 * 
 * Design Features:
 * - Large touch targets for easy interaction
 * - Clear visual hierarchy with selected state
 * - Streamlined workflow: select OR create in one view
 * - Minimal cognitive load with clear CTAs
 */
const MemberSelectionPage = () => {
  const navigate = useNavigate();
  
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [memberFee, setMemberFee] = useState(null);

  useEffect(() => {
    fetchMembers();
    loadSelectedMember();
    fetchMemberFee();
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

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getMembers();
      setMembers(response || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberFee = async () => {
    try {
      console.log('🔍 Fetching member fees from API...');
      const response = await ApiService.getMemberFees();
      console.log('📦 API Response:', response);
      
      if (response && response.data && response.data.length > 0) {
        // Get the first member fee (assuming there's only one)
        const fee = response.data[0];
        setMemberFee(fee);
        console.log('✅ Member fee loaded:', fee);
        console.log('💰 Fee amount:', fee.member_fee);
        
        // IMPORTANT: Store it immediately for membership payments
        const paymentTypeStr = localStorage.getItem('mosquePaymentType');
        if (paymentTypeStr) {
          try {
            const paymentType = JSON.parse(paymentTypeStr);
            if (paymentType && paymentType.id === 'membership') {
              console.log('💾 Auto-storing member fee for membership payment');
              localStorage.setItem('memberFeeAmount', fee.member_fee.toString());
            }
          } catch (e) {
            console.error('Error parsing payment type:', e);
          }
        }
      } else {
        console.warn('⚠️ No member fees found in database');
        alert('No member fee configured. Please add a member fee in Settings.');
      }
    } catch (error) {
      console.error('❌ Error fetching member fee:', error);
      alert('Failed to load member fee. Please check your connection.');
    }
  };

  const handleSelectMember = (member) => {
    console.log('👤 Selecting member:', member.full_name);
    
    setSelectedMember({
      id: member.id,
      fullName: member.full_name,
      phone: member.phone,
      type: 'existing'
    });
    setShowCreateForm(false);
    
    // Store member fee if it's a membership payment
    const paymentTypeStr = localStorage.getItem('mosquePaymentType');
    console.log('=== Selecting Member ===');
    console.log('Payment Type:', paymentTypeStr);
    console.log('Member Fee State:', memberFee);
    
    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
      console.log('Parsed Payment Type:', paymentType);
      
      if (paymentType && paymentType.id === 'membership') {
        if (memberFee && memberFee.member_fee) {
          console.log('✅ Storing member fee:', memberFee.member_fee);
          localStorage.setItem('memberFeeAmount', memberFee.member_fee.toString());
          console.log('✅ Stored in localStorage:', localStorage.getItem('memberFeeAmount'));
        } else {
          console.error('❌ Member fee not available!');
          console.log('Member fee state:', memberFee);
          alert('Member fee not loaded. Please refresh the page or configure member fee in Settings.');
        }
      } else {
        console.log('ℹ️ Not a membership payment, skipping fee storage');
      }
    } catch (error) {
      console.error('❌ Error storing member fee:', error);
    }
  };

  const handleCreateMember = async () => {
    if (!newFullName.trim()) {
      alert('Please enter a full name');
      return;
    }
    
    try {
      setCreating(true);
      const response = await ApiService.createMember({
        full_name: newFullName.trim(),
        phone: newPhone.trim()
      });
      
      const member = {
        id: response.id,
        fullName: response.full_name,
        phone: response.phone,
        type: 'new'
      };
      
      setSelectedMember(member);
      setShowCreateForm(false);
      
      // Store member fee if it's a membership payment
      const paymentTypeStr = localStorage.getItem('mosquePaymentType');
      console.log('=== Creating New Member ===');
      console.log('Payment Type:', paymentTypeStr);
      console.log('Member Fee State:', memberFee);
      
      try {
        const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
        if (paymentType && paymentType.id === 'membership') {
          if (memberFee && memberFee.member_fee) {
            console.log('✅ Storing member fee for new member:', memberFee.member_fee);
            localStorage.setItem('memberFeeAmount', memberFee.member_fee.toString());
          } else {
            console.error('❌ Member fee not available for new member!');
          }
        }
      } catch (error) {
        console.error('Error storing member fee:', error);
      }
      
      // Refresh members list
      await fetchMembers();
      
      // Clear form
      setNewFullName('');
      setNewPhone('');
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member');
    } finally {
      setCreating(false);
    }
  };

  const handleNext = () => {
    if (!selectedMember) {
      alert('Please select or create a member first');
      return;
    }
    
    localStorage.setItem('selectedMember', JSON.stringify(selectedMember));
    
    const paymentTypeStr = localStorage.getItem('mosquePaymentType');
    const sadakaType = localStorage.getItem('sadakaType');
    
    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
      
      if (paymentType && paymentType.id === 'sadaka' && sadakaType === 'named') {
        navigate('/mosque/sadaka-goal');
      } else if (paymentType && paymentType.id === 'rent') {
        navigate('/mosque/rent-datetime');
      } else {
        navigate('/mosque/amount-entry');
      }
    } catch (error) {
      console.error('Error parsing payment type:', error);
      navigate('/mosque/amount-entry');
    }
  };

  const handleGoBack = () => {
    const paymentTypeStr = localStorage.getItem('mosquePaymentType');
    const sadakaType = localStorage.getItem('sadakaType');
    
    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
      
      if (paymentType && paymentType.id === 'sadaka' && sadakaType === 'named') {
        navigate('/mosque/sadaka-selection');
      } else {
        navigate('/mosque/mosque-payment');
      }
    } catch (error) {
      console.error('Error parsing payment type:', error);
      navigate('/mosque/mosque-payment');
    }
  };

  // Filter members based on search
  const filteredMembers = members.filter(member => 
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.phone && member.phone.includes(searchQuery))
  );

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pos-text-primary mb-3">
            Select Member
          </h1>
          <p className="text-xl text-pos-text-secondary">
            Choose an existing member or create a new one
          </p>
        </div>
      </div>

      {/* Selected Member Banner */}
      {selectedMember && (
        <div className="flex-shrink-0 px-8 pb-2">
          <div className="bg-green-600 bg-opacity-20 border-2 border-green-600 rounded-2xl p-1 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-green-600 font-medium">Selected Member</div>
                  <div className="text-2xl font-bold text-pos-text-primary">{selectedMember.fullName}</div>
                  {selectedMember.phone && (
                    <div className="text-lg text-pos-text-secondary">{selectedMember.phone}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-pos-text-secondary hover:text-pos-text-primary transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden px-8 pb-4">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          
          {/* Toggle View Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all border-2 ${
                !showCreateForm
                  ? 'bg-pos-bg-secondary text-pos-text-primary border-pos-interactive-hover shadow-lg'
                  : 'bg-pos-interactive-primary text-pos-text-secondary border-pos-border-primary'
              }`}
            >
              Find Existing Member
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all border-2 ${
                showCreateForm
                  ? 'bg-pos-bg-secondary text-pos-text-primary border-pos-interactive-hover shadow-lg'
                  : 'bg-pos-interactive-primary text-pos-text-secondary border-pos-border-primary'
              }`}
            >
              Create New Member
            </button>
          </div>

          {/* Content Area */}
          {!showCreateForm ? (
            // Member List View
            <div className="flex-1 flex flex-col overflow-hidden bg-pos-bg-secondary rounded-2xl border-2 border-pos-border-primary p-6">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 text-lg bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:border-pos-interactive-hover"
                  />
                  <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-pos-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto scrollbar-custom space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pos-text-primary mx-auto mb-4"></div>
                      <p className="text-xl text-pos-text-secondary">Loading members...</p>
                    </div>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg className="w-20 h-20 text-pos-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-xl text-pos-text-secondary">
                        {searchQuery ? 'No members found' : 'No members available'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectMember(member)}
                      className={`w-full px-5 py-2 rounded-xl border-2 transition-all text-left ${
                        selectedMember?.id === member.id
                          ? 'bg-pos-interactive-hover border-pos-interactive-hover shadow-lg'
                          : 'bg-pos-bg-primary border-pos-border-primary hover:border-pos-interactive-hover hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl font-semibold text-pos-text-primary flex items-center">
                            {member.full_name}
                            {member.phone && (
                            <div className="text-lg text-pos-text-secondary ml-3">
                              {member.phone}
                            </div>
                          )}
                          </div>
                          
                        </div>
                        {selectedMember?.id === member.id && (
                          <div className="bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Create Member Form
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full bg-pos-bg-secondary rounded-2xl border-2 border-pos-border-primary px-8 py-4">
                <div className="space-y-2">
                  <div>
                    <label className="block text-lg font-semibold text-pos-text-primary mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter member's full name"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full px-6 py-3 text-xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:border-pos-interactive-hover"
                      disabled={creating}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lg font-semibold text-pos-text-primary mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-6 py-3 text-xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:border-pos-interactive-hover"
                      disabled={creating}
                    />
                  </div>
                  
                  <KioskButton
                    variant="success"
                    size="large"
                    onClick={handleCreateMember}
                    disabled={!newFullName.trim() || creating}
                    fullWidth
                  >
                    {creating ? 'Creating Member...' : 'Create Member'}
                  </KioskButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 px-8 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-4">
          <KioskButton
            variant="secondary"
            size="large"
            onClick={handleGoBack}
            disabled={loading || creating}
          >
            Go Back
          </KioskButton>
          
          <KioskButton
            variant="primary"
            size="large"
            onClick={handleNext}
            disabled={!selectedMember || loading || creating}
          >
            Continue
          </KioskButton>
        </div>
      </div>
    </div>
  );
};

export default MemberSelectionPage;
