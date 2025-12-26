import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiService from "../../services/api";
import { KioskButton } from "../../components/mosque";
import FixedBackButton from "../../components/mosque/FixedBackButton";

const MemberSelectionPage = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    loadMembers();
    loadNextMemberId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getMembers();
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading members:", e);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNextMemberId = async () => {
    try {
      const nextId = await ApiService.getNextMemberId();
      if (nextId) setNewMemberId(nextId);
    } catch (e) {
      console.error("Error loading next member id:", e);
    }
  };

  const handleCreateMember = async () => {
    if (!newFullName.trim() || !newMemberId.trim()) return;
    try {
      setCreating(true);
      const created = await ApiService.createMember({
        member_id: newMemberId,
        full_name: newFullName,
        phone: newPhone,
      });

      await loadMembers();
      await loadNextMemberId();

      if (created?.id) {
        setSelectedMember({
          id: created.id,
          memberId: created.member_id,
          fullName: created.full_name,
          phone: created.phone,
        });
      }

      setNewFullName("");
      setNewPhone("");
      setShowCreateForm(false);
    } catch (e) {
      console.error("Error creating member:", e);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectMember = (member) => {
    setSelectedMember({
      id: member.id,
      memberId: member.member_id,
      fullName: member.full_name,
      phone: member.phone,
    });
  };

  const handleNext = () => {
    if (!selectedMember) return;

    localStorage.setItem("selectedMember", JSON.stringify(selectedMember));

    const paymentTypeStr = localStorage.getItem("mosquePaymentType");
    const sadakaType = localStorage.getItem("sadakaType");

    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;

      if (paymentType && paymentType.id === "sadaka" && sadakaType === "named") {
        navigate("/mosque/sadaka-goal");
      } else if (paymentType && paymentType.id === "rent") {
        navigate("/mosque/rent-datetime");
      } else {
        navigate("/mosque/amount-entry");
      }
    } catch (error) {
      console.error("Error parsing payment type:", error);
      navigate("/mosque/amount-entry");
    }
  };

  const handleGoBack = () => {
    const paymentTypeStr = localStorage.getItem("mosquePaymentType");
    const sadakaType = localStorage.getItem("sadakaType");

    try {
      const paymentType = paymentTypeStr ? JSON.parse(paymentTypeStr) : null;

      if (paymentType && paymentType.id === "sadaka" && sadakaType === "named") {
        navigate("/mosque/sadaka-selection");
      } else {
        navigate("/mosque/mosque-payment");
      }
    } catch (error) {
      console.error("Error parsing payment type:", error);
      navigate("/mosque/mosque-payment");
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone && member.phone.includes(searchQuery)) ||
      (member.member_id && member.member_id.includes(searchQuery))
  );

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col max-w-5xl mx-auto">
      {/* NIEUW: vaste rode terugknop links-onder */}
      <FixedBackButton onClick={handleGoBack} disabled={loading || creating} />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex-shrink-0 px-8 pt-8 pb-2">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-pos-text-primary mb-3">
              <span>Select Member</span>
              <span className="mx-3">|</span>
              <span>Selecteer Lid</span>
              <span className="mx-3">|</span>
              <span>اختر عضوا</span>
            </h1>
          </div>
        </div>

        {/* Selected Member Banner */}
        {selectedMember && (
          <div className="flex-shrink-0 px-8 pb-2">
            <div className="bg-green-600 bg-opacity-20 border-2 border-green-600 rounded-2xl p-3 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-green-600 font-medium mb-1">Selected Member</div>
                    <div className="text-2xl font-bold text-pos-text-primary flex items-center gap-3">
                      {selectedMember.memberId && (
                        <span className="bg-blue-600 text-white px-3 py-.5 rounded-lg text-base font-bold">
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
            <div className="flex gap-3 mb-2">
              <button
                onClick={() => setShowCreateForm(false)}
                className={`flex-1 py-2 rounded-xl font-semibold text-lg transition-all border-2 ${
                  !showCreateForm
                    ? "bg-pos-bg-secondary text-pos-text-primary border-pos-interactive-hover shadow-lg"
                    : "bg-pos-interactive-primary text-pos-text-secondary border-pos-border-primary"
                }`}
              >
                Find Existing <span>Member</span>
                <span className="mx-3">|</span>
                <span>Lid</span>
                <span className="mx-3">|</span>
                <span> العضو</span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className={`flex-1 py-2 rounded-xl font-semibold text-lg transition-all border-2 ${
                  showCreateForm
                    ? "bg-pos-bg-secondary text-pos-text-primary border-pos-interactive-hover shadow-lg"
                    : "bg-pos-interactive-primary text-pos-text-secondary border-pos-border-primary"
                }`}
              >
                Create <span> New Member</span>
                <span className="mx-3">|</span>
                <span>Nieuw lid</span>
                <span className="mx-3">|</span>
                <span> عضو جديد</span>
              </button>
            </div>

            {!showCreateForm ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-pos-bg-secondary rounded-2xl border-2 border-pos-border-primary p-3">
                {/* Search Bar */}
                <div className="mb-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by ID, name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-6 py-2 text-lg bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:border-pos-interactive-hover"
                    />
                    <svg
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-pos-text-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
                        <svg className="w-20 h-20 text-pos-text-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <p className="text-xl text-pos-text-secondary">{searchQuery ? "No members found" : "No members available"}</p>
                      </div>
                    </div>
                  ) : (
                    filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className={`w-full px-5 py-3 rounded-xl border-2 transition-all text-left ${
                          selectedMember?.id === member.id
                            ? "bg-pos-interactive-hover border-pos-interactive-hover shadow-lg"
                            : "bg-pos-bg-primary border-pos-border-primary hover:border-pos-interactive-hover hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-xl font-semibold text-pos-text-primary flex items-center gap-3">
                              {member.member_id && (
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold">
                                  ID: {member.member_id}
                                </span>
                              )}
                              <span>{member.full_name}</span>
                              {member.phone && (
                                <span className="text-base text-pos-text-secondary font-normal">
                                  📞 {member.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedMember?.id === member.id && (
                            <div className="bg-green-600 rounded-full p-1 flex items-center justify-center flex-shrink-0 ml-3">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
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
              <div className="flex-1 flex flex-col overflow-hidden bg-pos-bg-secondary rounded-2xl border-2 border-pos-border-primary">
                <div className="flex-1 overflow-y-auto scrollbar-custom px-8 py-3">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-lg font-semibold text-pos-text-primary mb-2">Member ID *</label>
                      <input
                        type="text"
                        placeholder="Auto-generated ID"
                        value={newMemberId}
                        readOnly
                        onChange={(e) => setNewMemberId(e.target.value)}
                        className="w-full px-6 py-2 text-xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:border-pos-interactive-hover"
                        disabled={creating}
                      />
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-pos-text-primary mb-1">Full Name *</label>
                      <input
                        type="text"
                        placeholder="Enter member's full name"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        className="w-full px-6 py-2 text-xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:border-pos-interactive-hover"
                        disabled={creating}
                      />
                    </div>

                    <div>
                      <label className="block text-lg font-semibold text-pos-text-primary mb-1">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter phone number (optional)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-6 py-2 text-xl bg-pos-bg-primary border-2 border-pos-border-primary rounded-xl text-pos-text-primary placeholder-pos-text-disabled focus:outline-none focus:border-pos-interactive-hover"
                        disabled={creating}
                      />
                    </div>

                    <div className="pt-2">
                      <KioskButton
                        variant="success"
                        size="small"
                        onClick={handleCreateMember}
                        disabled={!newFullName.trim() || !newMemberId.trim() || creating}
                        fullWidth
                      >
                        {creating ? "Creating Member..." : "Create Member"}
                      </KioskButton>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex width-full justify-center px-8 pb-6 pt-2">
          <KioskButton variant="success" size="small" onClick={handleNext} disabled={!selectedMember || loading || creating} fullWidth>
            Continue
          </KioskButton>
        </div>
      </div>
    </div>
  );
};

export default MemberSelectionPage;
