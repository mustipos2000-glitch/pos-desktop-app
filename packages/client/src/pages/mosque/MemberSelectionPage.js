import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';

const MemberSelectionPage = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newMemberId, setNewMemberId] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [memberFee, setMemberFee] = useState(null);

  useEffect(() => {
    fetchMembers();
    loadSelectedMember();
    fetchMemberFee();
    fetchNextMemberId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNextMemberId = async () => {
    try {
      const response = await ApiService.getNextMemberId();
      if (response && response.nextMemberId) setNewMemberId(response.nextMemberId);
    } catch (error) {
      console.error('Error fetching next member ID:', error);
    }
  };

  const loadSelectedMember = () => {
    const storedMember = localStorage.getItem('selectedMember');
    if (storedMember) {
      try {
        setSelectedMember(JSON.parse(storedMember));
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
      const response = await ApiService.getMemberFees();
      if (response && response.data && response.data.length > 0) {
        const fee = response.data[0];
        setMemberFee(fee);

        const paymentTypeStr = localStorage.getItem('mosquePaymentType');
        if (paymentTypeStr) {
          try {
            const paymentType = JSON.parse(paymentTypeStr);
            if (paymentType && paymentType.id === 'membership') {
              localStorage.setItem('memberFeeAmount', fee.member_fee.toString());
            }
          } catch (e) {
            console.error('Error parsing payment type:', e);
          }
        }
      } else {
        alert('No member fee configured. Please add a member fee in Settings.');
      }
    } catch (error) {
      console.error('Error fetching member fee:', error);
      alert('Failed to load member fee.');
    }
  };

  const handleSelectMember = (member) => {
    setSelectedMember({
      id: member.id,
      memberId: member.member_id,
      fullName: member.full_name,
      phone: member.phone,
      type: 'existing',
    });
    setShowCreateForm(false);

    const paymentTypeStr = localStorage.getItem('mosquePaymentType');
    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
      if (paymentType && paymentType.id === 'membership') {
        if (memberFee && memberFee.member_fee) {
          localStorage.setItem('memberFeeAmount', memberFee.member_fee.toString());
        }
      }
    } catch (error) {
      console.error('Error storing member fee:', error);
    }
  };

  const handleCreateMember = async () => {
    if (!newFullName.trim()) return alert('Please enter a full name');
    if (!newMemberId.trim()) return alert('Please enter a member ID');

    try {
      setCreating(true);
      const response = await ApiService.createMember({
        member_id: newMemberId.trim(),
        full_name: newFullName.trim(),
        phone: newPhone.trim(),
      });

      const member = {
        id: response.id,
        memberId: response.member_id,
        fullName: response.full_name,
        phone: response.phone,
        type: 'new',
      };

      setSelectedMember(member);
      setShowCreateForm(false);

      const paymentTypeStr = localStorage.getItem('mosquePaymentType');
      try {
        const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;
        if (paymentType && paymentType.id === 'membership') {
          if (memberFee && memberFee.member_fee) {
            localStorage.setItem('memberFeeAmount', memberFee.member_fee.toString());
          }
        }
      } catch (error) {
        console.error('Error storing member fee:', error);
      }

      await fetchMembers();
      await fetchNextMemberId();

      setNewFullName('');
      setNewPhone('');
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to create member. Member ID might already exist.');
    } finally {
      setCreating(false);
    }
  };

  const handleNext = () => {
    if (!selectedMember) return alert('Please select or create a member first');

    localStorage.setItem('selectedMember', JSON.stringify(selectedMember));

    const paymentTypeStr = localStorage.getItem('mosquePaymentType');
    const sadakaType = localStorage.getItem('sadakaType');

    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;

      if (paymentType && paymentType.id === 'sadaka' && sadakaType === 'named') {
        navigate('/mosque/sadaka-goal', { replace: true });
      } else if (paymentType && paymentType.id === 'rent') {
        navigate('/mosque/rent-datetime', { replace: true });
      } else {
        navigate('/mosque/amount-entry', { replace: true });
      }
    } catch (error) {
      console.error('Error parsing payment type:', error);
      navigate('/mosque/amount-entry', { replace: true });
    }
  };

  // ✅ FIX: geen navigate(-1) meer (voorkomt loops)
  const handleGoBack = () => {
    try {
      const paymentTypeStr = localStorage.getItem('mosquePaymentType');
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;

      if (paymentType?.id === 'sadaka') {
        navigate('/mosque/sadaka-selection', { replace: true });
        return;
      }

      navigate('/mosque-payment', { replace: true });
    } catch {
      navigate('/mosque-payment', { replace: true });
    }
  };

  const filteredMembers = members.filter((member) => {
    const q = searchQuery.toLowerCase();
    return (
      (member.member_id || '').toLowerCase().includes(q) ||
      (member.full_name || '').toLowerCase().includes(q) ||
      (member.phone || '').toLowerCase().includes(q)
    );
  });

  const BigRedSquareBtn = ({ active, onClick, icon, nl, en, ar }) => (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 rounded-3xl border-4 transition-all shadow-2xl
        flex flex-col items-center justify-center
        min-h-[170px]
        ${active ? 'bg-red-800 text-white border-red-900 scale-[1.01]' : 'bg-red-600 text-white border-red-700 opacity-95'}
      `}
    >
      <div className="text-6xl font-extrabold leading-none">{icon}</div>
      <div className="text-3xl font-extrabold mt-4">{nl}</div>
      <div className="text-2xl font-semibold opacity-95 mt-2">{en}</div>
      <div className="text-3xl font-bold mt-3" dir="rtl">{ar}</div>
    </button>
  );

  const BigGreenContinueBtn = ({ disabled, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full rounded-3xl border-4 shadow-2xl transition-all
        min-h-[170px]
        flex flex-col items-center justify-center
        ${disabled
          ? 'bg-green-900/40 border-green-900/60 text-white/50 cursor-not-allowed'
          : 'bg-green-700 hover:bg-green-800 border-green-900 text-white active:scale-[0.99]'
        }
      `}
    >
      <div className="text-6xl font-extrabold leading-none">✅</div>
      <div className="text-4xl font-extrabold mt-4">Verder</div>
      <div className="text-3xl font-semibold opacity-95 mt-2">Continue</div>
      <div className="text-4xl font-bold mt-3" dir="rtl">متابعة</div>
    </button>
  );

  return (
    <div className="min-h-screen bg-pos-bg-primary">
      <div className="flex flex-col min-h-screen">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6">
          <button
            onClick={handleGoBack}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-extrabold text-2xl shadow-xl transition-all"
          >
            ← Back
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-4xl font-extrabold text-white">
              Select Member <span className="mx-4">|</span> Selecteer Lid <span className="mx-4">|</span> اختر عضوا
            </h1>
          </div>

          <div className="w-[180px]" />
        </div>

        {/* Selected Member Banner */}
        {selectedMember && (
          <div className="flex-shrink-0 px-8 pb-2">
            <div className="bg-green-600 bg-opacity-20 border-2 border-green-600 rounded-2xl p-3 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-green-600 font-medium mb-1">Selected Member</div>
                    <div className="text-2xl font-bold text-pos-text-primary flex items-center gap-3">
                      {selectedMember.memberId && (
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-base font-bold">
                          ID: {selectedMember.memberId}
                        </span>
                      )}
                      <span>{selectedMember.fullName}</span>
                      {selectedMember.phone && (
                        <span className="text-base text-pos-text-secondary font-normal">
                          📞 {selectedMember.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-pos-text-secondary hover:text-pos-text-primary transition-colors flex-shrink-0 ml-3"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden px-8 pb-4">
          <div className="max-w-5xl mx-auto h-full flex flex-col">

            {!showCreateForm ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-pos-bg-secondary rounded-2xl border-2 border-pos-border-primary p-4">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by ID, name or phone."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-8 py-5 text-2xl bg-pos-bg-primary border-4 border-pos-border-primary rounded-2xl text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:border-pos-interactive-hover"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-3xl">🔎</div>
                  </div>
                </div>

                {/* Members List */}
                <div className="flex-1 overflow-y-auto scrollbar-custom space-y-4">
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
                        <p className="text-2xl font-bold text-pos-text-primary mb-2">No members found</p>
                        <p className="text-lg text-pos-text-secondary">Try a different search or create a new member</p>
                      </div>
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className={`w-full text-left rounded-3xl border-4 transition-all ${
                          selectedMember?.id === member.id
                            ? 'border-green-600 bg-green-600 bg-opacity-10'
                            : 'border-pos-border-primary bg-pos-bg-primary hover:border-pos-interactive-hover'
                        }`}
                      >
                        <div className="flex items-center justify-between px-8 py-8">
                          <div className="text-3xl font-bold text-pos-text-primary flex items-center gap-5">
                            {member.member_id && (
                              <span className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xl font-extrabold">
                                ID: {member.member_id}
                              </span>
                            )}
                            <span>{member.full_name}</span>
                            {member.phone && (
                              <span className="text-xl text-pos-text-secondary font-normal">
                                📞 {member.phone}
                              </span>
                            )}
                          </div>

                          {selectedMember?.id === member.id && (
                            <div className="bg-green-600 rounded-full p-3 flex items-center justify-center flex-shrink-0 ml-3 text-white text-2xl">
                              ✓
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden bg-pos-bg-secondary rounded-2xl border-2 border-pos-border-primary">
                <div className="flex-1 overflow-y-auto scrollbar-custom px-8 py-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xl font-semibold text-pos-text-primary mb-2">Member ID *</label>
                      <input
                        type="text"
                        value={newMemberId}
                        readOnly
                        className="w-full px-6 py-3 text-2xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary"
                        disabled={creating}
                      />
                    </div>

                    <div>
                      <label className="block text-xl font-semibold text-pos-text-primary mb-2">Full Name *</label>
                      <input
                        type="text"
                        placeholder="Enter member's full name"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        className="w-full px-6 py-3 text-2xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary"
                        disabled={creating}
                      />
                    </div>

                    <div>
                      <label className="block text-xl font-semibold text-pos-text-primary mb-2">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter phone number (optional)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-6 py-3 text-2xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary"
                        disabled={creating}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCreateMember}
                        disabled={!newFullName.trim() || !newMemberId.trim() || creating}
                        className={`w-full rounded-2xl py-5 text-3xl font-extrabold border-4 shadow-xl ${
                          (!newFullName.trim() || !newMemberId.trim() || creating)
                            ? 'bg-green-900/40 border-green-900/60 text-white/50 cursor-not-allowed'
                            : 'bg-green-700 hover:bg-green-800 border-green-900 text-white'
                        }`}
                      >
                        {creating ? 'Creating Member...' : 'Create Member'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Bottom Toggle Buttons */}
        <div className="flex gap-6 px-8 pb-4">
          <BigRedSquareBtn
            active={!showCreateForm}
            onClick={() => setShowCreateForm(false)}
            icon="🔍"
            nl="Selecteer Lid"
            en="Select Member"
            ar="اختر عضوا"
          />
          <BigRedSquareBtn
            active={showCreateForm}
            onClick={() => setShowCreateForm(true)}
            icon="➕"
            nl="Nieuw Lid"
            en="Create Member"
            ar="عضو جديد"
          />
        </div>

        {/* Big Continue */}
        <div className="px-8 pb-6 pt-2">
          <BigGreenContinueBtn
            disabled={!selectedMember || loading || creating}
            onClick={handleNext}
          />
        </div>

      </div>
    </div>
  );
};

export default MemberSelectionPage;
