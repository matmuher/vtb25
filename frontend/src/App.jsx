// Add this directive at the very top
'use client';

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Check, X, ArrowLeft, Star, Info, AlertTriangle, ExternalLink, AlertCircle, AlertOctagon, Trash2, CreditCard, TrendingUp, Wallet, RefreshCw, LogOut } from "lucide-react";
import transactionsMock from './mock/transactions_new.json';

// --- NEW: Storage Helper Functions with Reduced Logging ---
let storageEnvironmentChecked = false; // Flag to ensure environment is logged only once
const logStorageEnvironment = () => {
  if (!storageEnvironmentChecked) {
    const isExt = typeof browser !== 'undefined' && typeof browser.storage !== 'undefined';
    console.log(isExt ? "Using browser.storage (Extension environment)" : "Using localStorage (Web environment)");
    storageEnvironmentChecked = true;
    return isExt;
  }
  // Return the result based on the initial check
  return typeof browser !== 'undefined' && typeof browser.storage !== 'undefined';
};

const isExtensionEnvironment = () => {
  return logStorageEnvironment();
};

const loadFromStorage = async (key, defaultValue) => {
  if (isExtensionEnvironment()) {
    try {
      const result = await browser.storage.local.get(key);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (e) {
      console.error("Error loading from browser.storage:", e);
      return defaultValue;
    }
  } else {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }
};

const saveToStorage = async (key, value) => {
  if (isExtensionEnvironment()) {
    try {
      await browser.storage.local.set({ [key]: value });
    } catch (e) {
      console.error("Error saving to browser.storage:", e);
    }
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const removeFromStorage = async (key) => {
  if (isExtensionEnvironment()) {
    try {
      await browser.storage.local.remove(key);
    } catch (e) {
      console.error("Error removing from browser.storage:", e);
    }
  } else {
    localStorage.removeItem(key);
  }
};

// --- END NEW: Storage Helper Functions with Reduced Logging ---

// Constants
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
console.log('Full import.meta.env:', import.meta.env);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
const CONSENTS = [
  { id: 'read_cashbacks', label: "Чтение персональных кэшбэков" },
  { id: 'choose_cashbacks', label: "Выбор кэшбэков" },
  { id: 'read_transactions', label: "Чтение истории транзакций" }
];
const ALL_BANKS = [
  { id: 1, name: "Abank", value: "12 ₽" },
  { id: 6, name: "Ebank", value: "18 ₽" },
  { id: 12, name: "Kbank", value: "7 ₽" },
  { id: 20, name: "Sbank", value: "4 ₽" },
  { id: 21, name: "Tbank", value: "10 ₽" },
  { id: 23, name: "Vbank", value: "44 ₽" },
  { id: 27, name: "Zbank", value: "1 ₽" }
];

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
      return { text: "Согласия не одобрены", color: "text-yellow-400", icon: AlertTriangle };
    case 'approved':
      return { text: isAnalyzed ? bank.value : "?? ₽", color: "text-green-400", icon: null };
    default:
      return { text: "Согласия не одобрены", color: "text-yellow-400", icon: AlertTriangle };
  }
};
const hasIncompleteConsents = (chosenBanks, bankConsents) => {
  return chosenBanks.some(bank => getBankState(bank, bankConsents) !== 'approved');
};
const areAllBanksValid = (chosenBanks, bankConsents) => {
  return chosenBanks.length > 0 && chosenBanks.every(bank => getBankState(bank, bankConsents) === 'approved');
};
const getCurrentIncome = (totalAmount) => totalAmount * 0.7;

// Helper function for quick login - теперь устанавливает состояние, но не вызывает updateConsentStatuses сразу
const handleQuickLogin = (setLogin, setIsLoggedIn, setChosenBanks, setBankConsents, setCurrentPage) => {
  const quickLoginName = "team089-1";
  // Указанные банки из последнего файла
  const quickBankNames = ["Sbank", "Abank"];
  const quickBanks = ALL_BANKS.filter(bank => quickBankNames.includes(bank.name));
  setLogin(quickLoginName);
  setIsLoggedIn(true);
  setChosenBanks(quickBanks);
  // Initialize consents for these banks as not approved (standard flow)
  const initialConsents = {};
  quickBanks.forEach(bank => {
    initialConsents[bank.id] = { approved: false };
  });
  setBankConsents(initialConsents);
  setCurrentPage('main'); // Переход на главную страницу сразу после установки банков
};

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
          <h3 className="text-xl font-bold text-gray-800">Подтвердить кэшбэки</h3>
        </div>
        <p className="text-gray-600 mb-6">
          После подтверждения мы установим выбранные категории кэшбеков на этот месяц. Выбрали всё, что хотели?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Нет
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#FFD23F] hover:bg-[#E6BD37] text-gray-900 font-medium py-3 px-4 rounded-xl transition-all duration-200"
          >
            Да
          </button>
        </div>
      </div>
    </div>
  );
};
const OptimalCardPopup = ({ isOpen, onClose, selectedCategory, onCategoryChange, bankCashbacks }) => {
  if (!isOpen) return null;
  // Find the best bank for the selected category
  let bestBank = null;
  let bestCashbackRate = 0;
  // Iterate through all bank cashbacks to find the best rate for the selected category
  Object.values(bankCashbacks || {}).forEach(bankData => {
    const cashbackForCategory = bankData.cashbacks?.find(c => c.category === selectedCategory);
    if (cashbackForCategory) {
      const cashbackRate = typeof cashbackForCategory.cashback === 'string'
        ? parseFloat(cashbackForCategory.cashback)
        : cashbackForCategory.percent || 0;
      if (cashbackRate > bestCashbackRate) {
        bestCashbackRate = cashbackRate;
        bestBank = cashbackForCategory.bank_name || bankData.bankInfo?.split(' ')[0] || 'Неизвестный';
      }
    }
  });

  // Get all unique categories
  const allCategories = [...new Set(Object.values(bankCashbacks || {}).flatMap(bank =>
    bank.cashbacks?.map(c => c.category) || []
  ))];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">Оплата оптимальной картой</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="mb-6">
          <div className="text-left mb-2">
            <div className="text-gray-700 font-medium">Категория (поменяйте, если мы угадали неправильно 😉)</div>
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
            <div className="text-gray-700 font-medium">Лучший банк</div>
          </div>
          <div className="text-center text-xl text-[#337357] mb-6 flex items-center justify-center gap-2">
            <span>✭</span>
            <span>{bestBank || 'Не найден'}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
        >
          Оплатить с {bestBank || 'Лучший банк'}
        </button>
      </div>
    </div>
  );
};
const CategoryDropdown = ({ isOpen, onClose, categories, onSelect, selectedCategory, bankCashbacks }) => {
  if (!isOpen) return null;
  // Find the best bank for the selected category
  let bestBank = null;
  let bestCashbackRate = 0;
  // Iterate through all bank cashbacks to find the best rate for the selected category
  Object.values(bankCashbacks || {}).forEach(bankData => {
    const cashbackForCategory = bankData.cashbacks?.find(c => c.category === selectedCategory);
    if (cashbackForCategory) {
      const cashbackRate = typeof cashbackForCategory.cashback === 'string'
        ? parseFloat(cashbackForCategory.cashback)
        : cashbackForCategory.percent || 0;
      if (cashbackRate > bestCashbackRate) {
        bestCashbackRate = cashbackRate;
        bestBank = cashbackForCategory.bank_name || bankData.bankInfo?.split(' ')[0] || 'Неизвестный';
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800">Выбрать категорию</h3>
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
            <span>✭</span>
            <span>Лучший банк: {bestBank || 'Не найден'}</span>
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
  // --- NEW: State Initialization (Synchronous Defaults) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Initialize as false, will be set after loading
  const [login, setLogin] = useState('');
  const [currentPage, setCurrentPage] = useState('auth'); // Default to auth initially
  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHistoryDropdownOpen, setIsHistoryDropdownOpen] = useState(false);
  const [showOptimalCardPopup, setShowOptimalCardPopup] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [chosenBanks, setChosenBanks] = useState([]); // Initialize as empty array
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCashbacks, setSelectedCashbacks] = useState({}); // Initialize as empty object
  const [bankConsents, setBankConsents] = useState({}); // Initialize as empty object
  const [showConsentPopup, setShowConsentPopup] = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);
  const [showInvalidBanksPopup, setShowInvalidBanksPopup] = useState(false);
  const [showNeedAnalyzePopup, setShowNeedAnalyzePopup] = useState(false);
  const [showConfirmCashbackPopup, setShowConfirmCashbackPopup] = useState(false);
  const [showApproveAllPopup, setShowApproveAllPopup] = useState(false);
  const [showApproveSinglePopup, setShowApproveSinglePopup] = useState(false);
  const [popupBank, setPopupBank] = useState(null);
  const [expandedBanks, setExpandedBanks] = useState({}); // Initialize as empty object
  const [mainButtonState, setMainButtonState] = useState('wait'); // Default state
  const [isAnalyzed, setIsAnalyzed] = useState(false); // Initialize as false
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingForConfirmation, setIsAnalyzingForConfirmation] = useState(false); // Initialize as false
  const [analysisStartTime, setAnalysisStartTime] = useState(null); // Initialize as null
  const [isUpdatingConsents, setIsUpdatingConsents] = useState(false);
  const [BANK_CASHBACKS, setBankCashbacks] = useState({}); // Initialize as empty object
  const [cashbackTransactions, setCashbackTransactions] = useState({}); // Initialize as empty object
  // --- END NEW: State Initialization ---

  const dropdownContainerRef = useRef(null);
  const historyDropdownContainerRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  // Ref to keep track of the previous page
  const prevPageRef = useRef(currentPage);

  // NEW EFFECT: Load initial state from storage asynchronously on component mount
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const savedLogin = await loadFromStorage('userLogin', null);
        const loggedIn = !!savedLogin; // Check if login exists in storage

        setIsLoggedIn(loggedIn);
        setLogin(savedLogin || '');

        if (loggedIn) {
          // Only load other states if logged in
          setCurrentPage(await loadFromStorage('currentPage', 'main'));
          setSelectedBank(await loadFromStorage('selectedBank', null));
          setSelectedCategory(await loadFromStorage('selectedCategory', null));
          setChosenBanks(prev => {
            // Ensure default value is always an array
            const loaded = loadFromStorage('chosenBanks', []);
            return Array.isArray(loaded) ? loaded : [];
          });
          setSelectedCashbacks(prev => {
            // Ensure default value is always an object
            const loaded = loadFromStorage('selectedCashbacks', {});
            return typeof loaded === 'object' && loaded !== null && !Array.isArray(loaded) ? loaded : {};
          });
          setBankConsents(prev => {
            // Ensure default value is always an object
            const loaded = loadFromStorage('bankConsents', {});
            return typeof loaded === 'object' && loaded !== null && !Array.isArray(loaded) ? loaded : {};
          });
          setExpandedBanks(prev => {
            // Ensure default value is always an object
            const loaded = loadFromStorage('expandedBanks', {});
            return typeof loaded === 'object' && loaded !== null && !Array.isArray(loaded) ? loaded : {};
          });

          const storedButtonState = await loadFromStorage('mainButtonState', null);
          if (storedButtonState === 'current' || storedButtonState === 'confirm' || storedButtonState === 'analyze') {
            setMainButtonState(storedButtonState);
          } else if (await loadFromStorage('isAnalyzed', false)) {
            setMainButtonState('confirm');
          } else {
            setMainButtonState('analyze');
          }

          setIsAnalyzed(await loadFromStorage('isAnalyzed', false));
          setIsAnalyzingForConfirmation(await loadFromStorage('isAnalyzingForConfirmation', false));
          const savedTime = await loadFromStorage('analysisStartTime', null);
          setAnalysisStartTime(savedTime ? parseInt(savedTime, 10) : null);

          setBankCashbacks(prev => {
            // Ensure default value is always an object
            const loaded = loadFromStorage('BANK_CASHBACKS', {});
            return typeof loaded === 'object' && loaded !== null && !Array.isArray(loaded) ? loaded : {};
          });
          setCashbackTransactions(prev => {
            // Ensure default value is always an object
            const loaded = loadFromStorage('cashbackTransactions', {});
            return typeof loaded === 'object' && loaded !== null && !Array.isArray(loaded) ? loaded : {};
          });
        } else {
          // If not logged in, ensure currentPage is 'auth'
          setCurrentPage('auth');
        }
      } catch (error) {
        console.error("Error loading initial state:", error);
        // Optionally, set an error state or show a message
        // For now, we'll just log and let the component use default initial states
      }
    };

    loadInitialState();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to save state to storage
  const saveStateToStorage = async () => {
    if (isLoggedIn) { // Only save if logged in
      await saveToStorage('userLogin', login);
      await saveToStorage('currentPage', currentPage);
      await saveToStorage('selectedBank', selectedBank);
      await saveToStorage('selectedCategory', selectedCategory);
      await saveToStorage('chosenBanks', chosenBanks);
      await saveToStorage('selectedCashbacks', selectedCashbacks);
      await saveToStorage('bankConsents', bankConsents);
      await saveToStorage('expandedBanks', expandedBanks);
      await saveToStorage('mainButtonState', mainButtonState);
      await saveToStorage('isAnalyzed', isAnalyzed);
      await saveToStorage('isAnalyzingForConfirmation', isAnalyzingForConfirmation);
      if (analysisStartTime !== null) {
        await saveToStorage('analysisStartTime', analysisStartTime);
      } else {
        await removeFromStorage('analysisStartTime'); // Clear if not analyzing
      }
      await saveToStorage('BANK_CASHBACKS', BANK_CASHBACKS);
      await saveToStorage('cashbackTransactions', cashbackTransactions);
    }
  };

  // Function to clear state from storage
  const clearStateFromStorage = async () => {
    await removeFromStorage('userLogin');
    await removeFromStorage('currentPage');
    await removeFromStorage('selectedBank');
    await removeFromStorage('selectedCategory');
    await removeFromStorage('chosenBanks');
    await removeFromStorage('selectedCashbacks');
    await removeFromStorage('bankConsents');
    await removeFromStorage('expandedBanks');
    await removeFromStorage('mainButtonState');
    await removeFromStorage('isAnalyzed');
    await removeFromStorage('isAnalyzingForConfirmation');
    await removeFromStorage('analysisStartTime');
    await removeFromStorage('BANK_CASHBACKS');
    await removeFromStorage('cashbackTransactions');
  };

  // Save state whenever relevant state variables change
  useEffect(() => {
    saveStateToStorage();
  }, [isLoggedIn, login, currentPage, selectedBank, selectedCategory, chosenBanks, selectedCashbacks, bankConsents, expandedBanks, mainButtonState, isAnalyzed, isAnalyzingForConfirmation, analysisStartTime, BANK_CASHBACKS, cashbackTransactions]);

  // Check if analysis was in progress on initial load and handle accordingly
  useEffect(() => {
      const ANALYSIS_DURATION = 5000; // 5 seconds
      if (isAnalyzingForConfirmation && analysisStartTime !== null) {
          const elapsedTime = Date.now() - analysisStartTime;
          const remainingTime = ANALYSIS_DURATION - elapsedTime;
          if (remainingTime <= 0) {
              // Analysis should have finished, but maybe the state update was missed.
              // Transition to 'confirm' state as if it finished.
              console.log("Analysis should have finished, transitioning state.");
              setIsAnalyzingForConfirmation(false);
              setIsAnalyzed(true);
              setMainButtonState('confirm');
              setAnalysisStartTime(null); // Clear the start time as analysis is done
          } else {
              // Still analyzing, set a timeout for the remaining time
              console.log(`Resuming analysis, ${remainingTime}ms remaining.`);
              const timer = setTimeout(async () => {
                  try {
                      // Make API call to get analysis results (same logic as before)
                      const response = await fetch(`${API_BASE_URL}/api/analysis_results/${login}`);
                      const data = await response.json();
                      console.log('Transition after resume')
                      console.log(data)
                      // Parse the results from the API response
                      const apiResults = JSON.parse(data.results);
                      console.log('Parsed:')
                      console.log(apiResults)
                      // Group results by bank
                      const groupedResults = {};
                      apiResults.forEach(item => {
                          if (!groupedResults[item.bank_name]) {
                              groupedResults[item.bank_name] = {
                                  maxSelections: apiResults.filter(resultItem => resultItem.bank_name === item.bank_name &&
                                      resultItem.choosen === "yes").length,
                                  bankInfo: `Зарабатывайте вместе с ${item.bank_name}!`,
                                  cashbacks: []
                              };
                          }
                          groupedResults[item.bank_name].cashbacks.push({
                              id: `${item.bank_name}-${item.category}`.replace(/\s+/g, '-'),
                              category: item.category,
                              cashback: `${item.percent}%`,
                              percent: item.percent,
                              choosen: item.choosen,
                              total_cb: item.total_cb,
                              recommended: item.choosen === "yes",
                              description: `Получите ${item.percent}% кэшбэка на ${item.category} с ${item.bank_name}.`,
                              bank_name: item.bank_name
                          });
                      });
                      console.log('groupResults:')
                      console.log(groupedResults)
                      setBankCashbacks(groupedResults);
                      // Update selected cashbacks based on API results
                      const newSelectedCashbacks = {};
                      Object.entries(groupedResults).forEach(([bankName, bankData]) => {
                          const chosenCashbacks = bankData.cashbacks
                              .filter(c => c.choosen === "yes")
                              .map(c => c.id);
                          newSelectedCashbacks[bankName] = chosenCashbacks;
                      });
                      setSelectedCashbacks(newSelectedCashbacks);
                      console.log('New Selected Cashbacks')
                      console.log(newSelectedCashbacks)
                      // Update bank values based on total cashback
                      const updatedBanks = chosenBanks.map(bank => {
                          const bankData = groupedResults[bank.name];
                          if (bankData) {
                              const totalCashback = bankData.cashbacks
                                  .filter(c => c.choosen === "yes")
                                  .reduce((sum, c) => sum + (c.total_cb || 0), 0); // Исправлено
                              return { ...bank, value: `${totalCashback.toFixed(0)} ₽` };
                          }
                          return bank;
                      });
                      console.log('Update banks')
                      console.log(updatedBanks)
                      setChosenBanks(updatedBanks);
                      setIsAnalyzingForConfirmation(false);
                      setIsAnalyzed(true);
                      setMainButtonState('confirm');
                      setAnalysisStartTime(null); // Clear the start time as analysis is done
                  } catch (error) {
                      console.error("Error fetching analysis results after resume:", error);
                      setIsAnalyzingForConfirmation(false);
                      setAnalysisStartTime(null); // Clear the start time on error
                      alert("Не удалось получить результаты анализа. Пожалуйста, попробуйте снова.");
                  }
              }, remainingTime);
              // Cleanup timeout if component unmounts or analysis finishes early
              return () => clearTimeout(timer);
          }
      }
      // If we are not analyzing, ensure the start time is cleared from state
      if (!isAnalyzingForConfirmation) {
          setAnalysisStartTime(null);
      }
  }, [isAnalyzingForConfirmation, analysisStartTime, login]); // Run once after initial state load

  // Bank selection handlers
  const handleBankToggle = (bank) => {
    // FIXED: Ensure chosenBanks is an array before calling filter
    if (!Array.isArray(chosenBanks)) {
        console.error("chosenBanks is not an array:", chosenBanks);
        setChosenBanks([]); // Reset to a safe state
        return;
    }
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
      // Initialize with empty cashbacks, will be populated after API call
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
      alert("Пожалуйста, введите ваш логин.");
      return;
    }
    setIsLoggedIn(true); // Set login status
    // Note: Password is not stored for security
    setCurrentPage('bank-selection');
  };
  const handleLogout = async () => { // Make handleLogout async
    setIsLoggedIn(false);
    setLogin('');
    setCurrentPage('auth');
    setSelectedBank(null);
    setSelectedCategory(null);
    setChosenBanks([]);
    setSearchTerm('');
    setSelectedCashbacks({});
    setBankConsents({});
    setExpandedBanks({});
    setMainButtonState('wait');
    setIsAnalyzed(false);
    setIsAnalyzing(false);
    setIsAnalyzingForConfirmation(false);
    setAnalysisStartTime(null); // Clear analysis start time
    setBankCashbacks({});
    setCashbackTransactions({});
    await clearStateFromStorage(); // Clear all stored data
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
  const handleConfirmClick = async () => {
    if (!areAllBanksValid(chosenBanks, bankConsents)) {
      setShowInvalidBanksPopup(true);
      return;
    }
    setMainButtonState('analyze');
    setIsAnalyzingForConfirmation(true);
    setAnalysisStartTime(Date.now()); // Record the start time
  };
  const handleConfirmCashback = () => {
    setShowConfirmCashbackPopup(true);
  };
  const confirmCashbackSelection = async () => {
    setShowConfirmCashbackPopup(false);
    setMainButtonState('current');
    // Prepare the analysis results to send to the backend
    const resultsToSend = [];
    Object.entries(BANK_CASHBACKS).forEach(([bankName, bankData]) => {
      bankData.cashbacks.forEach(cashback => {
        const isSelected = selectedCashbacks[bankName]?.includes(cashback.id);
        resultsToSend.push({
          bank_name: cashback.bank_name || bankName,
          category: cashback.category,
          percent: cashback.percent,
          choosen: isSelected ? "yes" : "no",
          total_cb: cashback.total_cb || 0
        });
      });
    });
    try {
      const response = await fetch(`${API_BASE_URL}/api/confirm_cashbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_login: login,
          results: JSON.stringify(resultsToSend)
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCashbackTransactions(data)
      console.log("Confirmation response:", data);
    } catch (error) {
      console.error("Failed to confirm cashbacks:", error);
      alert("Не удалось подтвердить кэшбэки. Пожалуйста, попробуйте снова.");
    }
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
    if (!bankData) return;
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
    if (chosenBanks.length === 0 || !login) return; // Ensure we have banks and a login before calling
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
    } catch (error) {
      console.error("Failed to update consent statuses:", error);
    } finally {
      setIsUpdatingConsents(false);
    }
  };

  // NEW EFFECT: Trigger updateConsentStatuses once when navigating TO main page with incomplete consents
  useEffect(() => {
    // Check if the page just changed to 'main'
    if (currentPage === 'main' && prevPageRef.current !== 'main') {
        // Check if conditions are met to trigger the update
        if (chosenBanks.length > 0 && login && hasIncompleteConsents(chosenBanks, bankConsents)) {
            console.log("Navigated to main page with incomplete consents. Triggering updateConsentStatuses.");
            updateConsentStatuses();
        } else {
            console.log("Navigated to main page, but conditions not met for updateConsentStatuses.");
        }
    }
    // Update the ref to the current page after the effect runs
    prevPageRef.current = currentPage;
  }, [currentPage, chosenBanks, login, bankConsents, updateConsentStatuses]); // Dependencies: when they change, effect runs

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
      setAnalysisStartTime(Date.now()); // Record the start time
      // Simulate API call to get analysis results
      setTimeout(async () => {
        try {
          // Make API call to get analysis results
          const response = await fetch(`${API_BASE_URL}/api/analysis_results/${login}`);
          const data = await response.json();
          console.log('Transition')
          console.log(data)
          // Parse the results from the API response
          const apiResults = JSON.parse(data.results);
          console.log('Parsed:')
          console.log(apiResults)
          // Group results by bank
          const groupedResults = {};
          apiResults.forEach(item => {
            if (!groupedResults[item.bank_name]) {
              groupedResults[item.bank_name] = {
                maxSelections: apiResults.filter(resultItem => resultItem.bank_name === item.bank_name &&
                  resultItem.choosen === "yes").length,
                bankInfo: `Зарабатывайте вместе с ${item.bank_name}!`,
                cashbacks: []
              };
            }
            groupedResults[item.bank_name].cashbacks.push({
              id: `${item.bank_name}-${item.category}`.replace(/\s+/g, '-'),
              category: item.category,
              cashback: `${item.percent}%`,
              percent: item.percent,
              choosen: item.choosen,
              total_cb: item.total_cb,
              recommended: item.choosen === "yes",
              description: `Получите ${item.percent}% кэшбэка на ${item.category} с ${item.bank_name}.`,
              bank_name: item.bank_name
            });
          });
          console.log('groupResults:')
          console.log(groupedResults)
          setBankCashbacks(groupedResults);
          // Update selected cashbacks based on API results
          const newSelectedCashbacks = {};
          Object.entries(groupedResults).forEach(([bankName, bankData]) => {
            const chosenCashbacks = bankData.cashbacks
              .filter(c => c.choosen === "yes")
              .map(c => c.id);
            newSelectedCashbacks[bankName] = chosenCashbacks;
          });
          setSelectedCashbacks(newSelectedCashbacks);
          console.log('New Selected Cashbacks')
          console.log(newSelectedCashbacks)
          // Update bank values based on total cashback
          const updatedBanks = chosenBanks.map(bank => {
            const bankData = groupedResults[bank.name];
            if (bankData) {
              const totalCashback = bankData.cashbacks
                .filter(c => c.choosen === "yes")
                .reduce((sum, c) => sum + (c.total_cb || 0), 0); // Исправлено
              return { ...bank, value: `${totalCashback.toFixed(0)} ₽` };
            }
            return bank;
          });
          console.log('Update banks')
          console.log(updatedBanks)
          setChosenBanks(updatedBanks);
          setIsAnalyzingForConfirmation(false);
          setIsAnalyzed(true);
          setMainButtonState('confirm');
          setAnalysisStartTime(null); // Clear the start time as analysis is done
        } catch (error) {
          console.error("Error fetching analysis results:", error);
          setIsAnalyzingForConfirmation(false);
          setAnalysisStartTime(null); // Clear the start time on error
          alert("Не удалось получить результаты анализа. Пожалуйста, попробуйте снова.");
        }
      }, 3000); // 3 seconds
    }
  }, [chosenBanks, bankConsents, mainButtonState, login]); // Added login to dependency array for fetch call

  useEffect(() => {
    // Мок: загружаем из файла
    // setCashbackTransactions(transactionsMock);
    // Для боевого использования с backend, раскомментируй:
    /*
    fetch(`${API_BASE_URL}/api/transactions`)
      .then(res => res.json())
      .then(data => setCashbackTransactions(data))
      .catch(() => setCashbackTransactions(transactionsMock));
    */
  }, []);

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
    bank.name.includes(searchTerm)
  );

  // Calculate current income from categories
  const calculateCurrentIncome = () => {
    let total = 0;
    Object.values(cashbackTransactions).forEach(transactions => {
      transactions.forEach(transaction => {
        console.log(transaction);
        total += transaction.cashback;
      });
    });
    return total;
  };

  // Get categories with cashback totals
  const getCategoryCashbacks = () => {
    const categories = {};
    Object.entries(cashbackTransactions).forEach(([category, transactions]) => {
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

  // Get all unique categories from dynamic cashbacks
  const allCategories = [...new Set(Object.values(BANK_CASHBACKS).flatMap(bank =>
    bank.cashbacks?.map(c => c.category) || []
  ))];

  // Initialize selectedCategory with the first available category if not set
  useEffect(() => {
    if (allCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(allCategories[0]);
    }
  }, [allCategories, selectedCategory]);

  // --- Conditional Rendering based on loading state (optional) ---
  // You might want to render a loading spinner while initial state loads
  // For now, we'll just return null or a basic placeholder if not loaded
  // A more robust way would be to have a 'loading' state variable set in the useEffect above
  if ( /* Add a loading state check here if desired, e.g., loadingState === 'initial' */ false) {
    return <div>Loading...</div>; // Or your loading component
  }
  // --- End Conditional Rendering ---

  // Screens
  if (currentPage === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Добро пожаловать!</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#337357] focus:border-transparent"
                placeholder="Введите ваш логин"
                required
              />
            </div>
            {/* Password field removed */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
            >
              Войти
            </button>
           <button
                type="button"
                onClick={() => handleQuickLogin(setLogin, setIsLoggedIn, setChosenBanks, setBankConsents, setCurrentPage)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-lg"
              >
                Быстрый вход
            </button>
          </form>
        </div>
      </div>
    );
  }
    if (currentPage === 'bank-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex flex-col p-4">
        {/* Fixed Header Section with Login and Logout */}
        <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] p-4 border-b border-white/20 flex justify-between items-center">
          {/* Login Display in Top Left */}
          <div className="text-white">
            <span>{login}</span> {/* Only login name */}
          </div>
          {/* Centered Title */}
          <h1 className="text-2xl font-bold text-white text-center flex-1">Выберите свои банки</h1>
          {/* Logout Button in Top Right */}
          <button
            onClick={handleLogout}
            className="text-white hover:text-gray-300 text-sm flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> {/* Door emoji */}
          </button>
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
            Подтвердить банки ({chosenBanks.length})
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
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={goBackToMain}
            className="flex items-center gap-2 text-white w-fit"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад к банкам
          </button>
          <button
            onClick={handleLogout}
            className="text-white hover:text-gray-300 text-sm flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> {/* Door emoji */}
          </button>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{selectedBank.name}</h1>
          <p className="text-yellow-400 text-xl font-semibold">{isAnalyzed ? selectedBank.value : "??₽"}</p>
          {!isEditingDisabled && (
            <div className="flex items-center gap-2 mt-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300 text-sm">
                Выберите до {maxSelections} категорий кэшбэков ({remainingSelections} осталось)
              </span>
            </div>
          )}
          {isEditingDisabled && (
            <div className="flex items-center gap-2 mt-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">
                Кэшбеки на этотм месяц уже утверждены. Мы напомним, когда их можно будет выставить в следующий раз!
              </span>
            </div>
          )}
          {bankData?.bankInfo && (
            <p className="text-gray-400 text-sm mt-3">{bankData.bankInfo}</p>
          )}
        </div>
        <div className="space-y-3 flex-1">
          <h2 className="text-xl font-semibold text-white mb-4">Предложения кэшбэков</h2>
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
    const transactions = cashbackTransactions?.[selectedCategory] || [];
    const totalCashback = transactions.reduce((sum, t) => sum + t.cashback, 0);
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={goBackToCategories}
            className="flex items-center gap-2 text-white w-fit"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад к категориям
          </button>
          <button
            onClick={handleLogout}
            className="text-white hover:text-gray-300 text-sm flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> {/* Door emoji */}
          </button>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{selectedCategory}</h1>
          <p className="text-yellow-400 text-xl font-semibold">{totalCashback.toFixed(0)}₽ заработано</p>
          <p className="text-gray-400 text-sm">Всего потрачено: {totalSpent.toFixed(0)}₽</p>
        </div>
        <div className="space-y-3 flex-1">
          <h2 className="text-xl font-semibold text-white mb-4">Транзакции</h2>
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
                      Дата: {transaction.date}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Банк: {transaction.paymentBank}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${transaction.optimal ? 'text-green-400' : 'text-yellow-400'}`}>
                      {transaction.cashback.toFixed(0)}₽
                    </div>
                    {!transaction.optimal && (
                      <div className="text-right">
                        <p className="text-gray-400 text-xs">
                          {transaction.hint}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              Не найдено транзакций для этой категории
            </div>
          )}
        </div>
      </div>
    );
  }
  // Main Screen
  return (
    <>
      <OptimalCardPopup
        isOpen={showOptimalCardPopup}
        onClose={() => setShowOptimalCardPopup(false)}
        selectedCategory={selectedCategory || "Продукты"}
        onCategoryChange={handleCategoryDropdownOpen}
        bankCashbacks={BANK_CASHBACKS}
      />
      <CategoryDropdown
        isOpen={showCategoryDropdown}
        onClose={() => setShowCategoryDropdown(false)}
        categories={allCategories}
        onSelect={handleCategorySelectFromDropdown}
        selectedCategory={selectedCategory || "Продукты"}
        bankCashbacks={BANK_CASHBACKS}
      />
      <Popup
        isOpen={showNeedAnalyzePopup}
        onClose={() => setShowNeedAnalyzePopup(false)}
        title="Согласия не одобрены"
        icon={AlertTriangle}
      >
        <p className="text-gray-600 mb-6">
          Вам нужно одобрить согласия для всех банков перед просмотра деталей кэшбэков.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNeedAnalyzePopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Закрыть
          </button>
        </div>
      </Popup>
      <Popup
        isOpen={showInvalidBanksPopup}
        onClose={() => setShowInvalidBanksPopup(false)}
        title="Согласия не одобрены"
        icon={AlertTriangle}
      >
        <p className="text-gray-600 mb-4">
          Следующие банки не имеют одобренных согласий:
        </p>
        <div className="max-h-40 overflow-y-auto mb-4">
          {chosenBanks
            .filter(bank => getBankState(bank, bankConsents) !== 'approved')
            .map(bank => (
              <div key={bank.id} className="p-2 bg-gray-100 rounded mb-1">
                <span className="font-medium">{bank.name}</span> - Согласия не одобрены
              </div>
            ))}
        </div>
        <p className="text-gray-600 mb-6">
          Пожалуйста, одобрите согласия в личном кабинете вашего банка или удалите нежелательные банки для начала анализа.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInvalidBanksPopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Закрыть
          </button>
        </div>
      </Popup>
      <Popup
        isOpen={showApproveAllPopup}
        onClose={() => setShowApproveAllPopup(false)}
        title="Одобрить все согласия"
        icon={AlertTriangle}
      >
        <p className="text-gray-600 mb-6">
          Одобрите все согласия или удалите нежелательные банки перед продолжением.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowApproveAllPopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Закрыть
          </button>
        </div>
      </Popup>
      <Popup
        isOpen={showApproveSinglePopup}
        onClose={() => setShowApproveSinglePopup(false)}
        title="Одобрить согласие"
        icon={AlertTriangle}
      >
        <p className="text-gray-600 mb-4">
          Пожалуйста, одобрите согласие для <span className="font-bold">{popupBank?.name}</span>, чтобы получить доступ к функциям кэшбэка.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowApproveSinglePopup(false)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            Закрыть
          </button>
          <button
            onClick={() => {
              if (popupBank?.name) {
                window.open(
                  `https://${popupBank.name.toLowerCase()}.open.bankingapi.ru/client/consents.html`,
                  '_blank',
                  'noopener,noreferrer'
                );
                setShowApproveSinglePopup(false); // Сразу закрываем попап
              }
            }}
            className="flex-1 bg-gradient-to-r from-[#337357] to-[#4CAF7D] hover:from-[#2B6246] hover:to-[#3D8B63] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200"
          >
            <ExternalLink className="w-4 h-4" />
            Одобрить согласие
          </button>
        </div>
      </Popup>
      <ConfirmCashbackPopup
        isOpen={showConfirmCashbackPopup}
        onClose={() => setShowConfirmCashbackPopup(false)}
        onConfirm={confirmCashbackSelection}
      />
      <div className="min-h-screen bg-gradient-to-br from-[#5E1675] to-[#8B2DA5] flex flex-col items-center p-4 overflow-hidden">
        {/* Header with Login Info and Logout */}
        <div className="w-full max-w-md flex justify-between items-center mt-4">
          <div className="text-white">
            <span>{login}</span> {/* Only login name */}
          </div>
          <button
            onClick={handleLogout}
            className="text-white hover:text-gray-300 text-sm flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> {/* Door emoji */}
          </button>
        </div>
        {/* Main Button at 1/4 from top */}
        <div className="mt-8 md:mt-16 w-full flex justify-center">
          {mainButtonState === 'wait' && (
            <button
              onClick={handleConfirmClick}
              className="bg-gray-500 text-white font-bold py-6 px-6 rounded-3xl shadow-lg text-xl flex items-center justify-center w-full max-w-md mx-auto cursor-pointer"
            >
              Пожалуйста, одобрите согласия 🖊️
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
              {isAnalyzingForConfirmation ? 'Нежно анализируем ваши кэшбэки...' : 'Подтвердить кэшбеки?'}
            </button>
          )}
          {mainButtonState === 'confirm' && (
            <button
              onClick={handleConfirmCashback}
              className="bg-[#FFD23F] hover:bg-[#E6BD37] text-gray-900 font-bold py-6 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out text-xl flex items-center justify-center w-full max-w-md mx-auto"
            >
              Подтвердить кэшбеки?
            </button>
          )}
          {mainButtonState === 'current' && (
            <button
              onClick={() => setShowOptimalCardPopup(true)}
              className="bg-gradient-to-r from-[#337357] to-[#4CAF7D] text-white font-bold py-6 px-6 rounded-3xl shadow-lg text-xl flex items-center justify-center w-full max-w-md mx-auto"
            >
              Оплатить оптимальной картой ⛳
            </button>
          )}
        </div>
        {/* Fixed elements at 2/4 from top - MOVED HIGHER */}
        <div className="mt-8 md:mt-16 w-full max-w-md space-y-6">
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
                      Начисление кэшбэков
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
                            {data.totalCashback.toFixed(0)} ₽
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md border border-white/20">
                <div className="flex justify-between items-center">
                  <p className="text-gray-300 text-lg">Текущий доход</p>
                  <p className="text-3xl font-bold text-yellow-400">{currentIncomeValue.toFixed(0)} ₽</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xl">🏦</span>
                    <span className="text-white font-medium">Кэшбэк по банкам</span>
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
                    <div className="text-center text-gray-400 py-4">Банки не выбраны</div>
                  )}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md border border-white/20">
                <div className="flex justify-between items-center">
                  <p className="text-gray-300 text-lg">Предполагаемый доход</p>
                  <p className="text-3xl font-bold text-yellow-400">{isAnalyzed ? (chosenBanks.reduce((sum, bank) => sum + parseFloat(bank.value.replace("₽", "").trim()), 0)).toFixed(0) + " ₽" : "?? ₽"}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
