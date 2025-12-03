import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

/**
 * MemberSelectionPage - A full page component for selecting existing members or creating new ones
 * Used for membership fee payments and other modules that require member selection
 */
const MemberSelectionPage = () => {
  const navigate = useNavigate();
  
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
    loadSelectedMember();
  }, []);

  const loadSelectedMember = () => {
    // Load previously selected member from localStorage
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

  const handleSelectExistingMember = () => {
    if (!selectedMemberId) {
      alert('Please select a member from the list');
      return;
    }
    
    const member = members.find(m => m.id === parseInt(selectedMemberId));
    if (member) {
      setSelectedMember({
        id: member.id,
        name: member.name,
        firstName: member.first_name,
        phone: member.phone,
        type: 'existing'
      });
    }
  };

  const handleConfirmNewMember = async () => {
    if (!newName.trim() || !newFirstName.trim()) {
      alert('Please fill in at least Name and First name');
      return;
    }
    
    try {
      setLoading(true);
      const response = await ApiService.createMember({
        name: newName,
        first_name: newFirstName,
        phone: newPhone
      });
      
      const member = {
        id: response.id,
        name: response.name,
        firstName: response.first_name,
        phone: response.phone,
        type: 'new'
      };
      
      setSelectedMember(member);
      
      // Refresh members list
      await fetchMembers();
      
      // Clear form
      setNewName('');
      setNewFirstName('');
      setNewPhone('');
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedMember) {
      alert('Please select or create a member first');
      return;
    }
    
    // Store member info
    localStorage.setItem('selectedMember', JSON.stringify(selectedMember));
    
    // Check payment type to determine next page
    const paymentTypeStr = localStorage.getItem('mosquePaymentType');
    const sadakaType = localStorage.getItem('sadakaType');
    
    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
      
      // If it's sadaka payment (named), go to sadaka goal page
      if (paymentType && paymentType.id === 'sadaka' && sadakaType === 'named') {
        navigate('/sadaka-goal');
      } else if (paymentType && paymentType.id === 'rent') {
        // If it's rent space, go to date/time selection page
        navigate('/rent-datetime');
      } else {
        // For membership or other types, go to amount entry
        navigate('/amount-entry');
      }
    } catch (error) {
      console.error('Error parsing payment type:', error);
      navigate('/amount-entry');
    }
  };

  const handleGoBack = () => {
    // Reset all fields
    setSelectedMemberId('');
    setNewName('');
    setNewFirstName('');
    setNewPhone('');
    setSelectedMember(null);
    
    // Check payment type to determine where to go back
    const paymentTypeStr = localStorage.getItem('mosquePaymentType');
    const sadakaType = localStorage.getItem('sadakaType');
    
    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
      
      // If it's sadaka payment with named type, go back to sadaka selection
      if (paymentType && paymentType.id === 'sadaka' && sadakaType === 'named') {
        navigate('/sadaka-selection');
      } else {
        // For membership or other types, go back to mosque payment screen
        navigate('/mosque-payment');
      }
    } catch (error) {
      console.error('Error parsing payment type:', error);
      navigate('/mosque-payment');
    }
  };

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col items-center justify-center p-6 overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-pos-text-primary mb-1">
            Choose member or create new member
          </h1>
          <p className="text-sm text-pos-text-secondary">
            Search for a member or create a new member to continue
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl w-full mb-5">
          {/* Left Column - Find Existing Member */}
          <div className="bg-pos-bg-secondary rounded-lg p-5 border border-pos-border-primary">
            <h3 className="text-base font-semibold text-pos-text-primary mb-3">
              Find an existing member
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-pos-text-muted mb-1">Select Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-pos-bg-primary border border-pos-border-primary rounded text-pos-text-primary focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover text-sm"
                  disabled={loading}
                > className="w-full px-3 py-2 bg-pos-bg-primary border border-pos-border-primary rounded text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover text-sm"
                  <option value="">-- Select a member --</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.name} {member.phone ? `(${member.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleSelectExistingMember}
                disabled={!selectedMemberId || loading}
                className={`w-full py-2.5 rounded transition-colors font-medium border text-sm ${
                  selectedMemberId && !loading
                    ? 'bg-pos-bg-primary text-pos-text-primary hover:bg-pos-interactive-hover border-pos-border-primary'
                    : 'bg-pos-interactive-primary text-pos-text-disabled cursor-not-allowed border-pos-border-primary opacity-50'
                }`}
              >
                {loading ? 'Loading...' : 'Select Member'}
              </button>
            </div>
          </div>

          {/* Right Column - Create New Member */}
          <div className="bg-pos-bg-secondary rounded-lg p-5 border border-pos-border-primary">
            <h3 className="text-base font-semibold text-pos-text-primary mb-3">
              Create a new member
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-pos-text-muted mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-pos-bg-primary border border-pos-border-primary rounded text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs text-pos-text-muted mb-1">First name</label>
                <input
                  type="text"
                  placeholder="First name"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-pos-bg-primary border border-pos-border-primary rounded text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs text-pos-text-muted mb-1">Telephone</label>
                <input
                  type="text"
                  placeholder="Telephone number"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-pos-bg-primary border border-pos-border-primary rounded text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:ring-2 focus:ring-pos-interactive-hover text-sm"
                />
              </div>
              
              <button
                onClick={handleConfirmNewMember}
                className="w-full bg-pos-bg-primary text-pos-text-primary py-2.5 rounded hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
              >
                Confirm member
              </button>
            </div>
          </div>
        </div>

        {/* Selected Member Display */}
        <div className="text-center mb-5 max-w-4xl w-full">
          <p className="text-pos-text-primary text-sm">
            Selected member: <span className="font-semibold">{selectedMember ? `${selectedMember.firstName} ${selectedMember.name}` : 'none'}</span>
          </p>
        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-center gap-3 max-w-4xl w-full">
          <button
            onClick={handleGoBack}
            className="px-6 py-2 bg-pos-interactive-primary text-pos-text-primary rounded hover:bg-pos-interactive-hover transition-colors font-medium border border-pos-border-primary text-sm"
          >
            Go back
          </button>
          
          <button
            onClick={handleNext}
            disabled={!selectedMember}
            className={`px-6 py-2 rounded font-medium transition-colors border text-sm ${
              selectedMember
                ? 'bg-pos-bg-primary text-pos-text-primary hover:bg-pos-interactive-hover border-pos-border-primary'
                : 'bg-pos-interactive-primary text-pos-text-disabled cursor-not-allowed border-pos-border-primary opacity-50'
            }`}
          >
            Next
          </button>
        </div>
    </div>
  );
};

export default MemberSelectionPage;
