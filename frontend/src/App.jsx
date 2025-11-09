import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Check, X, ArrowLeft, Star, Info, AlertTriangle, ExternalLink, AlertCircle, AlertOctagon, Trash2 } from "lucide-react";

// Constants
const CONSENTS = [
  { id: 'read_cashbacks', label: "Read personal cashbacks" },
  { id: 'choose_cashbacks', label: "Choose cashbacks" },
  { id: 'read_transactions', label: "Read transactions history" }
];

const BANK_CASHBACKS = {
  "TBank": {
    maxSelections: 3,
    bankInfo: "TBank offers competitive cashback rates on everyday spending categories with no annual fee.",
    cashbacks: [
      { id: 1, category: "Groceries", cashback: "5%", recommended: true, description: "Get 5% back on all grocery purchases including supermarkets and grocery delivery services." },
      { id: 2, category: "Gas", cashback: "3%", recommended: true, description: "Earn 3% cashback on fuel purchases at gas stations nationwide." },
      { id: 3, category: "Online Shopping", cashback: "2%", recommended: false, description: "2% cashback on purchases from major online retailers and e-commerce platforms." },
      { id: 4, category: "Dining", cashback: "4%", recommended: false, description: "4% cashback on restaurant dining, takeout, and food delivery services." },
      { id: 5, category: "Entertainment", cashback: "3%", recommended: false, description: "3% cashback on movies, concerts, streaming services, and entertainment venues." }
    ]
  },
  "UBank": {
    maxSelections: 4,
    bankInfo: "UBank provides premium rewards with higher cashback rates and exclusive partner offers for frequent spenders.",
    cashbacks: [
      { id: 1, category: "Travel", cashback: "8%", recommended: true, description: "8% cashback on flights, hotels, car rentals, and travel booking platforms." },
      { id: 2, category: "Dining", cashback: "6%", recommended: true, description: "6% cashback at restaurants, cafes, bars, and food delivery apps." },
      { id: 3, category: "Entertainment", cashback: "4%", recommended: true, description: "4% cashback on movies, concerts, sporting events, and entertainment subscriptions." },
      { id: 4, category: "Shopping", cashback: "3%", recommended: false, description: "3% cashback on department stores, clothing, and general retail purchases." },
      { id: 5, category: "Utilities", cashback: "2%", recommended: false, description: "2% cashback on electricity, water, internet, and phone bills." },
      { id: 6, category: "Streaming", cashback: "5%", recommended: false, description: "5% cashback on Netflix, Spotify, Disney+, and other streaming subscriptions." }
    ]
  },
  "VBank": {
    maxSelections: 5,
    bankInfo: "VBank specializes in high-value cashback categories with flexible redemption options and no spending caps.",
    cashbacks: [
      { id: 1, category: "Utilities", cashback: "7%", recommended: true, description: "7% cashback on all utility bills including electricity, gas, water, and internet services." },
      { id: 2, category: "Pharmacy", cashback: "5%", recommended: true, description: "5% cashback on prescription medications, over-the-counter drugs, and pharmacy purchases." },
      { id: 3, category: "Books", cashback: "4%", recommended: true, description: "4% cashback on physical books, e-books, audiobooks, and educational materials." },
      { id: 4, category: "Streaming", cashback: "3%", recommended: false, description: "3% cashback on all streaming entertainment and music subscription services." },
      { id: 5, category: "Groceries", cashback: "6%", recommended: false, description: "6% cashback on grocery shopping at supermarkets and specialty food stores." },
      { id: 6, category: "Gas", cashback: "4%", recommended: false, description: "4% cashback on fuel purchases at all gas stations and convenience stores." },
      { id: 7, category: "Travel", cashback: "2%", recommended: false, description: "2% cashback on travel expenses including flights, hotels, and transportation." }
    ]
  },
  "Chase Bank": {
    maxSelections: 3,
    bankInfo: "Chase Bank offers rotating quarterly categories with bonus cashback opportunities and flexible redemption.",
    cashbacks: [
      { id: 1, category: "Travel", cashback: "5%", recommended: true, description: "5% cashback on travel bookings through Chase Ultimate Rewards portal." },
      { id: 2, category: "Gas", cashback: "4%", recommended: true, description: "4% cashback on gas station purchases with no quarterly limits." },
      { id: 3, category: "Dining", cashback: "3%", recommended: false, description: "3% cashback on restaurant purchases including delivery and takeout." },
      { id: 4, category: "Online Shopping", cashback: "2%", recommended: false, description: "2% cashback on online purchases with select partner retailers." }
    ]
  },
  "Bank of America": {
    maxSelections: 4,
    bankInfo: "Bank of America provides Preferred Rewards members with enhanced cashback rates and exclusive benefits.",
    cashbacks: [
      { id: 1, category: "Online Shopping", cashback: "6%", recommended: true, description: "6% cashback on online purchases through Bank of America's shopping portal." },
      { id: 2, category: "Groceries", cashback: "4%", recommended: true, description: "4% cashback on grocery store purchases with no spending limits." },
      { id: 3, category: "Entertainment", cashback: "2%", recommended: false, description: "2% cashback on movie theaters, concerts, and entertainment venues." },
      { id: 4, category: "Dining", cashback: "3%", recommended: false, description: "3% cashback on restaurant dining and food delivery services." },
      { id: 5, category: "Utilities", cashback: "1%", recommended: false, description: "1% cashback on utility bill payments including electricity and water." }
    ]
  },
  "Citibank": {
    maxSelections: 3,
    bankInfo: "Citibank offers customizable cashback categories with the ability to choose your top spending categories.",
    cashbacks: [
      { id: 1, category: "Gas", cashback: "5%", recommended: true, description: "5% cashback on gas purchases up to $600 per quarter." },
      { id: 2, category: "Restaurants", cashback: "4%", recommended: true, description: "4% cashback on dining at restaurants and cafes nationwide." },
      { id: 3, category: "Travel", cashback: "3%", recommended: false, description: "3% cashback on travel purchases including flights and hotels." },
      { id: 4, category: "Shopping", cashback: "2%", recommended: false, description: "2% cashback on department store and retail shopping." }
    ]
  },
  "WBank": {
    maxSelections: 4,
    bankInfo: "WBank provides premium cashback rates with no annual fee and unlimited redemption options.",
    cashbacks: [
      { id: 1, category: "Travel", cashback: "6%", recommended: true, description: "6% cashback on all travel-related purchases including flights and hotels." },
      { id: 2, category: "Dining", cashback: "5%", recommended: true, description: "5% cashback on restaurant dining, takeout, and food delivery." },
      { id: 3, category: "Streaming", cashback: "4%", recommended: true, description: "4% cashback on streaming services like Netflix, Spotify, and Hulu." },
      { id: 4, category: "Groceries", cashback: "3%", recommended: false, description: "3% cashback on grocery purchases at supermarkets and stores." },
      { id: 5, category: "Gas", cashback: "2%", recommended: false, description: "2% cashback on fuel purchases at gas stations." }
    ]
  }
};

const ALL_BANKS = [
  { id: 1, name: "ABank", value: "12 $" },
  { id: 2, name: "Bank of America", value: "8 $" },
  { id: 3, name: "Chase Bank", value: "15 $" },
  { id: 4, name: "Citibank", value: "20 $" },
  { id: 5, name: "DBank", value: "6 $" },
  { id: 6, name: "EBank", value: "18 $" },
  { id: 7, name: "FBank", value: "9 $" },
  { id: 8, name: "GBank", value: "22 $" },
  { id: 9, name: "HBank", value: "14 $" },
  { id: 10, name: "IBank", value: "11 $" },
  { id: 11, name: "JBank", value: "16 $" },
  { id: 12, name: "KBank", value: "7 $" },
  { id: 13, name: "LBank", value: "19 $" },
  { id: 14, name: "MBank", value: "13 $" },
  { id: 15, name: "NBank", value: "21 $" },
  { id: 16, name: "OBank", value: "5 $" },
  { id: 17, name: "PBank", value: "17 $" },
  { id: 18, name: "QBank", value: "10 $" },
  { id: 19, name: "RBank", value: "23 $" },
  { id: 20, name: "SBank", value: "4 $" },
  { id: 21, name: "TBank", value: "10 $" },
  { id: 22, name: "UBank", value: "45 $" },
  { id: 23, name: "VBank", value: "44 $" },
  { id: 24, name: "WBank", value: "25 $" },
  { id: 25, name: "XBank", value: "3 $" },
  { id: 26, name: "YBank", value: "2 $" },
  { id: 27, name: "ZBank", value: "1 $" }
];

// Helper Functions
const getBankState = (bank, bankConsents) => {
  const consentData = bankConsents[bank.id];
  if (!consentData) return 'no_consent';
  const allConsentsGiven = consentData.read_cashbacks && 
                           consentData.choose_cashbacks && 
                           consentData.read_transactions;
  if (!allConsentsGiven) return 'no_consent';
  if (!consentData.approved) return 'not_approved';
  return 'approved';
};

const getBankDisplayInfo = (bank, bankConsents, isAnalyzed) => {
  const state = getBankState(bank, bankConsents);
  switch (state) {
    case 'no_consent':
      return { text: "No consent", color: "text-red-400", icon: AlertCircle };
    case 'not_approved':
      return { text: "Consents not approved", color: "text-yellow-400", icon: AlertTriangle };
    case 'approved':
      return { text: isAnalyzed ? bank.value : "??$", color: "text-green-400", icon: null };
    default:
      return { text: "No consent", color: "text-red-400", icon: AlertCircle };
  }
};

const hasIncompleteConsents = (chosenBanks, bankConsents) => {
  return chosenBanks.some(bank => getBankState(bank, bankConsents) !== 'approved');
};

const areAllBanksValid = (chosenBanks, bankConsents) => {
  return chosenBanks.length > 0 && chosenBanks.every(bank => getBankState(bank, bankConsents) === 'approved');
};

const getCurrentIncome = (totalAmount) => totalAmount * 0.7;

// Components
const AnimatedAnalysisButton = ({ isAnalyzing, onClick, disabled }) => {
  if (isAnalyzing) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gradient-to-r from-[#EE4266] to-[#FF6B8B] text-white font-bold py-6 px-6 rounded-3xl shadow-lg text-xl flex items-center justify-center animate-pulse">
          ANALYSIS IN PROGRESS
        </div>
      </div>
    );
  }
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="bg-gradient-to-r from-[#EE4266] to-[#FF6B8B] hover:from-[#D93A5C] hover:to-[#E55A7B] disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-6 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-xl flex items-center justify-center w-full max-w-md mx-auto disabled:cursor-not-allowed disabled:transform-none"
    >
      ANALYZE SPENDS
    </button>
  );
};

const Popup = ({ isOpen, onClose, title, icon: Icon, children, className = "" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-2xl p-6 w-full max-w-md ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <Icon className="w-6 h-6 text-[#EE4266]" />
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
};

const ConfirmCashbackPopup = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-[#FFD23F]" />
          <h3 className="text-xl font-bold text-gray-800">Confirm Cashbacks</h3>
        </div>
        <p className="text-gray-600 mb-6">
          After confirmation cashback categories will be set for this month. They can't be edited later.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#FFD23F] hover:bg-[#E6BD37] text-gray-900 font-medium py-3 px-4 rounded-xl transition-all duration-200"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [selectedBank, setSelectedBank] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [chosenBanks, setChosenBanks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCashbacks, setSelectedCashbacks] = useState({});
  const [bankConsents, setBankConsents] = useState({});
  const [showConsentPopup, setShowConsentPopup] = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [showInvalidBanksPopup, setShowInvalidBanksPopup] = useState(false);
  const [showNeedAnalyzePopup, setShowNeedAnalyzePopup] = useState(false);
  const [showConfirmCashbackPopup, setShowConfirmCashbackPopup] = useState(false);
  const [popupBank, setPopupBank] = useState(null);
  const [expandedBanks, setExpandedBanks] = useState({});
  const [mainButtonState, setMainButtonState] = useState('analyze');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const dropdownContainerRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  // Bank selection handlers
  const handleBankToggle = (bank) => {
    if (chosenBanks.find(b => b.id === bank.id)) {
      setChosenBanks(chosenBanks.filter(b => b.id !== bank.id));
      setSelectedCashbacks(prev => {
        const newSelected = { ...prev };
        delete newSelected[bank.name];
        return newSelected;
      });
      setBankConsents(prev => {
        const newConsents = { ...prev };
        delete newConsents[bank.id];
        return newConsents;
      });
      setExpandedBanks(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[bank.id];
        return newExpanded;
      });
    } else {
      setChosenBanks([...chosenBanks, bank]);
      const bankData = BANK_CASHBACKS[bank.name];
      if (bankData) {
        const recommendedIds = bankData.cashbacks
          .filter(c => c.recommended)
          .map(c => c.id)
          .slice(0, bankData.maxSelections);
        setSelectedCashbacks(prev => ({
          ...prev,
          [bank.name]: recommendedIds
        }));
      }
      setBankConsents(prev => ({
        ...prev,
        [bank.id]: {
          read_cashbacks: false,
          choose_cashbacks: false,
          read_transactions: false,
          approved: false
        }
      }));
    }
  };

  // Consent handlers
  const toggleConsent = (bankId, consentId) => {
    setBankConsents(prev => ({
      ...prev,
      [bankId]: {
        ...prev[bankId],
        [consentId]: !prev[bankId][consentId],
        approved: false
      }
    }));
  };

  const toggleAllConsents = (bankId) => {
    const currentConsents = bankConsents[bankId] || {};
    const allChecked = currentConsents.read_cashbacks && 
                       currentConsents.choose_cashbacks && 
                       currentConsents.read_transactions;
    setBankConsents(prev => ({
      ...prev,
      [bankId]: {
        read_cashbacks: !allChecked,
        choose_cashbacks: !allChecked,
        read_transactions: !allChecked,
        approved: false
      }
    }));
  };

  const toggleAllBanksConsents = () => {
    const allChecked = chosenBanks.every(bank => {
      const consentData = bankConsents[bank.id] || {};
      return consentData.read_cashbacks && 
             consentData.choose_cashbacks && 
             consentData.read_transactions;
    });
    
    const newConsents = {};
    chosenBanks.forEach(bank => {
      newConsents[bank.id] = {
        read_cashbacks: !allChecked,
        choose_cashbacks: !allChecked,
        read_transactions: !allChecked,
        approved: false
      };
    });
    setBankConsents(newConsents);
  };

  const toggleBankExpansion = (bankId) => {
    setExpandedBanks(prev => ({
      ...prev,
      [bankId]: !prev[bankId]
    }));
  };

  // Navigation handlers
  const handleLogin = (e) => {
    e.preventDefault();
    if (login && password) {
      setCurrentPage('bank-selection');
    }
  };

  const confirmBanks = () => setCurrentPage('consents');
  const sendConsents = () => setCurrentPage('main');
  const goBackToMain = () => {
    setCurrentPage('main');
    setSelectedBank(null);
  };

  // Main bank selection handler
  const handleMainBankSelect = (bank) => {
    const state = getBankState(bank, bankConsents);
    if (state === 'no_consent') {
      setCurrentPage('consents');
      setExpandedBanks({ [bank.id]: true });
    } else if (state === 'not_approved') {
      setPopupBank(bank);
      setShowApprovalPopup(true);
    } else if (state === 'approved') {
      if (!isAnalyzed) {
        setShowNeedAnalyzePopup(true);
        return;
      }
      setSelectedBank(bank);
      setCurrentPage('bank-details');
      setIsDropdownOpen(false);
    }
  };

  // Analysis handlers
  const handleAnalyzeClick = () => {
    if (!areAllBanksValid(chosenBanks, bankConsents)) {
      setShowInvalidBanksPopup(true);
      return;
    }
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsAnalyzed(true);
      setMainButtonState('confirm');
    }, 2000);
  };

  const handleConfirmClick = () => {
    setShowConfirmCashbackPopup(true);
  };

  const confirmCashbackSelection = () => {
    setShowConfirmCashbackPopup(false);
    setMainButtonState('current');
  };

  const handleFixConsents = () => {
    setShowInvalidBanksPopup(false);
    setCurrentPage('main');
    setIsDropdownOpen(true);
  };

  const approveInBankApp = () => {
    if (popupBank) {
      setBankConsents(prev => ({
        ...prev,
        [popupBank.id]: {
          ...prev[popupBank.id],
          approved: true
        }
      }));
    }
    setShowApprovalPopup(false);
    setPopupBank(null);
  };

  const goToConsents = () => {
    setCurrentPage('consents');
    setShowConsentPopup(false);
    setPopupBank(null);
  };

  // Cashback handlers
  const handleCashbackToggle = (bankName, cashbackId) => {
    if (mainButtonState === 'current') return;
    const bankData = BANK_CASHBACKS[bankName];
    const currentSelected = selectedCashbacks[bankName] || [];
    const isSelected = currentSelected.includes(cashbackId);
    const maxSelections = bankData.maxSelections;
    if (isSelected) {
      setSelectedCashbacks(prev => ({
        ...prev,
        [bankName]: currentSelected.filter(id => id !== cashbackId)
      }));
    } else {
      if (currentSelected.length < maxSelections) {
        setSelectedCashbacks(prev => ({
          ...prev,
          [bankName]: [...currentSelected, cashbackId]
        }));
      }
    }
  };

  // Dropdown handlers
  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setIsDropdownOpen(true);
  };
  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 300);
  };
  const handleDropdownButtonClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  // Filtered banks (without sorting by chosen state)
  const filteredBanks = ALL_BANKS.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculated values
  const totalAmount = chosenBanks.reduce((sum, bank) => {
    const state = getBankState(bank, bankConsents);
    return state === 'approved' && isAnalyzed ? sum + parseFloat(bank.value.replace("$", "").trim()) : sum;
  }, 0);
  const currentIncome = getCurrentIncome(totalAmount);

  // Screens
  if (currentPage === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Login</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Login</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#337357] focus:border-transparent"
                placeholder="Enter your login"
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#337357] focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (currentPage === 'bank-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex flex-col p-4">
        {/* Fixed Header Section */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] p-4 border-b border-white/20">
          <h1 className="text-2xl font-bold text-white mb-4 text-center">Select Your Banks</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/20 border border-white/30 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#337357] focus:border-transparent"
              placeholder="Search banks..."
            />
          </div>
        </div>

        {/* Scrollable Bank List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-24 mt-32">
          {filteredBanks.map((bank) => {
            const isSelected = chosenBanks.find(b => b.id === bank.id);
            return (
              <div
                key={bank.id}
                onClick={() => handleBankToggle(bank)}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex justify-between items-center cursor-pointer transition-all duration-200 hover:bg-white/20 ${
                  isSelected ? 'border-[#337357] bg-[#337357]/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-white text-xl">🏦</span>
                  <span className="text-white font-medium">{bank.name}</span>
                </div>
                {isSelected ? (
                  <Check className="w-5 h-5 text-[#337357]" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Fixed Footer Button */}
        <div className="fixed bottom-4 left-4 right-4">
          <button
            onClick={confirmBanks}
            disabled={chosenBanks.length === 0}
            className="w-full bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-lg disabled:cursor-not-allowed disabled:transform-none"
          >
            Confirm Banks ({chosenBanks.length})
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'consents') {
    const allBanksChecked = chosenBanks.every(bank => {
      const consentData = bankConsents[bank.id] || {};
      return consentData.read_cashbacks && 
             consentData.choose_cashbacks && 
             consentData.read_transactions;
    });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex flex-col p-4">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] p-4 border-b border-white/20">
          <h1 className="text-2xl font-bold text-white text-center">Bank Consents</h1>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-24 mt-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-white text-xl">🔒</span>
                <span className="text-white font-medium text-lg">Apply consent for all banks</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAllBanksConsents}
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                    allBanksChecked 
                      ? 'border-[#337357] bg-[#337357]' 
                      : 'border-gray-400'
                  }`}
                >
                  {allBanksChecked && <Check className="w-3 h-3 text-white" />}
                </button>
              </div>
            </div>
            
            {/* Individual bank consents as sub-elements */}
            <div className="mt-4 space-y-3">
              {chosenBanks.map((bank) => {
                const bankConsentData = bankConsents[bank.id] || {};
                const allConsentsChecked = bankConsentData.read_cashbacks && 
                                         bankConsentData.choose_cashbacks && 
                                         bankConsentData.read_transactions;
                return (
                  <div key={bank.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-white text-xl">🏦</span>
                        <span className="text-white font-medium">{bank.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAllConsents(bank.id)}
                          className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                            allConsentsChecked 
                              ? 'border-[#337357] bg-[#337357]' 
                              : 'border-gray-400'
                          }`}
                        >
                          {allConsentsChecked && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className="text-gray-300 text-sm">Apply consent for this bank</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed Footer Button */}
        <div className="fixed bottom-4 left-4 right-4">
          <button
            onClick={sendConsents}
            className="w-full bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-bold py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
          >
            Send Consents
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'bank-details') {
    const bankData = BANK_CASHBACKS[selectedBank.name];
    const currentSelected = selectedCashbacks[selectedBank.name] || [];
    const maxSelections = bankData?.maxSelections || 0;
    const remainingSelections = Math.max(0, maxSelections - currentSelected.length);
    const isEditingDisabled = mainButtonState === 'current';

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex flex-col p-6">
        <button 
          onClick={goBackToMain}
          className="flex items-center gap-2 text-white mb-6 w-fit"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Banks
        </button>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{selectedBank.name}</h1>
          <p className="text-yellow-400 text-xl font-semibold">{isAnalyzed ? selectedBank.value : "??$"}</p>
          {!isEditingDisabled && (
            <div className="flex items-center gap-2 mt-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 text-sm">
                Select up to {maxSelections} cashback categories ({remainingSelections} remaining)
              </span>
            </div>
          )}
          {isEditingDisabled && (
            <div className="flex items-center gap-2 mt-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">
                Editing disabled in current income mode
              </span>
            </div>
          )}
          {bankData?.bankInfo && (
            <p className="text-gray-400 text-sm mt-3">{bankData.bankInfo}</p>
          )}
        </div>
        
        <div className="space-y-3 flex-1">
          <h2 className="text-xl font-semibold text-white mb-4">Cashback Offers</h2>
          {bankData?.cashbacks.map((cashback) => {
            const isSelected = currentSelected.includes(cashback.id);
            const canSelect = !isEditingDisabled && (isSelected || currentSelected.length < maxSelections);
            return (
              <div 
                key={cashback.id}
                onClick={() => canSelect && handleCashbackToggle(selectedBank.name, cashback.id)}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex justify-between items-start cursor-pointer transition-all duration-200 hover:bg-white/20 ${
                  isSelected ? 'border-[#337357] bg-[#337357]/20' : ''
                } ${cashback.recommended ? 'bg-emerald-500/10 border-emerald-500' : ''} ${
                  !canSelect && !isSelected ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center mt-1 ${
                    isSelected 
                      ? 'border-[#337357] bg-[#337357]' 
                      : 'border-gray-400'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {cashback.category}
                      </div>
                      {cashback.recommended && (
                        <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{cashback.description}</p>
                  </div>
                </div>
                <span className={`font-bold text-lg ${
                  cashback.recommended ? 'text-emerald-400' : 'text-[#337357]'
                }`}>
                  {cashback.cashback}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Popups
  return (
    <>
      <Popup
        isOpen={showNeedAnalyzePopup}
        onClose={() => setShowNeedAnalyzePopup(false)}
        title="Analysis Required"
        icon={AlertCircle}
      >
        <p className="text-gray-600 mb-6">
          You need to analyze your spends first before viewing cashback details.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNeedAnalyzePopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </Popup>

      <Popup
        isOpen={showInvalidBanksPopup}
        onClose={() => setShowInvalidBanksPopup(false)}
        title="Invalid Bank Configuration"
        icon={AlertCircle}
      >
        <p className="text-gray-600 mb-6">
          Some banks are not properly configured. Please fix consents for all banks or remove invalid banks before proceeding.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInvalidBanksPopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Close
          </button>
          <button
            onClick={handleFixConsents}
            className="flex-1 bg-gradient-to-r from-[#EE4266] to-[#FF6B8B] hover:from-[#D93A5C] hover:to-[#E55A7B] text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
          >
            Fix Consents
          </button>
        </div>
      </Popup>

      <Popup
        isOpen={showApprovalPopup}
        onClose={() => setShowApprovalPopup(false)}
        title="Approve Consents"
        icon={AlertTriangle}
      >
        <p className="text-gray-600 mb-6">
          Please approve the consents in your bank's app to access cashback features.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowApprovalPopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Close
          </button>
          <button
            onClick={approveInBankApp}
            className="flex-1 bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4" />
            Approve in Bank App
          </button>
        </div>
      </Popup>

      <ConfirmCashbackPopup
        isOpen={showConfirmCashbackPopup}
        onClose={() => setShowConfirmCashbackPopup(false)}
        onConfirm={confirmCashbackSelection}
      />

      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex flex-col items-center p-4 overflow-hidden">
        {/* Main Button at 1/4 from top */}
        <div className="mt-16 md:mt-24 w-full flex justify-center">
          {mainButtonState === 'analyze' && (
            <AnimatedAnalysisButton 
              isAnalyzing={isAnalyzing}
              onClick={handleAnalyzeClick}
              disabled={chosenBanks.length === 0}
            />
          )}
          {mainButtonState === 'confirm' && (
            <button 
              onClick={handleConfirmClick}
              className="bg-[#FFD23F] hover:bg-[#E6BD37] text-gray-900 font-bold py-6 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-xl flex items-center justify-center w-full max-w-md mx-auto"
            >
              CONFIRM CASHBACKS
            </button>
          )}
          {mainButtonState === 'current' && (
            <div className="bg-gradient-to-r from-[#337357] to-[#4CAF7D] text-white font-bold py-6 px-6 rounded-3xl shadow-lg text-xl flex items-center justify-center w-full max-w-md mx-auto">
              CURRENT INCOME: {currentIncome.toFixed(1)}$
            </div>
          )}
        </div>

        {/* Fixed elements at 2/4 from top - MOVED HIGHER */}
        <div className="mt-24 md:mt-32 w-full max-w-md space-y-6">
          {mainButtonState === 'current' && (
            <div className="text-center text-gray-300 text-sm md:text-base">
              Cashbacks for next month are not accessible yet.
              <br />
              We will notify you asap
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white text-xl">🏦</span>
              <span className="text-white font-medium">Cashback per bank</span>
              {hasIncompleteConsents(chosenBanks, bankConsents) && (
                <AlertOctagon className="w-4 h-4 text-yellow-400" />
              )}
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {chosenBanks.length > 0 ? (
                chosenBanks.map((bank) => {
                  const displayInfo = getBankDisplayInfo(bank, bankConsents, isAnalyzed);
                  const IconComponent = displayInfo.icon;
                  return (
                    <div
                      key={bank.id}
                      onClick={() => handleMainBankSelect(bank)}
                      className="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBankToggle(bank);
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="text-white font-medium">{bank.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {IconComponent && <IconComponent className={`w-4 h-4 ${displayInfo.color}`} />}
                        <span className={`font-semibold ${displayInfo.color}`}>
                          {displayInfo.text}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-400 py-4">No banks selected</div>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md border border-white/20">
            <div className="flex justify-between items-center">
              <p className="text-gray-300 text-lg">Predicted income</p>
              <p className="text-3xl font-bold text-yellow-400">{isAnalyzed ? totalAmount + "$" : "??$"}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
