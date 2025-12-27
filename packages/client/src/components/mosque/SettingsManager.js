import { useState, useEffect } from 'react';
import ApiService from '../../services/api';

const SettingsManager = () => {
  const [rentalCharge, setRentalCharge] = useState(null);
  const [memberFee, setMemberFee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    rentalCharge: '',
    memberFee: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [rentalResponse, memberFeeResponse] = await Promise.all([
        ApiService.getRentalCharges(),
        ApiService.getMemberFees()
      ]);

      const rentalCharges = rentalResponse.data || [];
      const memberFees = memberFeeResponse.data || [];

      // Get the first/latest entry (assuming single setting)
      if (rentalCharges.length > 0) {
        setRentalCharge(rentalCharges[0]);
        setFormData(prev => ({ ...prev, rentalCharge: rentalCharges[0].rental_charge }));
      }

      if (memberFees.length > 0) {
        setMemberFee(memberFees[0]);
        setFormData(prev => ({ ...prev, memberFee: memberFees[0].member_fee }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    setFormData(prev => ({ ...prev, [name]: numericValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.rentalCharge && (isNaN(formData.rentalCharge) || parseFloat(formData.rentalCharge) < 0)) {
      newErrors.rentalCharge = 'Rental charge must be a valid positive number';
    }
    
    if (formData.memberFee && (isNaN(formData.memberFee) || parseFloat(formData.memberFee) < 0)) {
      newErrors.memberFee = 'Member fee must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveRentalCharge = async () => {
    if (!validateForm()) return;
    if (!formData.rentalCharge) {
      alert('Please enter a rental charge');
      return;
    }

    try {
      setSaving(true);
      const rentalChargeValue = parseFloat(formData.rentalCharge);

      if (rentalCharge && rentalCharge.id) {
        // Update existing
        await ApiService.updateRentalCharge(rentalCharge.id, { rental_charge: rentalChargeValue });
        alert('Rental charge updated successfully');
      } else {
        // Create new
        await ApiService.createRentalCharge({ rental_charge: rentalChargeValue });
        alert('Rental charge created successfully');
      }
      fetchSettings();
    } catch (error) {
      console.error('Error saving rental charge:', error);
      alert(error.message || 'Failed to save rental charge');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMemberFee = async () => {
    if (!validateForm()) return;
    if (!formData.memberFee) {
      alert('Please enter a member fee');
      return;
    }

    try {
      setSaving(true);
      const memberFeeValue = parseFloat(formData.memberFee);

      if (memberFee && memberFee.id) {
        // Update existing
        await ApiService.updateMemberFee(memberFee.id, { member_fee: memberFeeValue });
        alert('Member fee updated successfully');
      } else {
        // Create new
        await ApiService.createMemberFee({ member_fee: memberFeeValue });
        alert('Member fee created successfully');
      }
      fetchSettings();
    } catch (error) {
      console.error('Error saving member fee:', error);
      alert(error.message || 'Failed to save member fee');
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pos-text-primary">Settings & Pricing</h2>

      {loading ? (
        <div className="text-center py-12 text-pos-text-muted text-xl sm:text-2xl">Loading settings...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rental Charge */}
          <div className="bg-pos-bg-secondary rounded-xl p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-pos-text-primary mb-4">Rental Charge</h3>
            <p className="text-base sm:text-lg text-pos-text-secondary mb-6">
              Set the daily rental charge for space/kitchen rentals
            </p>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">
                  Daily Rental Charge (€)
                </label>
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    name="rentalCharge"
                    value={formData.rentalCharge}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={`flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none ${
                      errors.rentalCharge 
                        ? 'border-red-500' 
                        : 'border-pos-border-secondary focus:border-pos-interactive-primary'
                    }`}
                  />
                  <span className="px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-tertiary text-pos-text-primary rounded-xl flex items-center text-lg sm:text-xl font-bold">
                    €
                  </span>
                </div>
                {errors.rentalCharge && (
                  <p className="text-red-500 text-base sm:text-lg mt-2 font-medium">{errors.rentalCharge}</p>
                )}
                {rentalCharge && (
                  <p className="text-sm sm:text-base text-pos-text-secondary mt-2">
                    Current: €{parseFloat(rentalCharge.rental_charge || 0).toFixed(2)}/day
                  </p>
                )}
              </div>

              <button
                onClick={handleSaveRentalCharge}
                disabled={saving}
                className="w-full px-6 py-4 sm:px-8 sm:py-5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Rental Charge'}
              </button>
            </div>
          </div>

          {/* Member Fee */}
          <div className="bg-pos-bg-secondary rounded-xl p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-pos-text-primary mb-4">Member Fee</h3>
            <p className="text-base sm:text-lg text-pos-text-secondary mb-6">
              Set the membership fee amount
            </p>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">
                  Member Fee (€)
                </label>
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    name="memberFee"
                    value={formData.memberFee}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={`flex-1 px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none ${
                      errors.memberFee 
                        ? 'border-red-500' 
                        : 'border-pos-border-secondary focus:border-pos-interactive-primary'
                    }`}
                  />
                  <span className="px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-tertiary text-pos-text-primary rounded-xl flex items-center text-lg sm:text-xl font-bold">
                    €
                  </span>
                </div>
                {errors.memberFee && (
                  <p className="text-red-500 text-base sm:text-lg mt-2 font-medium">{errors.memberFee}</p>
                )}
                {memberFee && (
                  <p className="text-sm sm:text-base text-pos-text-secondary mt-2">
                    Current: €{parseFloat(memberFee.member_fee || 0).toFixed(2)}
                  </p>
                )}
              </div>

              <button
                onClick={handleSaveMemberFee}
                disabled={saving}
                className="w-full px-6 py-4 sm:px-8 sm:py-5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Member Fee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-600 bg-opacity-10 border-2 border-blue-600 rounded-xl p-4 sm:p-6">
        <h4 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-blue-600 mb-3 sm:mb-4">ℹ️ Information</h4>
        <ul className="text-base sm:text-2xl text-pos-text-secondary space-y-2">
          <li>• Rental charges are applied per day for space/kitchen rentals</li>
          <li>• Member fees are charged when processing membership payments</li>
          <li>• Changes take effect immediately for new transactions</li>
          <li>• You can update these values at any time</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingsManager;

