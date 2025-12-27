import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChartBar, HiUsers, HiCreditCard, HiCog } from 'react-icons/hi';
import MemberManager from '../../components/mosque/MemberManager';
import PaymentManager from '../../components/mosque/PaymentManager';
import SettingsManager from '../../components/mosque/SettingsManager';
import Dashboard from '../../components/mosque/Dashboard';
import { KioskButton } from '../../components/mosque';

const MosqueAdminPanel = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    const handleGoBack = () => {
        navigate('/mosque');
    };

    return (
        <div className="min-h-screen bg-pos-bg-primary flex flex-col">
            {/* Header */}
            <div className="bg-pos-bg-secondary border-b-2 border-pos-border-primary p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pos-text-primary">Mosque Admin Panel</h1>
                    <div className="flex items-center gap-4 sm:gap-6 sm:w-24">
                        <KioskButton
                            variant="secondary"
                            size="large"
                            onClick={handleGoBack}
                            // disabled={loading}
                            icon={true}
                        >
                            <img src="/icon kiosk/terug.png" alt="Go Back" className="rounded-2xl" />
                            {/* Go Back */}
                        </KioskButton>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-6">
                    <button
                        className={`px-4 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-2xl sm:text-2xl transition-colors flex items-center gap-2 sm:gap-3 ${activeTab === 'dashboard'
                            ? 'bg-pos-bg-primary text-pos-text-primary'
                            : 'bg-pos-interactive-primary text-pos-text-primary hover:bg-pos-interactive-hover'
                            }`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <HiChartBar className="text-2xl sm:text-3xl" />
                        Dashboard
                    </button>
                    <button
                        className={`px-4 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-2xl sm:text-2xl transition-colors flex items-center gap-2 sm:gap-3 ${activeTab === 'members'
                            ? 'bg-pos-bg-primary text-pos-text-primary'
                            : 'bg-pos-interactive-primary text-pos-text-primary hover:bg-pos-interactive-hover'
                            }`}
                        onClick={() => setActiveTab('members')}
                    >
                        <HiUsers className="text-2xl sm:text-3xl" />
                        Members
                    </button>
                    <button
                        className={`px-4 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-2xl sm:text-2xl transition-colors flex items-center gap-2 sm:gap-3 ${activeTab === 'payments'
                            ? 'bg-pos-bg-primary text-pos-text-primary'
                            : 'bg-pos-interactive-primary text-pos-text-primary hover:bg-pos-interactive-hover'
                            }`}
                        onClick={() => setActiveTab('payments')}
                    >
                        <HiCreditCard className="text-2xl sm:text-3xl" />
                        Payments
                    </button>
                    <button
                        className={`px-4 py-3 sm:px-8 sm:py-4 rounded-xl font-bold text-2xl sm:text-2xl transition-colors flex items-center gap-2 sm:gap-3 ${activeTab === 'settings'
                            ? 'bg-pos-bg-primary text-pos-text-primary'
                            : 'bg-pos-interactive-primary text-pos-text-primary hover:bg-pos-interactive-hover'
                            }`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <HiCog className="text-2xl sm:text-3xl" />
                        Settings
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-custom p-4 sm:p-6">
                    {activeTab === 'dashboard' && <Dashboard />}
                    {activeTab === 'members' && <MemberManager />}
                    {activeTab === 'payments' && <PaymentManager />}
                    {activeTab === 'settings' && <SettingsManager />}
                </div>
            </div>
        </div>
    );
};

export default MosqueAdminPanel;

