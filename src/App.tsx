import {
  AlertCircle,
  BarChart2,
  Calendar,
  Check,
  Database,
  LogOut,
  RefreshCw,
  Sliders,
  TrendingUp,
  Award,
  Users,
  Gift,
  ShoppingBag,
  Lock
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import './App.css';
import CustomersManager from './components/CustomersManager';
import GiftsManager from './components/GiftsManager';
import OrdersManager from './components/OrdersManager';
import MinigamesManager from './components/MinigamesManager';

// --- Default Mock Data Generators ---
const API_BASE_URL = 'https://backend.vipmarts.com/api';
const defaultRegions = ['NORTH', 'CENTRAL', 'SOUTH'] as const;
type Region = typeof defaultRegions[number];

interface LotteryResult {
  date: string; // YYYY-MM-DD
  region: Region;
  provinces?: string; // Comma-separated province names
  videoUrls?: string; // Comma-separated video URLs
  db: string[];
  g1: string[];
  g2: string[];
  g3: string[];
  g4: string[];
  g5: string[];
  g6: string[];
  g7: string[];
  g8: string[];
}

interface ProvinceEditState {
  name: string;
  videoUrl?: string;
  db: string[];
  g1: string[];
  g2: string[];
  g3: string[];
  g4: string[];
  g5: string[];
  g6: string[];
  g7: string[];
  g8: string[];
}

const getProvincesConfig = (region: string, dateStr: string) => {
  if (region === 'NORTH') {
    return {
      count: 1,
      names: ['Miền Bắc']
    };
  }

  let dayOfWeek = 0;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    dayOfWeek = date.getDay();
  } else {
    dayOfWeek = new Date(dateStr).getDay();
  }

  if (region === 'CENTRAL') {
    const centralSchedule: { [key: number]: string[] } = {
      0: ['Khánh Hòa', 'Kon Tum', 'Thừa Thiên Huế'], // Sunday
      1: ['Thừa Thiên Huế', 'Phú Yên'], // Monday
      2: ['Đắk Lắk', 'Quảng Nam'], // Tuesday
      3: ['Đà Nẵng', 'Khánh Hòa'], // Wednesday
      4: ['Bình Định', 'Quảng Trị', 'Quảng Bình'], // Thursday
      5: ['Gia Lai', 'Ninh Thuận'], // Friday
      6: ['Đà Nẵng', 'Quảng Ngãi', 'Đắk Nông'] // Saturday
    };

    const names = centralSchedule[dayOfWeek] || ['Đà Nẵng', 'Khánh Hòa', 'Đắk Lắk'];
    return {
      count: names.length,
      names
    };
  }

  if (dayOfWeek === 6) {
    return {
      count: 4,
      names: ['TP.HCM', 'Long An', 'Bình Phước', 'Hậu Giang']
    };
  }

  const southSchedule: { [key: number]: string[] } = {
    0: ['Tiền Giang', 'Kiên Giang', 'Đà Lạt'],
    1: ['TP.HCM', 'Đồng Tháp', 'Cà Mau'],
    2: ['Bến Tre', 'Vũng Tàu', 'Bạc Liêu'],
    3: ['Đồng Nai', 'Cần Thơ', 'Sóc Trăng'],
    4: ['Tây Ninh', 'An Giang', 'Bình Thuận'],
    5: ['Vĩnh Long', 'Bình Dương', 'Trà Vinh']
  };

  return {
    count: 3,
    names: southSchedule[dayOfWeek] || ['TP.HCM', 'Đồng Tháp', 'Cà Mau']
  };
};

const parseResultToProvinces = (res: LotteryResult, activeRegion: Region): ProvinceEditState[] => {
  const isNorth = activeRegion === 'NORTH';
  
  // Determine the number of provinces
  let count = 1;
  let names: string[] = [];
  
  if (isNorth) {
    count = 1;
    names = ['Miền Bắc'];
  } else {
    if (res.provinces) {
      const parsedNames = res.provinces.split(',').map(s => s.trim()).filter(Boolean);
      count = parsedNames.length;
      names = parsedNames;
    } else {
      const config = getProvincesConfig(activeRegion, res.date);
      count = config.count;
      names = config.names;
    }
  }
  
  const parsedVideos = res.videoUrls ? res.videoUrls.split(',') : [];

  // Helper to extract the array of values for a specific province index from a flat array
  const getProvinceArray = (prizeKey: keyof Omit<LotteryResult, 'date' | 'region' | 'provinces'>, provinceIdx: number, defaultLen: number): string[] => {
    const prizeDraws = res[prizeKey] || [];
    const numProvinces = count;
    return Array.from({ length: defaultLen }, (_, drawIdx) => {
      const flatIdx = drawIdx * numProvinces + provinceIdx;
      return prizeDraws[flatIdx] || '';
    });
  };

  return Array.from({ length: count }, (_, pIdx) => {
    return {
      name: names[pIdx] || `Tỉnh ${pIdx + 1}`,
      videoUrl: parsedVideos[pIdx] || '',
      db: getProvinceArray('db', pIdx, 1),
      g1: getProvinceArray('g1', pIdx, 1),
      g2: getProvinceArray('g2', pIdx, isNorth ? 2 : 1),
      g3: getProvinceArray('g3', pIdx, isNorth ? 6 : 2),
      g4: getProvinceArray('g4', pIdx, isNorth ? 4 : 7),
      g5: getProvinceArray('g5', pIdx, isNorth ? 6 : 1),
      g6: getProvinceArray('g6', pIdx, 3),
      g7: getProvinceArray('g7', pIdx, isNorth ? 4 : 1),
      g8: isNorth ? [] : getProvinceArray('g8', pIdx, 1)
    };
  });
};

const serializeProvincesToResult = (provs: ProvinceEditState[], reg: Region, dt: string): LotteryResult => {
  const isNorth = reg === 'NORTH';
  
  // Join names with comma
  const provincesNamesStr = provs.map(p => p.name.trim() || 'Tỉnh').join(',');
  const videoUrlsStr = provs.map(p => (p.videoUrl || '').trim()).join(',');

  // Helper to flat list a specific prize draw index across all provinces
  const joinDraws = (prizeKey: keyof Omit<ProvinceEditState, 'name' | 'videoUrl'>, drawCount: number): string[] => {
    const flatList: string[] = [];
    for (let drawIdx = 0; drawIdx < drawCount; drawIdx++) {
      provs.forEach(p => {
        const val = (p as any)[prizeKey][drawIdx] || '';
        flatList.push(val.trim());
      });
    }
    return flatList;
  };

  return {
    date: dt,
    region: reg,
    provinces: provincesNamesStr,
    videoUrls: videoUrlsStr,
    db: joinDraws('db', 1),
    g1: joinDraws('g1', 1),
    g2: joinDraws('g2', isNorth ? 2 : 1),
    g3: joinDraws('g3', isNorth ? 6 : 2),
    g4: joinDraws('g4', isNorth ? 4 : 7),
    g5: joinDraws('g5', isNorth ? 6 : 1),
    g6: joinDraws('g6', 3),
    g7: joinDraws('g7', isNorth ? 4 : 1),
    g8: isNorth ? [] : joinDraws('g8', 1)
  };
};

interface DBNamItem {
  date: string; // YYYY-MM-DD
  number: string; // 6 digits
}

interface G1NamItem {
  date: string; // YYYY-MM-DD
  number: string; // 5 digits
}

interface LoToItem {
  number: string; // "00" to "99"
  count: number;
  lastSeen: number;
}

function App() {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cms_authenticated') === 'true';
  });
  const [pinCode, setPinCode] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [shakeLogin, setShakeLogin] = useState<boolean>(false);

  // --- Change Password Form States ---
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinChangeError, setPinChangeError] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string>('');

  // --- Active App Data ---
  const [resultsList, setResultsList] = useState<LotteryResult[]>([]);
  const [dbNamList, setDbNamList] = useState<DBNamItem[]>([]);
  const [g1NamList, setG1NamList] = useState<G1NamItem[]>([]);
  const [loToList, setLoToList] = useState<LoToItem[]>([]);

  // --- UI Control States ---
  const [activeTab, setActiveTab] = useState<'results' | 'db_nam' | 'g1_nam' | 'lo_to' | 'customers' | 'gifts' | 'orders' | 'change_password' | 'minigames'>('results');
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  const [unsavedChanges, setUnsavedChanges] = useState<{ results: boolean; db_nam: boolean; lo_to: boolean }>({ results: false, db_nam: false, lo_to: false });

  // --- Edit Form States (Daily Results) ---
  const [activeRegion, setActiveRegion] = useState<Region>('NORTH');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [currentResult, setCurrentResult] = useState<LotteryResult>({
    date: '',
    region: 'NORTH',
    db: [''],
    g1: [''],
    g2: [''],
    g3: [''],
    g4: [''],
    g5: [''],
    g6: [''],
    g7: [''],
    g8: ['']
  });

  // --- Edit Form States (DB Nam / G1 Nam) ---
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editingCell, setEditingCell] = useState<{ day: number; month: number } | null>(null);
  const [cellEditVal, setCellEditVal] = useState<string>('');
  const [editingG1Cell, setEditingG1Cell] = useState<{ day: number; month: number } | null>(null);
  const [g1CellEditVal, setG1CellEditVal] = useState<string>('');

  // --- Login handler ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('cms_authenticated', 'true');
        setAuthError('');
      } else {
        setAuthError(data.message || 'Mã PIN bảo mật không chính xác!');
        setShakeLogin(true);
        setTimeout(() => setShakeLogin(false), 500);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError('Lỗi kết nối máy chủ! Vui lòng thử lại.');
      setShakeLogin(true);
      setTimeout(() => setShakeLogin(false), 500);
    } finally {
      setLoading(false);
    }
  };

  // --- Logout handler ---
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('cms_authenticated');
  };

  // --- Change Password handler ---
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    setPinChangeSuccess('');

    if (!currentPin || !newPin || !confirmPin) {
      setPinChangeError('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    if (newPin !== confirmPin) {
      setPinChangeError('Xác nhận mã PIN mới không khớp!');
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/change-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPinChangeSuccess(data.message || 'Thay đổi mã PIN bảo mật thành công!');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } else {
        setPinChangeError(data.message || 'Mã PIN hiện tại không chính xác!');
      }
    } catch (err: any) {
      console.error(err);
      setPinChangeError(`Lỗi kết nối máy chủ: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Fetch Daily Result from Backend API ---
  const fetchDailyResult = async (date: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/results?date=${date}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi kết nối máy chủ API');
      }

      const resultsVal = data.results || {};
      const parsedResults: LotteryResult[] = [];
      Object.keys(resultsVal).forEach(dateStr => {
        Object.keys(resultsVal[dateStr]).forEach(region => {
          const r = resultsVal[dateStr][region];
          parsedResults.push({
            date: dateStr,
            region: region as Region,
            db: r.db ? r.db.split(',') : [],
            g1: r.g1 ? r.g1.split(',') : [],
            g2: r.g2 ? r.g2.split(',') : [],
            g3: r.g3 ? r.g3.split(',') : [],
            g4: r.g4 ? r.g4.split(',') : [],
            g5: r.g5 ? r.g5.split(',') : [],
            g6: r.g6 ? r.g6.split(',') : [],
            g7: r.g7 ? r.g7.split(',') : [],
            g8: r.g8 ? r.g8.split(',') : [],
            provinces: r.provinces || '',
            videoUrls: r.videoUrls || '',
          });
        });
      });

      // Merge new parsedResults into resultsList state by removing duplicates for this date
      setResultsList(prev => {
        const filtered = prev.filter(r => r.date !== date);
        return [...filtered, ...parsedResults];
      });
      setUnsavedChanges(prev => ({ ...prev, results: false }));
    } catch (error: any) {
      console.error("Error fetching daily result:", error);
      throw error;
    }
  };

  // --- Fetch Yearly Data (DbNam & G1Nam) from Backend API ---
  const fetchYearData = async (year: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/results/year?year=${year}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi kết nối máy chủ API');
      }

      const dbNamVal = data.db_nam || {};
      const parsedDbNam: DBNamItem[] = Object.keys(dbNamVal).map(dateStr => ({
        date: dateStr,
        number: dbNamVal[dateStr].toString()
      }));

      const g1NamVal = data.g1_nam || {};
      const parsedG1Nam: G1NamItem[] = Object.keys(g1NamVal).map(dateStr => ({
        date: dateStr,
        number: g1NamVal[dateStr].toString()
      }));

      // Merge into lists by removing duplicates for the selected year
      const yearPrefix = `${year}-`;
      setDbNamList(prev => {
        const filtered = prev.filter(item => !item.date.startsWith(yearPrefix));
        return [...filtered, ...parsedDbNam];
      });
      setG1NamList(prev => {
        const filtered = prev.filter(item => !item.date.startsWith(yearPrefix));
        return [...filtered, ...parsedG1Nam];
      });
      setUnsavedChanges(prev => ({ ...prev, db_nam: false }));
    } catch (error: any) {
      console.error("Error fetching year data:", error);
      throw error;
    }
  };

  // --- Fetch Loto Data from Backend API ---
  const fetchLotoData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/results/loto`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi kết nối máy chủ API');
      }

      const loToVal = data.lo_to || {};
      let parsedLoTo: LoToItem[] = [];
      if (Array.isArray(loToVal)) {
        parsedLoTo = loToVal.map((l: any, idx: number) => ({
          number: idx.toString().padStart(2, '0'),
          count: parseInt(l?.count) || 0,
          lastSeen: parseInt(l?.lastSeen) || 0
        }));
      } else {
        Object.keys(loToVal).forEach(numStr => {
          parsedLoTo.push({
            number: numStr.padStart(2, '0'),
            count: parseInt(loToVal[numStr]?.count) || 0,
            lastSeen: parseInt(loToVal[numStr]?.lastSeen) || 0
          });
        });
      }

      if (parsedLoTo.length === 0) {
        parsedLoTo = Array.from({ length: 100 }, (_, i) => ({
          number: i.toString().padStart(2, '0'),
          count: 10,
          lastSeen: 1
        }));
      }

      setLoToList(parsedLoTo);
      setUnsavedChanges(prev => ({ ...prev, lo_to: false }));
    } catch (error: any) {
      console.error("Error fetching loto data:", error);
      throw error;
    }
  };

  // --- Fetch Data from Backend API ---
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (activeTab === 'results') {
        await fetchDailyResult(selectedDate);
      } else if (activeTab === 'db_nam' || activeTab === 'g1_nam') {
        await fetchYearData(selectedYear);
      } else if (activeTab === 'lo_to') {
        await fetchLotoData();
      }
      setSyncStatus({ status: 'success', message: 'Tải dữ liệu máy chủ thành công!' });
    } catch (error: any) {
      console.error(error);
      setSyncStatus({
        status: 'error',
        message: 'Lỗi tải dữ liệu từ máy chủ kết quả.'
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Tự động tải lại dữ liệu ngầm từ máy chủ khi đổi ngày, miền, năm hoặc chuyển tab
  useEffect(() => {
    if (isAuthenticated) {
      fetchData(true);
    }
  }, [selectedDate, activeRegion, activeTab, selectedYear]);


  // --- Daily Results editor logic ---
  const [currentProvinces, setCurrentProvinces] = useState<ProvinceEditState[]>([]);

  // Load result into form when Date/Region changes
  useEffect(() => {
    const existing = resultsList.find(r => r.date === selectedDate && r.region === activeRegion);
    const isNorth = activeRegion === 'NORTH';

    let numProvs = 1;
    let defaultProvincesStr = '';
    if (isNorth) {
      numProvs = 1;
      defaultProvincesStr = 'Miền Bắc';
    } else if (existing && existing.provinces) {
      const parsedProvs = existing.provinces.split(',').map(s => s.trim()).filter(Boolean);
      numProvs = parsedProvs.length;
      defaultProvincesStr = existing.provinces;
    } else {
      const config = getProvincesConfig(activeRegion, selectedDate);
      numProvs = config.count;
      defaultProvincesStr = config.names.join(',');
    }

    const normalizeArray = (arr: string[] | undefined | null, expectedLength: number): string[] => {
      const safeArr = Array.isArray(arr) ? arr : [];
      const totalLen = expectedLength * numProvs;
      if (safeArr.length === totalLen) return safeArr;
      if (safeArr.length > totalLen) return safeArr.slice(0, totalLen);
      return [...safeArr, ...Array(totalLen - safeArr.length).fill('')];
    };

    let loadedResult: LotteryResult;
    if (existing) {
      loadedResult = {
        date: selectedDate,
        region: activeRegion,
        provinces: existing.provinces || '',
        videoUrls: existing.videoUrls || '',
        db: normalizeArray(existing.db, 1),
        g1: normalizeArray(existing.g1, 1),
        g2: normalizeArray(existing.g2, isNorth ? 2 : 1),
        g3: normalizeArray(existing.g3, isNorth ? 6 : 2),
        g4: normalizeArray(existing.g4, isNorth ? 4 : 7),
        g5: normalizeArray(existing.g5, isNorth ? 6 : 1),
        g6: normalizeArray(existing.g6, 3),
        g7: normalizeArray(existing.g7, isNorth ? 4 : 1),
        g8: normalizeArray(existing.g8, isNorth ? 0 : 1)
      };
    } else {
      // Default blank prize inputs according to Region structure
      loadedResult = {
        date: selectedDate,
        region: activeRegion,
        provinces: defaultProvincesStr,
        videoUrls: '',
        db: Array(1 * numProvs).fill(''),
        g1: Array(1 * numProvs).fill(''),
        g2: Array((isNorth ? 2 : 1) * numProvs).fill(''),
        g3: Array((isNorth ? 6 : 2) * numProvs).fill(''),
        g4: Array((isNorth ? 4 : 7) * numProvs).fill(''),
        g5: Array((isNorth ? 6 : 1) * numProvs).fill(''),
        g6: Array(3 * numProvs).fill(''),
        g7: Array((isNorth ? 4 : 1) * numProvs).fill(''),
        g8: isNorth ? [] : Array(1 * numProvs).fill('')
      };
    }

    setCurrentResult(loadedResult);
    
    // Parse into province edit list
    const parsedProvs = parseResultToProvinces(loadedResult, activeRegion);
    setCurrentProvinces(parsedProvs);
  }, [selectedDate, activeRegion, resultsList]);

  const updateProvinceField = (provinceIdx: number, prizeKey: keyof Omit<ProvinceEditState, 'name' | 'videoUrl'>, drawIdx: number, value: string) => {
    const updatedProvinces = [...currentProvinces];
    if (!updatedProvinces[provinceIdx]) return;
    const prizeArr = [...((updatedProvinces[provinceIdx] as any)[prizeKey] as string[])];
    prizeArr[drawIdx] = value;
    updatedProvinces[provinceIdx] = {
      ...updatedProvinces[provinceIdx],
      [prizeKey]: prizeArr
    };
    setCurrentProvinces(updatedProvinces);
    
    // Instant sync to currentResult
    const serialized = serializeProvincesToResult(updatedProvinces, activeRegion, selectedDate);
    setCurrentResult(serialized);
    setUnsavedChanges({ ...unsavedChanges, results: true });
  };

  const updateProvinceVideoUrl = (provinceIdx: number, value: string) => {
    const updatedProvinces = [...currentProvinces];
    if (!updatedProvinces[provinceIdx]) return;
    updatedProvinces[provinceIdx] = {
      ...updatedProvinces[provinceIdx],
      videoUrl: value
    };
    setCurrentProvinces(updatedProvinces);
    const serialized = serializeProvincesToResult(updatedProvinces, activeRegion, selectedDate);
    setCurrentResult(serialized);
  };

  const updateProvinceName = (provinceIdx: number, value: string) => {
    const updatedProvinces = [...currentProvinces];
    if (!updatedProvinces[provinceIdx]) return;
    updatedProvinces[provinceIdx] = {
      ...updatedProvinces[provinceIdx],
      name: value
    };
    setCurrentProvinces(updatedProvinces);
    
    // Instant sync to currentResult
    const serialized = serializeProvincesToResult(updatedProvinces, activeRegion, selectedDate);
    setCurrentResult(serialized);
  };

  const handleRandomizeForm = () => {
    const isNorth = activeRegion === 'NORTH';
    const count = isNorth ? 1 : currentProvinces.length;
    const names = isNorth ? ['Miền Bắc'] : currentProvinces.map(p => p.name);

    const genSingleVal = (len: number) => {
      return Math.floor(Math.random() * Math.pow(10, len)).toString().padStart(len, '0');
    };

    const randomizedProvinces: ProvinceEditState[] = Array.from({ length: count }, (_, pIdx) => {
      return {
        name: names[pIdx] || `Tỉnh ${pIdx + 1}`,
        db: [genSingleVal(isNorth ? 5 : 6)],
        g1: [genSingleVal(5)],
        g2: Array(isNorth ? 2 : 1).fill(0).map(() => genSingleVal(5)),
        g3: Array(isNorth ? 6 : 2).fill(0).map(() => genSingleVal(5)),
        g4: Array(isNorth ? 4 : 7).fill(0).map(() => genSingleVal(isNorth ? 4 : 5)),
        g5: Array(isNorth ? 6 : 1).fill(0).map(() => genSingleVal(4)),
        g6: Array(3).fill(0).map(() => genSingleVal(isNorth ? 3 : 4)),
        g7: Array(isNorth ? 4 : 1).fill(0).map(() => genSingleVal(isNorth ? 2 : 3)),
        g8: isNorth ? [] : [genSingleVal(2)]
      };
    });

    setCurrentProvinces(randomizedProvinces);
    
    // Sync
    const serialized = serializeProvincesToResult(randomizedProvinces, activeRegion, selectedDate);
    setCurrentResult(serialized);
  };

  const handleApplyFormResult = async () => {

    // Upsert results list
    const index = resultsList.findIndex(r => r.date === selectedDate && r.region === activeRegion);
    let updated = [...resultsList];
    if (index >= 0) {
      updated[index] = { ...currentResult };
    } else {
      updated.push({ ...currentResult });
    }

    setResultsList(updated);
    localStorage.setItem('local_results', JSON.stringify(updated));
    await pushToDatabase(updated, dbNamList, loToList, g1NamList);
    alert('Đã áp dụng và cập nhật kết quả lên hệ thống thành công!');
  };

  // --- DB Nam editing logic ---
  const getCellVal = (day: number, month: number) => {
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    const fullDateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;

    const match = dbNamList.find(d => d.date === fullDateStr);
    return match ? match.number : '';
  };

  const handleCellClick = (day: number, month: number) => {
    const val = getCellVal(day, month);
    setEditingCell({ day, month });
    setCellEditVal(val);
  };

  const handleSaveCellEdit = async () => {
    if (!editingCell) return;
    const formattedMonth = editingCell.month.toString().padStart(2, '0');
    const formattedDay = editingCell.day.toString().padStart(2, '0');
    const fullDateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;

    let updated = [...dbNamList];
    const index = updated.findIndex(d => d.date === fullDateStr);

    if (cellEditVal.trim() === '') {
      // Remove
      if (index >= 0) updated.splice(index, 1);
    } else {
      // Upsert
      if (index >= 0) {
        updated[index].number = cellEditVal;
      } else {
        updated.push({ date: fullDateStr, number: cellEditVal });
      }
    }

    setDbNamList(updated);
    localStorage.setItem('local_db_nam', JSON.stringify(updated));
    setEditingCell(null);
    await pushToDatabase(resultsList, updated, loToList, g1NamList);
    alert('Đã áp dụng và cập nhật số Đặc biệt lên hệ thống thành công!');
  };

  // --- G1 Nam editing logic ---
  const getG1CellVal = (day: number, month: number) => {
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    const fullDateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;

    const match = g1NamList.find(d => d.date === fullDateStr);
    return match ? match.number : '';
  };

  const handleG1CellClick = (day: number, month: number) => {
    const val = getG1CellVal(day, month);
    setEditingG1Cell({ day, month });
    setG1CellEditVal(val);
  };

  const handleSaveG1CellEdit = async () => {
    if (!editingG1Cell) return;
    const formattedMonth = editingG1Cell.month.toString().padStart(2, '0');
    const formattedDay = editingG1Cell.day.toString().padStart(2, '0');
    const fullDateStr = `${selectedYear}-${formattedMonth}-${formattedDay}`;

    let updated = [...g1NamList];
    const index = updated.findIndex(d => d.date === fullDateStr);

    if (g1CellEditVal.trim() === '') {
      // Remove
      if (index >= 0) updated.splice(index, 1);
    } else {
      // Upsert
      if (index >= 0) {
        updated[index].number = g1CellEditVal;
      } else {
        updated.push({ date: fullDateStr, number: g1CellEditVal });
      }
    }

    setG1NamList(updated);
    localStorage.setItem('local_g1_nam', JSON.stringify(updated));
    setEditingG1Cell(null);
    await pushToDatabase(resultsList, dbNamList, loToList, updated);
    alert('Đã áp dụng và cập nhật số Giải Nhất lên hệ thống thành công!');
  };

  // --- Lo To editing logic ---
  const handleLoToChange = (numStr: string, field: 'count' | 'lastSeen', val: number) => {
    const updated = loToList.map(item => {
      if (item.number === numStr) {
        return {
          ...item,
          [field]: val
        };
      }
      return item;
    });

    setLoToList(updated);
    localStorage.setItem('local_lo_to', JSON.stringify(updated));
    setUnsavedChanges({ ...unsavedChanges, lo_to: true });
  };

  const handleResetAllLoTo = async () => {
    if (!confirm('Bạn có chắc chắn muốn đặt lại tần suất lô tô của 100 số về dữ liệu mặc định?')) return;
    const reset = Array.from({ length: 100 }, (_, i) => ({
      number: i.toString().padStart(2, '0'),
      count: Math.floor(Math.random() * 15) + 5,
      lastSeen: Math.floor(Math.random() * 10),
    }));
    setLoToList(reset);
    localStorage.setItem('local_lo_to', JSON.stringify(reset));
    await pushToDatabase(resultsList, dbNamList, reset, g1NamList);
    alert('Đã đặt lại tần suất lô tô và cập nhật hệ thống thành công!');
  };

  const handleApplyLotoChanges = async () => {
    await pushToDatabase(resultsList, dbNamList, loToList, g1NamList);
    alert('Đã cập nhật tần suất lô tô lên hệ thống thành công!');
  };

  // --- SYNC / UPLOAD to Backend API ---
  const pushToDatabase = async (
    customResults = resultsList,
    customDbNam = dbNamList,
    customLoTo = loToList,
    customG1Nam = g1NamList
  ) => {
    setSaveLoading(true);
    try {
      // Structure results: results[date][region] = { db, g1, ... }
      const resultsObj: any = {};
      customResults.forEach(r => {
        if (!resultsObj[r.date]) resultsObj[r.date] = {};
        resultsObj[r.date][r.region] = {
          db: r.db.join(','),
          g1: r.g1.join(','),
          g2: r.g2.join(','),
          g3: r.g3.join(','),
          g4: r.g4.join(','),
          g5: r.g5.join(','),
          g6: r.g6.join(','),
          g7: r.g7.join(','),
          g8: r.g8.join(','),
          provinces: r.provinces || '',
          videoUrls: r.videoUrls || '',
        };
      });

      // Structure db_nam: db_nam[date] = number
      const dbNamObj: any = {};
      customDbNam.forEach(db => {
        dbNamObj[db.date] = db.number;
      });

      // Structure g1_nam: g1_nam[date] = number
      const g1NamObj: any = {};
      customG1Nam.forEach(g1 => {
        g1NamObj[g1.date] = g1.number;
      });

      // Structure lo_to: lo_to[number] = { count, lastSeen }
      const loToObj: any = {};
      customLoTo.forEach(l => {
        loToObj[l.number] = {
          count: l.count,
          lastSeen: l.lastSeen
        };
      });

      // Update in Backend Database
      const res = await fetch(`${API_BASE_URL}/results/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: resultsObj,
          db_nam: dbNamObj,
          g1_nam: g1NamObj,
          lo_to: loToObj
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lỗi đồng bộ máy chủ');
      }

      setSyncStatus({ status: 'success', message: 'Cập nhật hệ thống thành công!' });
    } catch (e: any) {
      console.error(e);
      setSyncStatus({ status: 'error', message: `Lỗi đồng bộ: ${e.message}` });
      alert(`Lỗi kết nối máy chủ kết quả: ${e.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <form className={`login-card ${shakeLogin ? 'shake' : ''}`} onSubmit={handleLogin}>
          <div className="login-logo">188</div>
          <h1 className="login-title">Daily Loto 188</h1>
          <p className="login-subtitle">Hệ thống quản trị kết quả xổ số & thống kê</p>

          {authError && <div className="error-text">{authError}</div>}

          <div className="form-group" style={{ marginBottom: 15 }}>
            <label>Mã PIN Quản Trị</label>
            <input
              type="password"
              placeholder="Nhập mã PIN để đăng nhập..."
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              required
            />
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', marginBottom: 20, textAlign: 'left', width: '100%' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              <span className="status-dot online" style={{ width: 6, height: 6, display: 'inline-block', borderRadius: '50%', background: '#10b981' }} /> Hệ thống kết nối Realtime Database thời gian thực.
            </p>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP HỆ THỐNG'}
          </button>
        </form>
      </div>
    );
  }

  // Helper variables for Dashboard stats
  const totalResults = resultsList.length;
  const totalDbNam = dbNamList.length;

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">188</div>
          <div className="brand-text">
            <span className="brand-title">DAILY LOTO</span>
            <span className="brand-subtitle">CMS ADMIN</span>
          </div>
        </div>

        <nav className="nav-menu">
          <div className={`nav-item ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            <Calendar size={18} />
            <span>Kết Quả Hàng Ngày</span>
          </div>
          <div className={`nav-item ${activeTab === 'db_nam' ? 'active' : ''}`} onClick={() => setActiveTab('db_nam')}>
            <TrendingUp size={18} />
            <span>Bảng Đặc Biệt Năm</span>
          </div>
          <div className={`nav-item ${activeTab === 'g1_nam' ? 'active' : ''}`} onClick={() => setActiveTab('g1_nam')}>
            <Award size={18} />
            <span>Bảng Giải Nhất Năm</span>
          </div>
          <div className={`nav-item ${activeTab === 'lo_to' ? 'active' : ''}`} onClick={() => setActiveTab('lo_to')}>
            <BarChart2 size={18} />
            <span>Tần Suất Lô Tô</span>
          </div>
          
          {/* New CMS System Navs */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '15px 0' }} />
          <div className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
            <Users size={18} />
            <span>Quản Lý Khách Hàng</span>
          </div>
          <div className={`nav-item ${activeTab === 'gifts' ? 'active' : ''}`} onClick={() => setActiveTab('gifts')}>
            <Gift size={18} />
            <span>Quản Lý Kho Quà</span>
          </div>
          <div className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <ShoppingBag size={18} />
            <span>Đơn Đổi Quà</span>
          </div>
          <div className={`nav-item ${activeTab === 'minigames' ? 'active' : ''}`} onClick={() => setActiveTab('minigames')}>
            <Award size={18} />
            <span>Quản Lý Minigame</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '15px 0' }} />
          <div className={`nav-item ${activeTab === 'change_password' ? 'active' : ''}`} onClick={() => setActiveTab('change_password')}>
            <Lock size={18} />
            <span>Đổi Mã PIN Bảo Mật</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="connection-pill">
            <div className={`status-dot ${syncStatus.status === 'error' ? 'offline' : 'online'}`} />
            <span>{syncStatus.status === 'error' ? 'Lỗi kết nối' : 'Đang hoạt động'}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Panel content */}
      <main className="main-content">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 15 }}>
            <RefreshCw size={40} className="save-icon" style={{ animation: 'spin 2s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Đang tải dữ liệu từ máy chủ kết quả...</p>
          </div>
        ) : (
          <>
            {/* NEW CMS SYSTEM TABS */}
            {activeTab === 'customers' && <CustomersManager />}
            {activeTab === 'gifts' && <GiftsManager />}
            {activeTab === 'orders' && <OrdersManager />}
            {activeTab === 'minigames' && <MinigamesManager />}

            {/* TAB CHANGE PASSWORD */}
            {activeTab === 'change_password' && (
              <div className="tab-content">
                <div className="screen-header">
                  <div className="screen-info">
                    <h2>Đổi Mã PIN Bảo Mật</h2>
                    <p>Cập nhật mã PIN đăng nhập hệ thống quản trị Realtime Database.</p>
                  </div>
                </div>

                <div className="card animate-fade-in" style={{ maxWidth: 500, margin: '0 auto', width: '100%' }}>
                  <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="form-group">
                      <label>Mã PIN Hiện Tại</label>
                      <input
                        type="password"
                        placeholder="Nhập mã PIN hiện tại..."
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Mã PIN Mới</label>
                      <input
                        type="password"
                        placeholder="Nhập mã PIN mới..."
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Xác Nhận Mã PIN Mới</label>
                      <input
                        type="password"
                        placeholder="Nhập lại mã PIN mới..."
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        required
                      />
                    </div>

                    {pinChangeError && <div className="error-text" style={{ alignSelf: 'stretch', marginTop: 0, marginBottom: 0 }}>{pinChangeError}</div>}
                    {pinChangeSuccess && <div className="success-text" style={{ alignSelf: 'stretch', marginTop: 0, marginBottom: 0 }}>{pinChangeSuccess}</div>}

                    <button className="btn-primary" type="submit" disabled={saveLoading} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                      <Check size={16} /> {saveLoading ? 'Đang cập nhật...' : 'CẬP NHẬT MÃ PIN'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB DASHBOARD */}
            {false && (
              <div className="tab-content">
                <div className="screen-header">
                  <div className="screen-info">
                    <h2>Bảng Điều Khiển Tổng Quan</h2>
                    <p>Chào mừng quản trị viên! Hệ thống kiểm soát kết quả hiển thị trên App di động.</p>
                  </div>
                  <button className="btn-secondary" onClick={() => fetchData()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={14} /> Tải lại
                  </button>
                </div>

                {/* Dashboard Stats */}
                <div className="stats-grid animate-fade-in">
                  <div className="card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">KQ Hàng Ngày chỉnh sửa</span>
                      <span className="stat-value">{totalResults} bản ghi</span>
                    </div>
                    <div className="stat-icon"><Calendar size={24} /></div>
                  </div>
                  <div className="card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Số đặc biệt năm</span>
                      <span className="stat-value">{totalDbNam} ngày</span>
                    </div>
                    <div className="stat-icon"><TrendingUp size={24} /></div>
                  </div>
                  <div className="card stat-card">
                    <div className="stat-info">
                      <span className="stat-label">Tần suất lô tô</span>
                      <span className="stat-value">100 số hoạt động</span>
                    </div>
                    <div className="stat-icon"><BarChart2 size={24} /></div>
                  </div>
                </div>

                {/* Sync status & Guidelines card */}
                <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', color: 'white' }}>
                    <Database size={20} color="var(--primary)" /> Hướng dẫn quản trị kết quả
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    <p><strong>Bước 1:</strong> Bạn hãy chuyển qua các tab bên trái như "Kết Quả Hàng Ngày" hay "Tần Suất Lô Tô" để chỉnh số theo nhu cầu.</p>
                    <p><strong>Bước 2:</strong> Bấm nút <strong>"Áp Dụng Cấu Hình"</strong> ở các biểu mẫu để lưu trực tiếp lên máy chủ dữ liệu.</p>
                    <p><strong>Bước 3:</strong> Ngay lập tức khi bạn bấm áp dụng, App di động của người dùng sẽ cập nhật kết quả mới tức thì và đồng bộ thời gian thực!</p>
                  </div>

                  {syncStatus.message && (
                    <div style={{
                      padding: 16,
                      borderRadius: 10,
                      background: syncStatus.status === 'success' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                      border: `1px solid ${syncStatus.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`,
                      color: syncStatus.status === 'success' ? 'var(--accent)' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: '0.9rem'
                    }}>
                      <AlertCircle size={18} />
                      <span>Trạng thái kết nối: {syncStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB DAILY RESULTS */}
            {activeTab === 'results' && (
              <div className="tab-content">
                <div className="screen-header">
                  <div className="screen-info">
                    <h2>Chỉnh Sửa Kết Quả Hàng Ngày</h2>
                    <p>Thiết lập kết quả chi tiết từng giải cho ngày và miền được chọn.</p>
                  </div>
                </div>

                <div className="card animate-fade-in">
                  <div className="filter-bar">
                    <div className="form-group" style={{ width: 'auto', minWidth: 200, marginBottom: 0 }}>
                      <label>Chọn Ngày</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Chọn Miền</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {defaultRegions.map(region => (
                          <button
                            key={region}
                            className={`region-btn ${activeRegion === region ? 'active' : ''}`}
                            onClick={() => setActiveRegion(region)}
                          >
                            {region === 'NORTH' ? 'MIỀN BẮC' : region === 'CENTRAL' ? 'MIỀN TRUNG' : 'MIỀN NAM'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      className="btn-secondary"
                      onClick={handleRandomizeForm}
                      style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', marginTop: 22 }}
                    >
                      <Sliders size={14} /> Sinh số ảo test ngẫu nhiên
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Provinces Grid */}
                <div style={{ width: '100%', maxWidth: '100%', overflowX: 'auto', paddingBottom: 15 }}>
                  <div className="provinces-edit-grid animate-fade-in" style={{
                    display: 'flex',
                    gap: 20,
                    minWidth: '100%',
                    width: 'max-content'
                  }}>
                    {currentProvinces.map((prov, pIdx) => (
                      <div key={pIdx} className="card province-column-card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 18,
                        flex: '1 0 320px',
                        minWidth: 320,
                        maxWidth: activeRegion === 'NORTH' ? '500px' : 'none'
                      }}>
                      {/* Column Header: Province Name Input */}
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                          Tỉnh / Thành Phố #{pIdx + 1}
                        </label>
                        <input
                          type="text"
                          className="prize-input-box"
                          value={prov.name}
                          onChange={(e) => updateProvinceName(pIdx, e.target.value)}
                          placeholder="Nhập tên tỉnh (VD: TP.HCM)"
                          style={{ width: '100%', textAlign: 'left', fontSize: '1.05rem', fontWeight: 800, padding: '10px 14px', borderColor: 'var(--primary)' }}
                          disabled={activeRegion === 'NORTH'}
                        />
                      </div>

                      {/* Prizes fields for this province */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Đặc Biệt */}
                        <div className="prize-row-edit" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="prize-label-badge special" style={{ width: 80, fontSize: '0.8rem' }}>Đặc biệt</div>
                          <input
                            type="text"
                            maxLength={activeRegion === 'NORTH' ? 5 : 6}
                            className="prize-input-box special-input"
                            value={prov.db[0] || ''}
                            onChange={(e) => updateProvinceField(pIdx, 'db', 0, e.target.value.replace(/\D/g, ''))}
                            placeholder={activeRegion === 'NORTH' ? "-----" : "------"}
                            style={{ flex: 1 }}
                          />
                        </div>

                        {/* Giải Nhất */}
                        <div className="prize-row-edit" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="prize-label-badge" style={{ width: 80, fontSize: '0.8rem' }}>Giải Nhất</div>
                          <input
                            type="text"
                            maxLength={5}
                            className="prize-input-box"
                            value={prov.g1[0] || ''}
                            onChange={(e) => updateProvinceField(pIdx, 'g1', 0, e.target.value.replace(/\D/g, ''))}
                            placeholder="-----"
                            style={{ flex: 1 }}
                          />
                        </div>

                        {/* Giải Nhì */}
                        <div className="prize-row-edit" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div className="prize-label-badge" style={{ width: 80, fontSize: '0.8rem', marginTop: 10 }}>Giải Nhì</div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {prov.g2.map((val, idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={5}
                                className="prize-input-box"
                                value={val}
                                onChange={(e) => updateProvinceField(pIdx, 'g2', idx, e.target.value.replace(/\D/g, ''))}
                                placeholder="-----"
                              />
                            ))}
                          </div>
                        </div>

                        {/* Giải Ba */}
                        <div className="prize-row-edit" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div className="prize-label-badge" style={{ width: 80, fontSize: '0.8rem', marginTop: 10 }}>Giải Ba</div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {prov.g3.map((val, idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={5}
                                className="prize-input-box"
                                value={val}
                                onChange={(e) => updateProvinceField(pIdx, 'g3', idx, e.target.value.replace(/\D/g, ''))}
                                placeholder="-----"
                              />
                            ))}
                          </div>
                        </div>

                        {/* Giải Tư */}
                        <div className="prize-row-edit" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div className="prize-label-badge" style={{ width: 80, fontSize: '0.8rem', marginTop: 10 }}>Giải Tư</div>
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: activeRegion === 'NORTH' ? '1fr 1fr' : '1fr', gap: 6 }}>
                            {prov.g4.map((val, idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={activeRegion === 'NORTH' ? 4 : 5}
                                className="prize-input-box"
                                value={val}
                                onChange={(e) => updateProvinceField(pIdx, 'g4', idx, e.target.value.replace(/\D/g, ''))}
                                placeholder={activeRegion === 'NORTH' ? "----" : "-----"}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Giải Năm */}
                        <div className="prize-row-edit" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div className="prize-label-badge" style={{ width: 80, fontSize: '0.8rem', marginTop: 10 }}>Giải Năm</div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {prov.g5.map((val, idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={4}
                                className="prize-input-box"
                                value={val}
                                onChange={(e) => updateProvinceField(pIdx, 'g5', idx, e.target.value.replace(/\D/g, ''))}
                                placeholder="----"
                              />
                            ))}
                          </div>
                        </div>

                        {/* Giải Sáu */}
                        <div className="prize-row-edit" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div className="prize-label-badge" style={{ width: 80, fontSize: '0.8rem', marginTop: 10 }}>Giải Sáu</div>
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                            {prov.g6.map((val, idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={activeRegion === 'NORTH' ? 3 : 4}
                                className="prize-input-box"
                                value={val}
                                onChange={(e) => updateProvinceField(pIdx, 'g6', idx, e.target.value.replace(/\D/g, ''))}
                                placeholder={activeRegion === 'NORTH' ? "---" : "----"}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Giải Bảy */}
                        <div className="prize-row-edit" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div className="prize-label-badge" style={{ width: 80, fontSize: '0.8rem', marginTop: 10 }}>Giải Bảy</div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {prov.g7.map((val, idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={activeRegion === 'NORTH' ? 2 : 3}
                                className="prize-input-box"
                                value={val}
                                onChange={(e) => updateProvinceField(pIdx, 'g7', idx, e.target.value.replace(/\D/g, ''))}
                                placeholder={activeRegion === 'NORTH' ? "--" : "---"}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Giải Tám (Chỉ Trung / Nam) */}
                        {activeRegion !== 'NORTH' && (
                          <div className="prize-row-edit" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="prize-label-badge special" style={{ width: 80, fontSize: '0.8rem' }}>Giải Tám</div>
                            <input
                              type="text"
                              maxLength={2}
                              className="prize-input-box special-input"
                              value={prov.g8[0] || ''}
                              onChange={(e) => updateProvinceField(pIdx, 'g8', 0, e.target.value.replace(/\D/g, ''))}
                              placeholder="--"
                              style={{ flex: 1 }}
                            />
                          </div>
                        )}

                        <div className="prize-row-edit" style={{ marginTop: 10 }}>
                          <input
                            type="text"
                            className="prize-input-box"
                            value={prov.videoUrl || ''}
                            onChange={(e) => updateProvinceVideoUrl(pIdx, e.target.value)}
                            placeholder="Chèn iframe link video kết quả vào"
                            style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444', textAlign: 'center', fontSize: '0.85rem' }}
                          />
                        </div>

                        {/* Video Preview */}
                        {prov.videoUrl && prov.videoUrl.trim() !== '' && (
                          <div 
                            style={{ 
                              marginTop: 15, 
                              width: '100%', 
                              aspectRatio: '16/9', 
                              borderRadius: 8, 
                              overflow: 'hidden',
                              backgroundColor: '#000',
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}
                          >
                            {prov.videoUrl.trim().startsWith('<iframe') ? (
                              <div 
                                dangerouslySetInnerHTML={{ __html: prov.videoUrl.replace(/width="[^"]+"/, 'width="100%"').replace(/height="[^"]+"/, 'height="100%"') }} 
                                style={{ width: '100%', height: '100%', display: 'flex' }}
                              />
                            ) : (
                              <iframe 
                                width="100%" 
                                height="100%" 
                                src={
                                  prov.videoUrl.includes('watch?v=') 
                                    ? prov.videoUrl.replace('watch?v=', 'embed/').split('&')[0] 
                                    : prov.videoUrl.includes('youtu.be/') 
                                      ? prov.videoUrl.replace('youtu.be/', 'youtube.com/embed/') 
                                      : prov.videoUrl
                                } 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                              ></iframe>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

                <div className="card actions-card animate-fade-in">
                  <button className="btn-primary" onClick={handleApplyFormResult} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={16} /> Áp dụng cấu hình
                  </button>
                </div>
              </div>
            )}

            {/* TAB DB NAM */}
            {activeTab === 'db_nam' && (
              <div className="tab-content">
                <div className="screen-header">
                  <div className="screen-info">
                    <h2>Bảng Đặc Biệt Năm {selectedYear}</h2>
                    <p>Nhấp vào bất kỳ ô ngày/tháng nào trong năm để sửa số giải Đặc biệt (5 chữ số) hiển thị ở Tab ĐB Năm của App.</p>
                  </div>
                </div>

                {/* Year Select & Calendar wrapper */}
                <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="year-picker">
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <button
                        key={year}
                        className={`year-btn ${selectedYear === year ? 'active' : ''}`}
                        onClick={() => setSelectedYear(year)}
                      >
                        Năm {year}
                      </button>
                    ))}
                  </div>

                  <div className="calendar-wrapper">
                    <table className="calendar-table">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <th key={month}>Tháng {month}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <tr key={day}>
                            <td style={{ fontWeight: '700', background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)' }}>{day}</td>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                              const value = getCellVal(day, month);
                              // Simple validator for day validity in month (e.g. Feb 30/31 doesn't exist)
                              const isValidDay = () => {
                                if (day === 31 && [4, 6, 9, 11].includes(month)) return false;
                                if (month === 2) {
                                  const isLeap = (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || (selectedYear % 400 === 0);
                                  if (day > (isLeap ? 29 : 28)) return false;
                                }
                                return true;
                              };

                              if (!isValidDay()) {
                                return <td key={month} style={{ background: '#090d16', opacity: 0.1, cursor: 'not-allowed' }}></td>;
                              }

                              return (
                                <td key={month} onClick={() => handleCellClick(day, month)}>
                                  <div className="calendar-cell-edit">
                                    <span className="cell-day-num">{day}/{month}</span>
                                    {value ? (
                                      <span className="cell-val highlighted">{value}</span>
                                    ) : (
                                      <span className="cell-val" style={{ color: 'rgba(255,255,255,0.05)' }}>-----</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit modal popup */}
                {editingCell && (
                  <div className="modal-overlay">
                    <div className="modal-card">
                      <div className="modal-header">
                        <h3>Sửa Số Ngày {editingCell.day}/{editingCell.month}/{selectedYear}</h3>
                        <button className="modal-close-btn" onClick={() => setEditingCell(null)}>×</button>
                      </div>
                      <div className="form-group">
                        <label>Số giải Đặc biệt (5 hoặc 6 chữ số)</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={cellEditVal}
                          onChange={(e) => setCellEditVal(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ví dụ: 888888"
                          autoFocus
                        />
                      </div>
                      <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setEditingCell(null)}>Hủy</button>
                        <button className="btn-primary" onClick={handleSaveCellEdit}>Áp dụng</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB G1 NAM */}
            {activeTab === 'g1_nam' && (
              <div className="tab-content">
                <div className="screen-header">
                  <div className="screen-info">
                    <h2>Bảng Giải Nhất Năm {selectedYear}</h2>
                    <p>Nhấp vào bất kỳ ô ngày/tháng nào trong năm để sửa số giải Nhất (5 chữ số) hiển thị ở Tab Giải Nhất Năm của App.</p>
                  </div>
                </div>

                {/* Year Select & Calendar wrapper */}
                <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="year-picker">
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <button
                        key={year}
                        className={`year-btn ${selectedYear === year ? 'active' : ''}`}
                        onClick={() => setSelectedYear(year)}
                      >
                        Năm {year}
                      </button>
                    ))}
                  </div>

                  <div className="calendar-wrapper">
                    <table className="calendar-table">
                      <thead>
                        <tr>
                          <th>Ngày</th>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <th key={month}>Tháng {month}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <tr key={day}>
                            <td style={{ fontWeight: '700', background: 'rgba(255,255,255,0.01)', color: 'var(--text-secondary)' }}>{day}</td>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                              const value = getG1CellVal(day, month);
                              const isValidDay = () => {
                                if (day === 31 && [4, 6, 9, 11].includes(month)) return false;
                                if (month === 2) {
                                  const isLeap = (selectedYear % 4 === 0 && selectedYear % 100 !== 0) || (selectedYear % 400 === 0);
                                  if (day > (isLeap ? 29 : 28)) return false;
                                }
                                return true;
                              };

                              if (!isValidDay()) {
                                return <td key={month} style={{ background: '#090d16', opacity: 0.1, cursor: 'not-allowed' }}></td>;
                              }

                              return (
                                <td key={month} onClick={() => handleG1CellClick(day, month)}>
                                  <div className="calendar-cell-edit">
                                    <span className="cell-day-num">{day}/{month}</span>
                                    {value ? (
                                      <span className="cell-val highlighted">{value}</span>
                                    ) : (
                                      <span className="cell-val" style={{ color: 'rgba(255,255,255,0.05)' }}>-----</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit modal popup */}
                {editingG1Cell && (
                  <div className="modal-overlay">
                    <div className="modal-card">
                      <div className="modal-header">
                        <h3>Sửa Số Ngày {editingG1Cell.day}/{editingG1Cell.month}/{selectedYear}</h3>
                        <button className="modal-close-btn" onClick={() => setEditingG1Cell(null)}>×</button>
                      </div>
                      <div className="form-group">
                        <label>Số giải Nhất (5 chữ số)</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={g1CellEditVal}
                          onChange={(e) => setG1CellEditVal(e.target.value.replace(/\D/g, ''))}
                          placeholder="Ví dụ: 99999"
                          autoFocus
                        />
                      </div>
                      <div className="modal-actions">
                        <button className="btn-secondary" onClick={() => setEditingG1Cell(null)}>Hủy</button>
                        <button className="btn-primary" onClick={handleSaveG1CellEdit}>Áp dụng</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB LO TO */}
            {activeTab === 'lo_to' && (
              <div className="tab-content">
                <div className="screen-header">
                  <div className="screen-info">
                    <h2>Tần Suất Xuất Hiện Lô Tô (30 ngày)</h2>
                    <p>Điều chỉnh trực tiếp số lần về và số ngày chưa về của 100 cặp số từ 00 đến 99 hiển thị ở Tab Lô.</p>
                  </div>
                  <button className="btn-secondary" onClick={handleResetAllLoTo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Đặt lại tất cả ngẫu nhiên
                  </button>
                </div>

                <div className="card animate-fade-in loto-grid">
                  {loToList.map(item => (
                    <div key={item.number} className="loto-item-card">
                      <span className="loto-number">{item.number}</span>
                      <div className="loto-inputs">
                        <div className="loto-mini-input">
                          <span>Số lần về:</span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={item.count}
                            onChange={(e) => handleLoToChange(item.number, 'count', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="loto-mini-input">
                          <span>Chưa về:</span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={item.lastSeen}
                            onChange={(e) => handleLoToChange(item.number, 'lastSeen', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="card actions-card animate-fade-in" style={{ marginTop: 20 }}>
                  <button className="btn-primary" onClick={handleApplyLotoChanges} disabled={saveLoading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={16} /> {saveLoading ? 'Đang lưu...' : 'Áp dụng cấu hình lô tô'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB SETTINGS */}
            {false && (
              <div className="tab-content">
                <div className="screen-header">
                  <div className="screen-info">
                    <h2>Cấu Hìn Hệ Thống</h2>
                    <p>Thông tin kết nối đến cơ sở dữ liệu thời gian thực của bạn.</p>
                  </div>
                </div>

                <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Cấu hình máy chủ đang hoạt động</label>
                    <div style={{ padding: 16, borderRadius: 10, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                        <strong style={{ color: 'white' }}>Loại cơ sở dữ liệu:</strong> Cơ sở dữ liệu thời gian thực
                      </p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                        <strong style={{ color: 'white' }}>Trạng thái kết nối:</strong> <span className="status-dot online" style={{ display: 'inline-block', width: 8, height: 8, marginRight: 6, borderRadius: '50%', background: '#10b981' }} /> Đang hoạt động thời gian thực
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                        *Lưu ý: Để thay đổi cấu hình kết nối dự án (API Key, Database URL,...), bạn vui lòng chỉnh sửa trực tiếp trong file cấu hình dự án của CMS và App di động.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-primary" onClick={() => fetchData()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RefreshCw size={16} /> Kiểm tra lại kết nối máy chủ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
