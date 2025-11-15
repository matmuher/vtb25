import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Check, X, ArrowLeft, Star, Info, AlertTriangle, ExternalLink, AlertCircle, AlertOctagon, Trash2, CreditCard, TrendingUp, Wallet, RefreshCw } from "lucide-react";

// Constants
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
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
      { id: 4, category: "Shopping", cashback: "3%", recommended: false, description: "3% cashback on department store and retail purchases." },
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

// Mock transaction data for cashback categories
const CASHBACK_TRANSACTIONS = {
  "Groceries": [
    { id: 1, date: "2025-11-01", merchant: "Whole Foods", amount: 85.50, bank: "TBank", cashback: 4.28, optimal: true, optimalBank: "TBank", optimalCashback: 4.28 },
    { id: 2, date: "2025-11-03", merchant: "Trader Joe's", amount: 42.30, bank: "Bank of America", cashback: 1.69, optimal: false, optimalBank: "TBank", optimalCashback: 2.12 },
    { id: 3, date: "2025-11-05", merchant: "Amazon Fresh", amount: 67.20, bank: "VBank", cashback: 4.03, optimal: true, optimalBank: "VBank", optimalCashback: 4.03 }
  ],
  "Gas": [
    { id: 4, date: "2025-11-02", merchant: "Shell", amount: 45.80, bank: "Citibank", cashback: 2.29, optimal: true, optimalBank: "Citibank", optimalCashback: 2.29 },
    { id: 5, date: "2025-11-06", merchant: "Chevron", amount: 38.90, bank: "TBank", cashback: 1.17, optimal: false, optimalBank: "Citibank", optimalCashback: 1.95 }
  ],
  "Dining": [
    { id: 6, date: "2025-11-01", merchant: "Olive Garden", amount: 78.40, bank: "UBank", cashback: 4.70, optimal: true, optimalBank: "UBank", optimalCashback: 4.70 },
    { id: 7, date: "2025-11-04", merchant: "Chipotle", amount: 24.60, bank: "Chase Bank", cashback: 0.74, optimal: false, optimalBank: "UBank", optimalCashback: 1.48 }
  ],
  "Travel": [
    { id: 8, date: "2025-10-28", merchant: "Delta Airlines", amount: 342.00, bank: "UBank", cashback: 27.36, optimal: true, optimalBank: "UBank", optimalCashback: 27.36 },
    { id: 9, date: "2025-11-07", merchant: "Booking.com", amount: 189.50, bank: "WBank", cashback: 11.37, optimal: true, optimalBank: "WBank", optimalCashback: 11.37 }
  ],
  "Entertainment": [
    { id: 10, date: "2025-11-03", merchant: "AMC Theaters", amount: 32.80, bank: "UBank", cashback: 1.31, optimal: true, optimalBank: "UBank", optimalCashback: 1.31 },
    { id: 11, date: "2025-11-05", merchant: "Spotify", amount: 10.99, bank: "VBank", cashback: 0.33, optimal: false, optimalBank: "UBank", optimalCashback: 0.44 }
  ],
  "Streaming": [
    { id: 12, date: "2025-11-01", merchant: "Netflix", amount: 15.99, bank: "WBank", cashback: 0.64, optimal: true, optimalBank: "WBank", optimalCashback: 0.64 },
    { id: 13, date: "2025-11-08", merchant: "Disney+", amount: 13.99, bank: "UBank", cashback: 0.70, optimal: true, optimalBank: "UBank", optimalCashback: 0.70 }
  ],
  "Utilities": [
    { id: 14, date: "2025-11-02", merchant: "PG&E", amount: 124.50, bank: "VBank", cashback: 8.72, optimal: true, optimalBank: "VBank", optimalCashback: 8.72 },
    { id: 15, date: "2025-11-05", merchant: "Comcast", amount: 89.99, bank: "Bank of America", cashback: 0.90, optimal: false, optimalBank: "VBank", optimalCashback: 6.30 }
  ],
  "Pharmacy": [
    { id: 16, date: "2025-11-04", merchant: "CVS", amount: 45.20, bank: "VBank", cashback: 2.26, optimal: true, optimalBank: "VBank", optimalCashback: 2.26 }
  ],
  "Books": [
    { id: 17, date: "2025-11-06", merchant: "Amazon", amount: 28.99, bank: "VBank", cashback: 1.16, optimal: true, optimalBank: "VBank", optimalCashback: 1.16 }
  ]
};

// Helper Functions
const getBankState = (bank, bankConsents) => {
  const consentData = bankConsents[bank.id];
  if (!consentData) return 'not_approved';
  if (!consentData.approved) return 'not_approved';
  return 'approved';
};

const getBankDisplayInfo = (bank, bankConsents, isAnalyzed) => {
  const state = getBankState(bank, bankConsents);
  switch (state) {
    case 'not_approved':
      return { text: "Consents not approved", color: "text-yellow-400", icon: AlertTriangle };
    case 'approved':
      return { text: isAnalyzed ? bank.value : "??$", color: "text-green-400", icon: null };
    default:
      return { text: "Consents not approved", color: "text-yellow-400", icon: AlertTriangle };
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

const OptimalCardPopup = ({ isOpen, onClose, selectedCategory, onCategoryChange }) => {
  if (!isOpen) return null;
  // Find the best bank for the selected category
  let bestBank = null;
  let bestCashbackRate = 0;
  Object.entries(BANK_CASHBACKS).forEach(([bankName, bankData]) => {
    const cashbackForCategory = bankData.cashbacks.find(c => c.category === selectedCategory);
    if (cashbackForCategory) {
      const cashbackRate = parseFloat(cashbackForCategory.cashback);
      if (cashbackRate > bestCashbackRate) {
        bestCashbackRate = cashbackRate;
        bestBank = bankName;
      }
    }
  });
  // Get all unique categories
  const allCategories = [...new Set(Object.values(BANK_CASHBACKS).flatMap(bank => bank.cashbacks.map(c => c.category)))];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">Optimal Card Payment</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="mb-6">
          <div className="text-left mb-2">
            <div className="text-gray-700 font-medium">Category (Edit if guessed wrong)</div>
          </div>
          <div className="flex items-center justify-center">
            <button
              onClick={onCategoryChange}
              className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#337357] focus:border-transparent text-center flex items-center justify-center gap-2 min-w-[200px]"
            >
              <span className="text-gray-800">{selectedCategory}</span>
              <div className="flex items-center gap-1">
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </button>
          </div>
          <div className="text-left mb-2 mt-4">
            <div className="text-gray-700 font-medium">Best bank</div>
          </div>
          <div className="text-center text-xl text-[#337357] mb-6 flex items-center justify-center gap-2">
            <span>⭐</span>
            <span>{bestBank}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
        >
          Pay with {bestBank}
        </button>
      </div>
    </div>
  );
};

const CategoryDropdown = ({ isOpen, onClose, categories, onSelect, selectedCategory }) => {
  if (!isOpen) return null;
  // Find the best bank for the selected category
  let bestBank = null;
  let bestCashbackRate = 0;
  Object.entries(BANK_CASHBACKS).forEach(([bankName, bankData]) => {
    const cashbackForCategory = bankData.cashbacks.find(c => c.category === selectedCategory);
    if (cashbackForCategory) {
      const cashbackRate = parseFloat(cashbackForCategory.cashback);
      if (cashbackRate > bestCashbackRate) {
        bestCashbackRate = cashbackRate;
        bestBank = bankName;
      }
    }
  });
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">Select Category</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="mb-4">
          <div className="text-center text-xl font-bold text-gray-800 mb-2">{selectedCategory}</div>
          <div className="text-center text-lg text-[#337357] mb-4 flex items-center justify-center gap-2">
            <span>⭐</span>
            <span>Best bank: {bestBank}</span>
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${
                category === selectedCategory 
                  ? 'bg-[#337357] text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);
  const [showOptimalCardPopup, setShowOptimalCardPopup] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
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
  const [showApproveAllPopup, setShowApproveAllPopup] = useState(false);
  const [showApproveSinglePopup, setShowApproveSinglePopup] = useState(false);
  const [popupBank, setPopupBank] = useState(null);
  const [expandedBanks, setExpandedBanks] = useState({});
  const [mainButtonState, setMainButtonState] = useState('wait');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingForConfirmation, setIsAnalyzingForConfirmation] = useState(false);
  const [isUpdatingConsents, setIsUpdatingConsents] = useState(false);
  const dropdownContainerRef = useRef(null);
  const historyDropdownContainerRef = useRef(null);
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
          approved: false
        }
      }));
    }
  };

  // Navigation handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!login) {
      alert("Please enter your login.");
      return;
    }
    setCurrentPage('bank-selection');
    // if (false) {; // to test frontend
    //   try{
    //     const response = await fetch(`${API_BASE_URL}/api/login`, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         login: login,
    //         password: password
    //       }),
    //     });
    //     if (response.ok) {
    //       console.log("Login successful from backend");
    //       setCurrentPage('bank-selection');
    //     } else {
    //       const errorData = await response.json();
    //       console.error("Login failed:", response.status, errorData.detail || "Invalid credentials or server error");
    //       alert(errorData.detail || "Login failed. Please check your credentials.");
    //     }
    //   } catch (error) {
    //     console.error("Network error or error parsing response:", error);
    //     alert("Could not connect to the server. Please try again later.");
    //   }
    // }
  };

  const confirmBanks = () => {
    setCurrentPage('main');
    if (areAllBanksValid(chosenBanks, bankConsents)) {
      setMainButtonState('analyze');
    } else {
      setMainButtonState('wait');
    }
  };

  const goBackToMain = () => {
    setCurrentPage('main');
    setSelectedBank(null);
    setSelectedCategory(null);
  };
  
  const goBackToCategories = () => {
    setCurrentPage('main');
    setSelectedCategory(null);
  };

  // Main bank selection handler
  const handleMainBankSelect = (bank) => {
    const state = getBankState(bank, bankConsents);
    if (state === 'not_approved') {
      setPopupBank(bank);
      setShowApproveSinglePopup(true);
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

  // Category selection handler
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentPage('category-transactions');
  };

  // Analysis handlers
  const handleConfirmClick = () => {
    if (!areAllBanksValid(chosenBanks, bankConsents)) {
      setShowInvalidBanksPopup(true);
      return;
    }
    setMainButtonState('analyze');
    setIsAnalyzingForConfirmation(true);
    setTimeout(() => {
      setIsAnalyzingForConfirmation(false);
      setIsAnalyzed(true);
      setMainButtonState('confirm');
    }, 5000); // 5 seconds
  };

  const handleConfirmCashback = () => {
    setShowConfirmCashbackPopup(true);
  };

  const confirmCashbackSelection = () => {
    setShowConfirmCashbackPopup(false);
    setMainButtonState('current');
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

  const approveSingleBankConsent = () => {
    if (popupBank) {
      setBankConsents(prev => ({
        ...prev,
        [popupBank.id]: {
          ...prev[popupBank.id],
          approved: true
        }
      }));
    }
    setShowApproveSinglePopup(false);
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

  // Update consent statuses from backend
  const updateConsentStatuses = async () => {
    if (chosenBanks.length === 0) return;
    
    setIsUpdatingConsents(true);
    
    try {
      // In a real implementation, this would be the actual API call:
      const response = await fetch(`${API_BASE_URL}/api/select_banks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_login: login,
          selected_banks: chosenBanks.map(bank => bank.name.toLowerCase())
        }),
      });
      
      if (!response.ok) {
        console.error("Failed to update consent statuses");
        return;
      }
      
      const data = await response.json();
      
      console.log(data)

      const newConsents = { ...bankConsents };
      data.statuses.forEach(status => {
        const bank = chosenBanks.find(b => b.name.toLowerCase() === status.bank_name);
        if (bank) {
          newConsents[bank.id] = {
            ...newConsents[bank.id],
            approved: status.status === "authorized"
          };
        }
      });
      
      setBankConsents(newConsents);
      
      // Mock implementation for demonstration
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      // // For demonstration, we'll update statuses randomly
      // const newConsents = { ...bankConsents };
      // chosenBanks.forEach(bank => {
      //   // Simulate backend response - some banks might be approved, others not
      //   const isApproved = Math.random() > 0.3; // 70% chance of approval for demo
      //   newConsents[bank.id] = {
      //     ...newConsents[bank.id],
      //     approved: isApproved
      //   };
      // });
      
      // setBankConsents(newConsents);
    } catch (error) {
      console.error("Failed to update consent statuses:", error);
    } finally {
      setIsUpdatingConsents(false);
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
  
  const handleHistoryMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setIsHistoryDropdownOpen(true);
  };
  
  const handleHistoryMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsHistoryDropdownOpen(false);
    }, 300);
  };
  
  const handleHistoryDropdownButtonClick = () => {
    setIsHistoryDropdownOpen(!isHistoryDropdownOpen);
  };

  // Category dropdown handlers
  const handleCategoryDropdownOpen = () => {
    setShowCategoryDropdown(true);
  };
  
  const handleCategorySelectFromDropdown = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
  };

  // Check if all banks are approved and transition to analyze state
  useEffect(() => {
    if (mainButtonState === 'wait' && areAllBanksValid(chosenBanks, bankConsents)) {
      setMainButtonState('analyze');
      setIsAnalyzingForConfirmation(true);
      setTimeout(() => {
        setIsAnalyzingForConfirmation(false);
        setIsAnalyzed(true);
        setMainButtonState('confirm');
      }, 5000); // 5 seconds
    }
  }, [chosenBanks, bankConsents, mainButtonState]);

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

  // Calculate current income from categories
  const calculateCurrentIncome = () => {
    let total = 0;
    Object.values(CASHBACK_TRANSACTIONS).forEach(transactions => {
      transactions.forEach(transaction => {
        total += transaction.cashback;
      });
    });
    return total;
  };

  // Get categories with cashback totals
  const getCategoryCashbacks = () => {
    const categories = {};
    Object.entries(CASHBACK_TRANSACTIONS).forEach(([category, transactions]) => {
      const totalCashback = transactions.reduce((sum, transaction) => sum + transaction.cashback, 0);
      const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const optimalCount = transactions.filter(t => t.optimal).length;
      const totalCount = transactions.length;
      categories[category] = {
        totalCashback,
        totalSpent,
        optimalCount,
        totalCount
      };
    });
    return categories;
  };

  const currentIncomeValue = calculateCurrentIncome();
  const categoryCashbacks = getCategoryCashbacks();
  const allCategories = [...new Set(Object.values(BANK_CASHBACKS).flatMap(bank => bank.cashbacks.map(c => c.category)))];

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

  if (currentPage === 'category-transactions') {
    const transactions = CASHBACK_TRANSACTIONS[selectedCategory] || [];
    const totalCashback = transactions.reduce((sum, t) => sum + t.cashback, 0);
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex flex-col p-6">
        <button 
          onClick={goBackToCategories}
          className="flex items-center gap-2 text-white mb-6 w-fit"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Categories
        </button>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{selectedCategory}</h1>
          <p className="text-yellow-400 text-xl font-semibold">{totalCashback.toFixed(2)}$ earned</p>
          <p className="text-gray-400 text-sm">Total spent: {totalSpent.toFixed(2)}$</p>
        </div>
        <div className="space-y-3 flex-1">
          <h2 className="text-xl font-semibold text-white mb-4">Transactions</h2>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div 
                key={transaction.id}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 ${
                  transaction.optimal ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-red-500/50 bg-red-500/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{transaction.merchant}</span>
                      {!transaction.optimal && (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.amount.toFixed(2)}$
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Bank: {transaction.bank}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${transaction.optimal ? 'text-green-400' : 'text-yellow-400'}`}>
                      {transaction.cashback.toFixed(2)}$
                    </div>
                    {!transaction.optimal && (
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">
                          If pay with {transaction.optimalBank}, would be +{transaction.optimalCashback.toFixed(2)}$
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              No transactions found for this category
            </div>
          )}
        </div>
      </div>
    );
  }

  // Popups
  return (
    <>
      <OptimalCardPopup 
        isOpen={showOptimalCardPopup} 
        onClose={() => setShowOptimalCardPopup(false)} 
        selectedCategory={selectedCategory || "Groceries"}
        onCategoryChange={handleCategoryDropdownOpen}
      />
      <CategoryDropdown
        isOpen={showCategoryDropdown}
        onClose={() => setShowCategoryDropdown(false)}
        categories={allCategories}
        onSelect={handleCategorySelectFromDropdown}
        selectedCategory={selectedCategory || "Groceries"}
      />
      <Popup
        isOpen={showNeedAnalyzePopup}
        onClose={() => setShowNeedAnalyzePopup(false)}
        title="Consents Not Approved"
        icon={AlertTriangle}
      >
        <p className="text-gray-600 mb-6">
          You need to approve consents for all banks before viewing cashback details.
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
        title="Consents Not Approved"
        icon={AlertTriangle}
      >
        <p className="text-gray-600 mb-4">
          The following banks do not have approved consents:
        </p>
        <div className="max-h-40 overflow-y-auto mb-4">
          {chosenBanks
            .filter(bank => getBankState(bank, bankConsents) !== 'approved')
            .map(bank => (
              <div key={bank.id} className="p-2 bg-gray-100 rounded mb-1">
                <span className="font-medium">{bank.name}</span> - Consents not approved
              </div>
            ))}
        </div>
        <p className="text-gray-600 mb-6">
          Please approve consents in bank apps or remove banks to start analysis.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInvalidBanksPopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </Popup>
      <Popup
        isOpen={showApproveAllPopup}
        onClose={() => setShowApproveAllPopup(false)}
        title="Approve All Consents"
        icon={AlertTriangle}
      >
        <p className="text-gray-600 mb-6">
          Approve all consents or delete unwanted banks before proceeding.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowApproveAllPopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </Popup>
      <Popup
        isOpen={showApproveSinglePopup}
        onClose={() => setShowApproveSinglePopup(false)}
        title="Approve Consent"
        icon={AlertTriangle}
      >
        <p className="text-gray-600 mb-4">
          Please approve the consent for <span className="font-bold">{popupBank?.name}</span> to access cashback features.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowApproveSinglePopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Close
          </button>
          <button
            onClick={approveSingleBankConsent}
            className="flex-1 bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4" />
            Approve Consent
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
          {mainButtonState === 'wait' && (
            <button 
              onClick={handleConfirmClick}
              className="bg-gray-500 text-white font-bold py-6 px-6 rounded-3xl shadow-lg text-xl flex items-center justify-center w-full max-w-md mx-auto cursor-pointer"
            >
              Pls, approve consents ✍🏻
            </button>
          )}
          {mainButtonState === 'analyze' && (
            <button 
              onClick={handleConfirmClick}
              disabled={isAnalyzingForConfirmation}
              className={`${
                isAnalyzingForConfirmation 
                  ? 'bg-purple-700 animate-pulse' 
                  : 'bg-gradient-to-r from-[#EE4266] to-[#FF6B8B] hover:from-[#D93A5C] hover:to-[#E55A7B]'
              } text-white font-bold py-6 px-6 rounded-3xl shadow-lg ${
                isAnalyzingForConfirmation ? '' : 'hover:shadow-xl transform hover:scale-105'
              } transition-all duration-200 ease-in-out text-xl flex items-center justify-center w-full max-w-md mx-auto ${
                isAnalyzingForConfirmation ? '' : 'disabled:cursor-not-allowed disabled:transform-none'
              }`}
            >
              {isAnalyzingForConfirmation ? 'We gently analyze your cashbacks...' : 'CONFIRM CASHBACKS'}
            </button>
          )}
          {mainButtonState === 'confirm' && (
            <button 
              onClick={handleConfirmCashback}
              className="bg-[#FFD23F] hover:bg-[#E6BD37] text-gray-900 font-bold py-6 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-xl flex items-center justify-center w-full max-w-md mx-auto"
            >
              CONFIRM CASHBACKS
            </button>
          )}
          {mainButtonState === 'current' && (
            <button 
              onClick={() => setShowOptimalCardPopup(true)}
              className="bg-gradient-to-r from-[#337357] to-[#4CAF7D] text-white font-bold py-6 px-6 rounded-3xl shadow-lg text-xl flex items-center justify-center w-full max-w-md mx-auto"
            >
              PAY WITH OPTIMAL CARD
            </button>
          )}
        </div>
        
        {/* Fixed elements at 2/4 from top - MOVED HIGHER */}
        <div className="mt-24 md:mt-32 w-full max-w-md space-y-6">
          {mainButtonState === 'current' ? (
            <>
              <div 
                className="relative"
                ref={historyDropdownContainerRef}
                onMouseEnter={handleHistoryMouseEnter}
                onMouseLeave={handleHistoryMouseLeave}
              >
                <button
                  onClick={handleHistoryDropdownButtonClick}
                  className="w-full bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-200 flex justify-between items-center border border-white/20"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-white text-xl" />
                    <span className="text-white font-medium">
                      Cashback history
                    </span>
                  </div>
                  {isHistoryDropdownOpen ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </button>
                {(isHistoryDropdownOpen) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 z-10 overflow-hidden max-h-60 overflow-y-auto">
                    {Object.entries(categoryCashbacks).map(([category, data]) => (
                      <button
                        key={category}
                        onClick={() => {
                          handleCategorySelect(category);
                          setIsHistoryDropdownOpen(false);
                        }}
                        className="w-full text-left p-4 hover:bg-white/5 transition-colors duration-150 flex justify-between items-center border-b border-white/10 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-400 font-semibold">
                            {data.totalCashback.toFixed(2)}$
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md border border-white/20">
                <div className="flex justify-between items-center">
                  <p className="text-gray-300 text-lg">Current income</p>
                  <p className="text-3xl font-bold text-yellow-400">{currentIncomeValue.toFixed(2)}$</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xl">🏦</span>
                    <span className="text-white font-medium">Cashback per bank</span>
                    {hasIncompleteConsents(chosenBanks, bankConsents) && (
                      <AlertOctagon className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <button
                    onClick={updateConsentStatuses}
                    disabled={isUpdatingConsents}
                    className="text-white hover:text-gray-300 disabled:opacity-50"
                  >
                    {isUpdatingConsents ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                  </button>
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
                  <p className="text-3xl font-bold text-yellow-400">{isAnalyzed ? (chosenBanks.reduce((sum, bank) => sum + parseFloat(bank.value.replace("$", "").trim()), 0)) + "$" : "??$"}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
