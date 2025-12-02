import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Trophy, 
  Calendar, 
  Users, 
  FileText, 
  Plus, 
  CheckCircle, 
  X, 
  Download, 
  User, 
  Briefcase,
  ChevronLeft,
  Award,
  Filter,
  Send,
  Settings,
  Trash2,
  LogOut,
  Shield,
  Clock,
  MessageCircle,
  HelpCircle,
  Upload,
  Camera,
  Save,
  Mail,
  Lock,
  Loader2,
  Paperclip,
  AlertCircle,
  Eye,
  EyeOff,
  Bell,
  Languages,
  Volume2,
  Copy,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Palette,
  Contrast,
  Globe,
  Sparkles,
  Hash,
  FileImage,
  Sparkles as SparklesIcon,
  Download as DownloadIcon
} from 'lucide-react';

// --- Types & Interfaces ---

type UserRole = 'participant' | 'organizer' | 'admin';
type ContestType = 'olympiad' | 'creative' | 'sport' | 'hackathon';
type ContestStatus = 'open' | 'closed' | 'judging' | 'completed';
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  group?: string; // Class/Group/Organization
  avatar?: string;
  phone?: string;
  bio?: string;
  login?: string; // Логин пользователя
  auth_id?: number; // ID из таблицы auth
}

interface Contest {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  documentsAndTasks?: string; // Документы и задания
  type: ContestType;
  customTags?: string[]; // Кастомные хэштеги для отображения
  startDate: string;
  endDate: string;
  organizerId: string;
  organizerName: string;
  image: string;
  status: ContestStatus;
  participantLimit?: number;
  files?: Array<{ name: string; url: string; size: number }>;
  resultsPublished: boolean;
}

interface Application {
  id: string;
  contestId: string;
  contestTitle?: string; // Название конкурса из бэкенда
  userId: string;
  userLogin?: string; // Логин пользователя из бэкенда
  applicantName: string;
  group: string;
  email: string;
  telegramUsername?: string; // Telegram username
  status: 'pending' | 'approved' | 'rejected' | 'winner' | 'participant';
  submissionDate: string;
  score?: number;
}

interface Certificate {
  id: number;
  contest_id: number;
  application_id: number;
  user_id: number;
  recipient_name: string;
  team_name?: string;
  contest_title: string;
  achievement?: string;
  template_type: 'auto' | 'custom';
  certificate_data?: any;
  certificate_file?: string;
  is_auto_generated: boolean;
  created_at: string;
}

// --- Mock Data ---

const INITIAL_USERS: UserData[] = [
  { id: 'u1', name: 'Алексей Смирнов', email: 'alex@school.ru', role: 'participant', group: '9Б', avatar: '', phone: '+7 (999) 000-00-01' },
  { id: 'u2', name: 'Ольга Николаевна', email: 'olga@lyceum.ru', role: 'organizer', group: 'Лицей №5', avatar: '', phone: '+7 (999) 000-00-02' },
  { id: 'u3', name: 'Администратор', email: 'admin@edu.gov', role: 'admin', avatar: '', phone: '+7 (999) 000-00-03' },
  { id: 'u4', name: 'Мария Иванова', email: 'maria@art.ru', role: 'participant', group: '11А', avatar: '' },
  { id: 'u5', name: 'Технопарк "Квант"', email: 'org@quant.ru', role: 'organizer', group: 'Технопарк', avatar: '' },
];

const CONTEST_IMAGES = [
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1504384308090-c54be3852f33?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=800'
];

const INITIAL_CONTESTS: Contest[] = [
  {
    id: 'c1',
    title: 'Математическая Олимпиада "Пифагор"',
    description: 'Ежегодная олимпиада для школьников 5-11 классов. Проверь свои знания!',
    fullDescription: 'Приглашаем всех любителей математики принять участие в нашей ежегодной олимпиаде. Вас ждут нестандартные задачи, логические головоломки и ценные призы. Победители получат льготы при поступлении в профильные вузы.',
    type: 'olympiad',
    startDate: '2023-11-01',
    endDate: '2023-11-20',
    organizerId: 'u2',
    organizerName: 'Лицей №5',
    image: CONTEST_IMAGES[0],
    status: 'completed',
    resultsPublished: true,
    files: [{ name: 'Положение.pdf', url: '', size: 1258291 }, { name: 'Примеры_задач.pdf', url: '', size: 2516582 }]
  },
  {
    id: 'c2',
    title: 'Хакатон "Code Future 2024"',
    description: 'Командное соревнование по разработке веб-приложений за 48 часов.',
    fullDescription: 'Собери команду и создай прототип будущего! Темы: Образование, Экология, Умный город. Жюри состоит из экспертов ведущих IT-компаний. Главный приз - стажировка.',
    type: 'hackathon',
    startDate: '2023-12-10',
    endDate: '2023-12-12',
    organizerId: 'u5',
    organizerName: 'Технопарк "Квант"',
    image: CONTEST_IMAGES[1],
    status: 'open',
    resultsPublished: false,
    files: [{ name: 'Регламент_хакатона.pdf', url: '', size: 3670016 }]
  },
  {
    id: 'c3',
    title: 'Конкурс Рисунков "Зимняя Сказка"',
    description: 'Творческий конкурс для всех возрастов. Тема: зима и новогоднее чудо.',
    fullDescription: 'Принимаются работы в любой технике: акварель, гуашь, масло, цифровая живопись. Лучшие работы будут выставлены в городской галерее.',
    type: 'creative',
    startDate: '2023-12-01',
    endDate: '2023-12-25',
    organizerId: 'u2',
    organizerName: 'Лицей №5',
    image: CONTEST_IMAGES[2],
    status: 'judging',
    resultsPublished: false,
    files: [{ name: 'Требования_к_работам.docx', url: '', size: 524288 }]
  }
];

const INITIAL_APPLICATIONS: Application[] = [
  { id: 'a1', contestId: 'c1', userId: 'u1', applicantName: 'Алексей Смирнов', group: '9Б', email: 'alex@school.ru', status: 'winner', submissionDate: '2023-11-02', score: 98 },
  { id: 'a2', contestId: 'c2', userId: 'u4', applicantName: 'Команда "Ракета"', group: '11А', email: 'maria@art.ru', status: 'pending', submissionDate: '2023-12-10' },
  { id: 'a3', contestId: 'c1', userId: 'u4', applicantName: 'Мария Иванова', group: '11А', email: 'maria@art.ru', status: 'participant', submissionDate: '2023-11-05', score: 75 },
  { id: 'a4', contestId: 'c3', userId: 'u1', applicantName: 'Алексей Смирнов', group: '9Б', email: 'alex@school.ru', status: 'approved', submissionDate: '2023-12-05' }
];

// --- Utilities & Helpers ---

const fakeDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomImage = () => CONTEST_IMAGES[Math.floor(Math.random() * CONTEST_IMAGES.length)];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const getTypeEmoji = (type: string): string => {
  const typeLower = type.toLowerCase().replace('#', '').trim();
  const emojiMap: { [key: string]: string } = {
    'olympiad': '🏆',
    'олимпиада': '🏆',
    'hackathon': '💻',
    'хакатон': '💻',
    'creative': '🎨',
    'творчество': '🎨',
    'sport': '⚽',
    'спорт': '⚽',
    'конкурс': '🎯',
    'contest': '🎯',
    'марафон': '🏃',
    'marathon': '🏃',
    'турнир': '⚔️',
    'tournament': '⚔️',
    'фестиваль': '🎭',
    'festival': '🎭',
    'чемпионат': '🏅',
    'championship': '🏅',
  };
  
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (typeLower.includes(key)) {
      return emoji;
    }
  }
  return '🏷️';
};

const formatTypeAsHashtag = (type: string): string => {
  if (!type) return '';
  const cleanType = type.startsWith('#') ? type : `#${type}`;
  const emoji = getTypeEmoji(cleanType);
  return `${emoji} ${cleanType}`;
};

const getTypeLabel = (type: ContestType) => {
  if (!type) return 'Другое';
  
  switch (type) {
    case 'olympiad':
      return formatTypeAsHashtag('#олимпиада');
    case 'hackathon':
      return formatTypeAsHashtag('#хакатон');
    case 'creative':
      return formatTypeAsHashtag('#творчество');
    case 'sport':
      return formatTypeAsHashtag('#спорт');
    default:
      return formatTypeAsHashtag('#конкурс');
  }
};

const getStatusInfo = (status: Application['status']) => {
  switch(status) {
    case 'winner': return { label: 'Победитель', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Trophy };
    case 'approved': return { label: 'Одобрена', color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle };
    case 'rejected': return { label: 'Отклонена', color: 'text-red-700 bg-red-50 border-red-200', icon: X };
    case 'participant': return { label: 'Участник', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: User };
    case 'pending': return { label: 'На проверке', color: 'text-slate-600 bg-slate-50 border-slate-200', icon: Clock };
    default: return { label: status, color: 'text-slate-600 bg-slate-100', icon: User };
  }
};

const getContestStatusLabel = (status: ContestStatus) => {
  switch(status) {
    case 'open': return { label: 'Идет набор', color: 'bg-green-100 text-green-700' };
    case 'closed': return { label: 'Набор закрыт', color: 'bg-red-100 text-red-700' };
    case 'judging': return { label: 'Идет судейство', color: 'bg-amber-100 text-amber-700' };
    case 'completed': return { label: 'Завершен', color: 'bg-slate-100 text-slate-700' };
  }
};

// --- Reusable UI Components ---

const Skeleton = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`}></div>
);

const LazyImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      <img 
        src={src} 
        alt={alt} 
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

// Toast Notifications Component
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-xl border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
            toast.type === 'success' ? 'bg-white border-green-200 text-green-800' :
            toast.type === 'error' ? 'bg-white border-red-200 text-red-800' :
            'bg-slate-800 border-slate-700 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
          {toast.type === 'info' && <Bell className="w-5 h-5 text-blue-400" />}
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

const ContestCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-full flex flex-col">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-6 flex-1 flex flex-col space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="mt-auto pt-4 flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </div>
);

// --- Support Widget ---

const SupportWidget = ({ addToast }: { addToast: (t: Omit<Toast, 'id'>) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'menu' | 'form' | 'success'>('menu');
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const toggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setStep('menu');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await fakeDelay(1000);
    setIsLoading(false);
    setStep('success');
    setMessage('');
    setFileName(null);
    addToast({ type: 'success', message: 'Обращение в поддержку отправлено' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 origin-bottom-right flex flex-col">
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><HelpCircle className="w-5 h-5"/> Поддержка</h3>
            <button onClick={toggle} className="hover:bg-blue-500 p-1 rounded-full transition" aria-label="Закрыть"><X className="w-4 h-4"/></button>
          </div>
          
          <div className="p-5">
            {step === 'menu' && (
               <div className="space-y-3">
                  <p className="text-sm text-slate-500 mb-4">Здравствуйте! Чем мы можем вам помочь сегодня?</p>
                  {[
                    { icon: MessageCircle, label: 'Написать сообщение', action: () => setStep('form') },
                    { icon: FileText, label: 'Часто задаваемые вопросы', action: () => {} },
                    { icon: Briefcase, label: 'Для организаторов', action: () => {} }
                  ].map((item, idx) => (
                    <button key={idx} onClick={item.action} className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 transition flex items-center gap-3 font-medium text-slate-700 text-sm border border-slate-100 group">
                      <div className="p-2 bg-white rounded-lg group-hover:bg-blue-100 transition"><item.icon className="w-4 h-4"/></div>
                      {item.label}
                    </button>
                  ))}
               </div>
            )}

            {step === 'form' && (
               <form onSubmit={handleSubmit} className="space-y-4">
                  <button type="button" onClick={() => setStep('menu')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center mb-2">
                     <ChevronLeft className="w-3 h-3 mr-1"/> Назад
                  </button>
                  <div>
                     <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Тема</label>
                     <select className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 transition">
                        <option>Техническая проблема</option>
                        <option>Вопрос по конкурсу</option>
                        <option>Жалоба</option>
                        <option>Другое</option>
                     </select>
                  </div>
                  <div>
                     <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">Сообщение</label>
                     <textarea 
                        required
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] transition resize-none" 
                        placeholder="Опишите вашу проблему..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                     />
                  </div>
                  
                  {/* File Attachment */}
                  <div className="flex items-center gap-2">
                    <input type="file" id="support-file" className="hidden" onChange={handleFileChange} />
                    <label htmlFor="support-file" className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-blue-600 cursor-pointer font-medium p-2 hover:bg-slate-50 rounded-lg transition border border-transparent hover:border-slate-200">
                      <Paperclip className="w-3.5 h-3.5"/> 
                      {fileName ? <span className="text-blue-600 truncate max-w-[150px]">{fileName}</span> : 'Прикрепить файл'}
                    </label>
                    {fileName && <button type="button" onClick={() => setFileName(null)}><X className="w-3 h-3 text-red-400"/></button>}
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Отправить'}
                  </button>
               </form>
            )}

            {step === 'success' && (
               <div className="text-center py-6 animate-in zoom-in duration-300">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                     <CheckCircle className="w-6 h-6"/>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">Сообщение отправлено!</h4>
                  <p className="text-xs text-slate-500 mb-4">Мы ответим вам на почту в течение 24 часов.</p>
                  <button onClick={toggle} className="text-sm text-blue-600 font-bold hover:underline">Закрыть</button>
               </div>
            )}
          </div>
        </div>
      )}
      
      <button 
        onClick={toggle}
        aria-label="Открыть поддержку"
        className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-300 flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition duration-300"
      >
         {isOpen ? <X className="w-6 h-6"/> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
};

// --- Main App Component ---

const API_BASE_URL = 'http://localhost:8000';

const App = ({ currentUser: propCurrentUser, setCurrentUser: propSetCurrentUser, isLoggedIn: propIsLoggedIn, setIsLoggedIn: propSetIsLoggedIn }: {
  currentUser: UserData | null;
  setCurrentUser: (user: UserData | null) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Global State
  const [isLoggedIn, setIsLoggedIn] = useState(propIsLoggedIn);
  const [currentUser, setCurrentUser] = useState<UserData | null>(propCurrentUser);
  
  // Sync with props
  useEffect(() => {
    setIsLoggedIn(propIsLoggedIn);
    setCurrentUser(propCurrentUser);
  }, [propIsLoggedIn, propCurrentUser]);
  const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);
  const [contests, setContests] = useState<Contest[]>(INITIAL_CONTESTS);
  const [applications, setApplications] = useState<Application[]>([]);
  const [adminStats, setAdminStats] = useState({
    total_users: 0,
    total_contests: 0,
    total_applications: 0,
    active_applications: 0,
    users_by_role: { 'Студент': 0, 'Организатор': 0, 'Администратор': 0 }
  });
  
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [globalFontSize, setGlobalFontSize] = useState(() => {
    const saved = localStorage.getItem('main_global_font_size');
    return saved ? parseInt(saved, 10) : 100;
  });
  const [themeColor, setThemeColor] = useState(() => {
    return localStorage.getItem('theme_color') || 'blue';
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('high_contrast') === 'true';
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ru';
  });
  
  // Auth State - removed, now handled in separate pages

  // Menu State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Font size management
  const increaseGlobalFont = () => {
    const newSize = Math.min(200, globalFontSize + 10);
    setGlobalFontSize(newSize);
    localStorage.setItem('main_global_font_size', newSize.toString());
  };

  const decreaseGlobalFont = () => {
    const newSize = Math.max(75, globalFontSize - 10);
    setGlobalFontSize(newSize);
    localStorage.setItem('main_global_font_size', newSize.toString());
  };

  const resetGlobalFont = () => {
    setGlobalFontSize(100);
    localStorage.setItem('main_global_font_size', '100');
  };

  // Theme management
  const themeColors = {
    blue: { primary: 'blue', gradient: 'from-blue-600 to-indigo-700', bg: 'bg-blue-600', hover: 'hover:bg-blue-700' },
    purple: { primary: 'purple', gradient: 'from-purple-600 to-pink-700', bg: 'bg-purple-600', hover: 'hover:bg-purple-700' },
    green: { primary: 'green', gradient: 'from-green-600 to-emerald-700', bg: 'bg-green-600', hover: 'hover:bg-green-700' },
    orange: { primary: 'orange', gradient: 'from-orange-600 to-red-700', bg: 'bg-orange-600', hover: 'hover:bg-orange-700' },
    teal: { primary: 'teal', gradient: 'from-teal-600 to-cyan-700', bg: 'bg-teal-600', hover: 'hover:bg-teal-700' }
  };

  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    localStorage.setItem('theme_color', color);
  };

  const handleContrastToggle = () => {
    const newContrast = !highContrast;
    setHighContrast(newContrast);
    localStorage.setItem('high_contrast', newContrast.toString());
  };

  const handleLanguageToggle = () => {
    const newLang = language === 'ru' ? 'en' : 'ru';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const resetAllSettings = () => {
    setGlobalFontSize(100);
    setThemeColor('blue');
    setHighContrast(false);
    setLanguage('ru');
    localStorage.setItem('main_global_font_size', '100');
    localStorage.setItem('theme_color', 'blue');
    localStorage.setItem('high_contrast', 'false');
    localStorage.setItem('language', 'ru');
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(event.target as Node)) {
        setIsFontMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigation State
  const [view, setView] = useState<string>('catalog');
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Инициализация view из URL при первой загрузке
  useEffect(() => {
    const pathname = location.pathname;
    let initialView = 'catalog';
    
    if (pathname.startsWith('/organizer/create')) {
      initialView = 'organizer_create';
    } else if (pathname.startsWith('/organizer/contest/')) {
      const contestId = pathname.split('/organizer/contest/')[1];
      if (contestId) {
        setSelectedContestId(contestId);
        initialView = 'organizer_contest_details';
      }
    } else if (pathname.startsWith('/organizer')) {
      initialView = 'organizer_dashboard';
    } else if (pathname.startsWith('/admin')) {
      initialView = 'admin_dashboard';
    } else if (pathname.startsWith('/contest/')) {
      const contestId = pathname.split('/contest/')[1];
      if (contestId) {
        setSelectedContestId(contestId);
        initialView = 'contest_details';
      }
    } else if (pathname === '/my-contests' || pathname === '/applications') {
      initialView = 'user_applications';
    }
    
    setView(initialView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Выполняется только при монтировании
  
  // Синхронизация view с URL при изменении пути
  useEffect(() => {
    if (isNavigating) return; // Не обновляем view, если мы сами инициировали навигацию
    
    const pathname = location.pathname;
    let newView = 'catalog';
    
    if (pathname.startsWith('/organizer/create')) {
      newView = 'organizer_create';
    } else if (pathname.startsWith('/organizer/contest/')) {
      const contestId = pathname.split('/organizer/contest/')[1];
      if (contestId) {
        setSelectedContestId(contestId);
        newView = 'organizer_contest_details';
      }
    } else if (pathname.startsWith('/organizer')) {
      newView = 'organizer_dashboard';
    } else if (pathname.startsWith('/admin')) {
      newView = 'admin_dashboard';
    } else if (pathname.startsWith('/contest/')) {
      const contestId = pathname.split('/contest/')[1];
      if (contestId) {
        setSelectedContestId(contestId);
        newView = 'contest_details';
      }
    } else if (pathname === '/my-contests' || pathname === '/applications') {
      newView = 'user_applications';
    } else if (pathname === '/' || pathname === '') {
      newView = 'catalog';
    }
    
    if (newView !== view) {
      setView(newView);
    }
  }, [location.pathname]);
  
  // Функция для установки view с обновлением URL
  const setViewWithNavigation = (newView: string, path?: string) => {
    setIsNavigating(true);
    setView(newView);
    if (path) {
      navigate(path);
    } else {
      // Автоматически определяем путь на основе view
      switch (newView) {
        case 'organizer_dashboard':
          navigate('/organizer');
          break;
        case 'organizer_create':
          navigate('/organizer/create');
          break;
        case 'organizer_contest_details':
          if (selectedContestId) {
            navigate(`/organizer/contest/${selectedContestId}`);
          }
          break;
        case 'admin_dashboard':
          navigate('/admin');
          break;
        case 'contest_details':
          if (selectedContestId) {
            navigate(`/contest/${selectedContestId}`);
          }
          break;
        case 'user_applications':
          navigate('/my-contests');
          break;
        case 'catalog':
          navigate('/');
          break;
        default:
          break;
      }
    }
    // Сбрасываем флаг после небольшой задержки
    setTimeout(() => setIsNavigating(false), 100);
  };
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [organizerTab, setOrganizerTab] = useState<'info' | 'applications' | 'results'>('info');
  const [editingContest, setEditingContest] = useState<Partial<Contest> | null>(null);

  // Filters State
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Forms State
  const [newContest, setNewContest] = useState<Partial<Contest>>({ type: 'olympiad', status: 'open' });
  const [newContestImage, setNewContestImage] = useState<File | null>(null);
  const [newContestImagePreview, setNewContestImagePreview] = useState<string | null>(null);
  const [applicationForm, setApplicationForm] = useState({ name: '', group: '', email: '', telegram: '' });
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);
  const [contestFiles, setContestFiles] = useState<File[]>([]);
  
  // Certificates State
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [showCertificateBuilder, setShowCertificateBuilder] = useState(false);
  const [selectedApplicationForCertificate, setSelectedApplicationForCertificate] = useState<Application | null>(null);
  const [certificateBuilderData, setCertificateBuilderData] = useState({
    recipient_name: '',
    team_name: '',
    contest_title: '',
    achievement: '',
    custom_text: '',
    template_style: 'elegant' as 'elegant' | 'modern' | 'classic'
  });
  
  // Загружаем конкурсы с бэкенда при монтировании и объединяем с локальными
  useEffect(() => {
    const loadContestsFromBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/contests`);
        if (response.ok) {
          const contestsData = await response.json();
          // Преобразуем данные из формата бэкенда в формат фронтенда
          const formattedContests: Contest[] = contestsData.map((c: any) => ({
            id: c.id.toString(),
            title: c.title,
            description: c.description,
            fullDescription: c.full_description || c.description,
            documentsAndTasks: c.documents_and_tasks,
            type: c.type as ContestType,
            customTags: c.custom_tags || [],
            startDate: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '',
            endDate: c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : '',
            organizerId: c.organizer_id.toString(),
            organizerName: c.organizer_name,
            image: c.image ? `${API_BASE_URL}${c.image}` : getRandomImage(),
            status: c.status as ContestStatus,
            participantLimit: c.participant_limit,
            resultsPublished: c.results_published || false,
            files: c.files ? c.files.map((f: any) => ({
              name: f.name || 'Файл',
              url: f.url,
              size: typeof f.size === 'number' ? f.size : (typeof f.size === 'string' ? parseInt(f.size) || 0 : 0)
            })) : []
          }));
          // Объединяем с локальными карточками, избегая дубликатов по ID
          const backendIds = new Set(formattedContests.map(c => c.id));
          const localContests = INITIAL_CONTESTS.filter(c => !backendIds.has(c.id));
          setContests([...formattedContests, ...localContests]);
        }
      } catch (error) {
        console.error('Ошибка загрузки конкурсов с сервера:', error);
        // Если не удалось загрузить, используем только локальные
      }
    };
    
    loadContestsFromBackend();
  }, []);

  // --- Actions & Helpers ---

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const simulateLoading = async (action: () => void, delay = 800) => {
    setIsLoading(true);
    await fakeDelay(delay);
    action();
    setIsLoading(false);
  };

  // Backend API functions
  const handleBackendLogin = async (
    loginOrEmail: string, 
    password: string, 
    role: string,
    setErrors?: (errors: Record<string, string>) => void
  ) => {
    setIsLoading(true);
    try {
      // Определяем, что введено - login или email
      const isEmail = loginOrEmail.includes('@');
      const data: any = {
        password: password,
        role: role
      };
      
      // Не отправляем null, только нужные поля
      if (isEmail) {
        data.email = loginOrEmail;
      } else {
        data.login = loginOrEmail;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        const fieldErrors: Record<string, string> = {};
        
        try {
          const errorData = await response.json();
          console.log('Error data from backend:', errorData); // Для отладки
          
          // FastAPI возвращает ошибки в формате { "detail": "сообщение" }
          // или { "detail": [{"loc": ["body", "field"], "msg": "сообщение", "type": "type"}] } для валидации
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // Если detail - массив (валидация Pydantic)
              errorData.detail.forEach((err: any) => {
                if (typeof err === 'string') {
                  errorMessage = err;
                } else if (err.msg) {
                  // Извлекаем имя поля из loc
                  const fieldPath = err.loc || [];
                  const fieldName = fieldPath[fieldPath.length - 1];
                  
                  if (fieldName) {
                    // Преобразуем имя поля для отображения
                    let displayField = fieldName;
                    if (fieldName === 'login') displayField = 'loginOrEmail';
                    if (fieldName === 'email') displayField = 'loginOrEmail';
                    
                    // Переводим сообщения об ошибках на русский
                    let translatedMsg = err.msg;
                    if (err.type) {
                      if (err.type.includes('email') || err.type.includes('value_error.email')) {
                        translatedMsg = 'Введите корректный email адрес';
                      } else if (err.type.includes('string_too_short')) {
                        translatedMsg = `Минимальная длина: ${err.ctx?.min_length || 3} символов`;
                      } else if (err.type.includes('string_too_long')) {
                        translatedMsg = `Максимальная длина: ${err.ctx?.max_length || 128} символов`;
                      } else if (err.type.includes('value_error')) {
                        translatedMsg = 'Неверное значение';
                      }
                    }
                    
                    fieldErrors[displayField] = translatedMsg;
                  } else {
                    errorMessage = err.msg;
                  }
                }
              });
              
              // Если не было ошибок полей, формируем общее сообщение
              if (Object.keys(fieldErrors).length === 0) {
                errorMessage = errorData.detail.map((err: any) => {
                  if (typeof err === 'string') return err;
                  if (err.msg) return err.msg;
                  return JSON.stringify(err);
                }).join(', ');
              }
            } else {
              // Если detail - строка (HTTPException)
              errorMessage = errorData.detail;
              // Пытаемся определить, к какому полю относится ошибка
              const detailLower = errorMessage.toLowerCase();
              if (detailLower.includes('логин') || detailLower.includes('login') || detailLower.includes('неверный логин')) {
                fieldErrors['loginOrEmail'] = errorMessage;
              } else if (detailLower.includes('email') || detailLower.includes('почт') || detailLower.includes('неверный email')) {
                fieldErrors['loginOrEmail'] = errorMessage;
              } else if (detailLower.includes('парол') || detailLower.includes('password') || detailLower.includes('неверный пароль')) {
                fieldErrors['password'] = errorMessage;
              } else if (detailLower.includes('неверный логин/email') || detailLower.includes('неверный логин/email, пароль') || detailLower.includes('неверный логин/email или пароль')) {
                // Общая ошибка авторизации - показываем под обоими полями
                fieldErrors['loginOrEmail'] = 'Неверный логин или email';
                fieldErrors['password'] = 'Неверный пароль';
              } else {
                // Для других ошибок показываем под полем логина/email
                fieldErrors['loginOrEmail'] = errorMessage;
              }
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (parseError) {
          // Если не удалось распарсить JSON, используем стандартное сообщение
          errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        }
        
        // Устанавливаем ошибки полей, если есть
        if (setErrors) {
          console.log('Field errors to set (login):', fieldErrors); // Для отладки
          console.log('Error message (login):', errorMessage); // Для отладки
          console.log('Response status:', response.status); // Для отладки
          
          if (Object.keys(fieldErrors).length > 0) {
            console.log('Setting field errors (login):', fieldErrors); // Для отладки
            setErrors(fieldErrors);
          } else {
            // Если нет ошибок полей, но есть общее сообщение, 
            // для ошибок авторизации (401) все равно показываем ошибки
            if (response.status === 401 || response.status === 403) {
              console.log('No field errors, but 401/403 - setting general errors'); // Для отладки
              setErrors({ 
                loginOrEmail: errorMessage.includes('логин') || errorMessage.includes('email') ? errorMessage : 'Неверный логин или email',
                password: errorMessage.includes('парол') ? errorMessage : 'Неверный пароль'
              });
            } else {
              // Для других ошибок показываем под полем логина/email
              setErrors({ loginOrEmail: errorMessage });
            }
          }
        }
        
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      
      // Преобразуем данные бэкенда в формат фронтенда
      const backendRole = userData.role;
      const frontendRole: UserRole = backendRole === 'Студент' ? 'participant' : 
                                      backendRole === 'Организатор' ? 'organizer' : 
                                      backendRole === 'Администратор' ? 'admin' :
                                      'participant';
      
      // Базовый пользователь для немедленного сохранения
      const baseUser: UserData & { auth_id?: number } = {
        id: userData.id.toString(),
        auth_id: userData.id, // Сохраняем auth_id для API запросов
        name: userData.login,
        email: userData.email,
        role: frontendRole,
        group: '',
        avatar: ''
      };

      // Сначала сохраняем базовые данные для немедленного входа
      setCurrentUser(baseUser);
      setIsLoggedIn(true);
      propSetCurrentUser(baseUser);
      propSetIsLoggedIn(true);
      setViewWithNavigation(baseUser.role === 'admin' ? 'admin_dashboard' : 'catalog');
      addToast({ type: 'success', message: `Добро пожаловать, ${baseUser.name}!` });
      localStorage.setItem('user', JSON.stringify(baseUser));

      // Затем загружаем полный профиль с сервера (включая аватар и другие данные)
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/users/me?user_id=${userData.id}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const fullUser = {
            ...baseUser,
            name: profileData.name || baseUser.name,
            email: profileData.email || baseUser.email,
            phone: profileData.phone || '',
            group: profileData.group || '',
            bio: profileData.bio || '',
            avatar: profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : '',
            login: profileData.login || baseUser.name,
            education_type: profileData.education_type,
            school_name: profileData.school_name,
            class_name: profileData.class_name,
            education_degree: profileData.education_degree,
            university_name: profileData.university_name
          };
          
          // Обновляем с полными данными
          setCurrentUser(fullUser);
          propSetCurrentUser(fullUser);
          localStorage.setItem('user', JSON.stringify(fullUser));
        }
      } catch (profileError) {
        console.error('Ошибка загрузки профиля после входа:', profileError);
        // Не критично, продолжаем с базовыми данными
      }
    } catch (error: any) {
      let errorMessage = 'Ошибка авторизации';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте, что бэкенд запущен на порту 8000.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addToast({ type: 'error', message: errorMessage });
      throw error; // Пробрасываем ошибку, чтобы форма могла обработать
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackendRegister = async (
    login: string, 
    email: string, 
    password: string, 
    role: string,
    setErrors?: (errors: Record<string, string>) => void
  ) => {
    setIsLoading(true);
    try {
      const data = {
        login: login,
        email: email,
        password: password,
        role: role
      };

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        const fieldErrors: Record<string, string> = {};
        
        try {
          const errorData = await response.json();
          console.log('Error data from backend:', errorData); // Для отладки
          
          // FastAPI возвращает ошибки в формате { "detail": "сообщение" }
          // или { "detail": [{"loc": ["body", "field"], "msg": "сообщение", "type": "type"}] } для валидации
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // Если detail - массив (валидация Pydantic)
              errorData.detail.forEach((err: any) => {
                if (typeof err === 'string') {
                  errorMessage = err;
                } else if (err.msg) {
                  // Извлекаем имя поля из loc
                  const fieldPath = err.loc || [];
                  const fieldName = fieldPath[fieldPath.length - 1];
                  
                  if (fieldName) {
                    // Переводим сообщения об ошибках на русский
                    let translatedMsg = err.msg;
                    if (err.type) {
                      if (err.type.includes('email') || err.type.includes('value_error.email')) {
                        translatedMsg = 'Введите корректный email адрес';
                      } else if (err.type.includes('string_too_short')) {
                        translatedMsg = `Минимальная длина: ${err.ctx?.min_length || 3} символов`;
                      } else if (err.type.includes('string_too_long')) {
                        translatedMsg = `Максимальная длина: ${err.ctx?.max_length || 128} символов`;
                      } else if (err.type.includes('value_error')) {
                        translatedMsg = 'Неверное значение';
                      }
                    }
                    
                    fieldErrors[fieldName] = translatedMsg;
                  } else {
                    errorMessage = err.msg;
                  }
                }
              });
              
              // Если не было ошибок полей, формируем общее сообщение
              if (Object.keys(fieldErrors).length === 0) {
                errorMessage = errorData.detail.map((err: any) => {
                  if (typeof err === 'string') return err;
                  if (err.msg) return err.msg;
                  return JSON.stringify(err);
                }).join(', ');
              }
            } else {
              // Если detail - строка (HTTPException)
              errorMessage = errorData.detail;
              // Пытаемся определить, к какому полю относится ошибка
              const detailLower = errorMessage.toLowerCase();
              if (detailLower.includes('логин') || detailLower.includes('login') || detailLower.includes('пользователь с таким логином')) {
                fieldErrors['login'] = errorMessage;
              } else if (detailLower.includes('email') || detailLower.includes('почт') || detailLower.includes('пользователь с таким email')) {
                fieldErrors['email'] = errorMessage;
              } else if (detailLower.includes('парол') || detailLower.includes('password')) {
                fieldErrors['password'] = errorMessage;
              } else {
                // Для других ошибок показываем под полем email
                fieldErrors['email'] = errorMessage;
              }
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (parseError) {
          // Если не удалось распарсить JSON, используем стандартное сообщение
          errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        }
        
        // Устанавливаем ошибки полей, если есть
        if (setErrors) {
          console.log('Field errors to set (register):', fieldErrors); // Для отладки
          console.log('Error message (register):', errorMessage); // Для отладки
          if (Object.keys(fieldErrors).length > 0) {
            console.log('Setting field errors (register):', fieldErrors); // Для отладки
            setErrors(fieldErrors);
          } else {
            // Если нет ошибок полей, но есть общее сообщение,
            // пытаемся определить, к какому полю оно относится
            const detailLower = errorMessage.toLowerCase();
            const newFieldErrors: Record<string, string> = {};
            if (detailLower.includes('логин') || detailLower.includes('login')) {
              newFieldErrors['login'] = errorMessage;
            } else if (detailLower.includes('email') || detailLower.includes('почт')) {
              newFieldErrors['email'] = errorMessage;
            } else if (detailLower.includes('парол') || detailLower.includes('password')) {
              newFieldErrors['password'] = errorMessage;
            } else if (response.status === 400 || response.status === 422) {
              // Для ошибок валидации показываем под полем email
              newFieldErrors['email'] = errorMessage;
            }
            
            if (Object.keys(newFieldErrors).length > 0) {
              setErrors(newFieldErrors);
            }
          }
        }
        
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      
      // После успешной регистрации автоматически логинимся
      const backendRole = userData.role;
      const frontendRole: UserRole = backendRole === 'Студент' ? 'participant' : 
                                      backendRole === 'Организатор' ? 'organizer' : 
                                      backendRole === 'Администратор' ? 'admin' :
                                      'participant';
      
      // Базовый пользователь для немедленного сохранения
      const baseUser: UserData & { auth_id?: number } = {
        id: userData.id.toString(),
        auth_id: userData.id, // Сохраняем auth_id для API запросов
        name: userData.login,
        email: userData.email,
        role: frontendRole,
        group: '',
        avatar: ''
      };

      // Сначала сохраняем базовые данные для немедленного входа
      setCurrentUser(baseUser);
      setIsLoggedIn(true);
      propSetCurrentUser(baseUser);
      propSetIsLoggedIn(true);
      setViewWithNavigation('catalog');
      addToast({ type: 'success', message: `Регистрация успешна! Добро пожаловать, ${baseUser.name}!` });
      localStorage.setItem('user', JSON.stringify(baseUser));

      // Затем загружаем полный профиль с сервера (включая аватар и другие данные)
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/users/me?user_id=${userData.id}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const fullUser = {
            ...baseUser,
            name: profileData.name || baseUser.name,
            email: profileData.email || baseUser.email,
            phone: profileData.phone || '',
            group: profileData.group || '',
            bio: profileData.bio || '',
            avatar: profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : '',
            login: profileData.login || baseUser.name,
            education_type: profileData.education_type,
            school_name: profileData.school_name,
            class_name: profileData.class_name,
            education_degree: profileData.education_degree,
            university_name: profileData.university_name
          };
          
          // Обновляем с полными данными
          setCurrentUser(fullUser);
          propSetCurrentUser(fullUser);
          localStorage.setItem('user', JSON.stringify(fullUser));
        }
      } catch (profileError) {
        console.error('Ошибка загрузки профиля после регистрации:', profileError);
        // Не критично, продолжаем с базовыми данными
      }
    } catch (error: any) {
      let errorMessage = 'Ошибка регистрации';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте, что бэкенд запущен на порту 8000.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addToast({ type: 'error', message: errorMessage });
      throw error; // Пробрасываем ошибку, чтобы форма могла обработать
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userId: string) => {
    simulateLoading(() => {
      const user = users.find(u => u.id === userId);
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
        setViewWithNavigation(user.role === 'admin' ? 'admin_dashboard' : 'catalog');
        addToast({ type: 'success', message: `Добро пожаловать, ${user.name}!` });
      }
    });
  };

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoggedIn(false);
      setCurrentUser(null);
      propSetCurrentUser(null);
      propSetIsLoggedIn(false);
      setViewWithNavigation('catalog');
      localStorage.removeItem('user');
      setIsLoading(false);
      addToast({ type: 'info', message: 'Вы вышли из системы' });
    }, 500);
  };

  // Check localStorage on mount and sync
  useEffect(() => {
    const loadUserFromStorage = async () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
          
          // Сначала устанавливаем базовые данные для быстрого отображения
        setCurrentUser(user);
        setIsLoggedIn(true);
        propSetCurrentUser(user);
        propSetIsLoggedIn(true);
        if (user.role === 'admin') {
          setView('admin_dashboard');
        }
          
          // Затем загружаем полный профиль с сервера, если есть auth_id
          const authId = user.auth_id || (user.id ? parseInt(user.id) : null);
          if (authId) {
            try {
              const profileResponse = await fetch(`${API_BASE_URL}/users/me?user_id=${authId}`);
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                const fullUser = {
                  ...user,
                  name: profileData.name || user.name,
                  email: profileData.email || user.email,
                  phone: profileData.phone || user.phone || '',
                  group: profileData.group || user.group || '',
                  bio: profileData.bio || user.bio || '',
                  avatar: profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : user.avatar || '',
                  login: profileData.login || user.name,
                  education_type: profileData.education_type || user.education_type,
                  school_name: profileData.school_name || user.school_name,
                  class_name: profileData.class_name || user.class_name,
                  education_degree: profileData.education_degree || user.education_degree,
                  university_name: profileData.university_name || user.university_name
                };
                
                // Обновляем с полными данными из БД
                setCurrentUser(fullUser);
                propSetCurrentUser(fullUser);
                localStorage.setItem('user', JSON.stringify(fullUser));
              }
            } catch (profileError) {
              console.error('Ошибка загрузки профиля при монтировании:', profileError);
              // Продолжаем с данными из localStorage
            }
        }
      } catch (e) {
          console.error('Ошибка парсинга пользователя из localStorage:', e);
        localStorage.removeItem('user');
      }
    }
    };
    
    loadUserFromStorage();
  }, [propSetCurrentUser, propSetIsLoggedIn]);

  const handleApply = async () => {
    if (!applicationForm.name || !selectedContestId || !currentUser) {
      addToast({ type: 'error', message: 'Заполните все обязательные поля' });
      return;
    }
    
    const authId = currentUser.auth_id || (currentUser.id ? parseInt(currentUser.id) : null);
    if (!authId) {
      addToast({ type: 'error', message: 'Не удалось определить ID пользователя' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const applicationData = {
        contest_id: parseInt(selectedContestId),
        user_id: authId,
        applicant_name: applicationForm.name.trim(),
        group: applicationForm.group.trim() || null,
        email: currentUser.email || '',
        telegram_username: applicationForm.telegram.trim() || null,
        status: 'pending'
      };
      
      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      });
      
      if (response.ok) {
        const createdApplication = await response.json();
        
        // Преобразуем в формат фронтенда
          const formattedApp: Application = {
            id: createdApplication.id.toString(),
            contestId: createdApplication.contest_id.toString(),
            contestTitle: createdApplication.contest_title,
            userId: createdApplication.user_id.toString(),
            userLogin: createdApplication.user_login,
            applicantName: createdApplication.applicant_name,
            group: createdApplication.group || '',
            email: createdApplication.email,
            telegramUsername: createdApplication.telegram_username || undefined,
            status: createdApplication.status as Application['status'],
            submissionDate: new Date(createdApplication.submission_date).toISOString().split('T')[0],
            score: createdApplication.score || undefined
          };
        
        // Загружаем обновленный список заявок с сервера
        const reloadResponse = await fetch(`${API_BASE_URL}/applications/user/${authId}`);
        if (reloadResponse.ok) {
          const applicationsData = await reloadResponse.json();
          const formattedApplications: Application[] = applicationsData.map((app: any) => ({
            id: app.id.toString(),
            contestId: app.contest_id.toString(),
            contestTitle: app.contest_title,
            userId: app.user_id.toString(),
            userLogin: app.user_login,
            applicantName: app.applicant_name,
            group: app.group || '',
            email: app.email,
            telegramUsername: app.telegram_username || undefined,
            status: app.status as Application['status'],
            submissionDate: new Date(app.submission_date).toISOString().split('T')[0],
            score: app.score || undefined
          }));
          setApplications(formattedApplications);
        } else {
          // Если не удалось перезагрузить, добавляем новую заявку
          setApplications([formattedApp, ...applications]);
        }
        
        setApplicationForm({ name: '', group: '', email: '', telegram: '' });
        setViewWithNavigation('user_applications');
        addToast({ type: 'success', message: 'Заявка успешно отправлена!' });
      } else {
        const errorData = await response.json();
        console.error('Ошибка создания заявки:', errorData);
        
        let errorMessage = 'Ошибка при отправке заявки';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const errors = errorData.detail.map((e: any) => {
              const field = e.loc?.join('.') || 'поле';
              return `${field}: ${e.msg}`;
            }).join(', ');
            errorMessage = `Ошибка валидации: ${errors}`;
          } else {
            errorMessage = errorData.detail;
          }
        }
        addToast({ type: 'error', message: errorMessage });
      }
    } catch (error: any) {
      console.error('Ошибка отправки заявки:', error);
      addToast({ type: 'error', message: 'Ошибка при отправке заявки. Проверьте подключение к серверу.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContest = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!newContest.title || !newContest.description || !currentUser) {
      addToast({ type: 'error', message: 'Заполните все обязательные поля' });
      return;
    }
    
    const authId = currentUser.auth_id || (currentUser.id ? parseInt(currentUser.id) : null);
    if (!authId) {
      addToast({ type: 'error', message: 'Не удалось определить ID организатора' });
      return;
    }
    
    if (!newContest.startDate || !newContest.endDate) {
      addToast({ type: 'error', message: 'Укажите дату начала и окончания конкурса' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Преобразуем даты в формат для бэкенда
      const startDate = new Date(newContest.startDate + 'T00:00:00Z').toISOString();
      const endDate = new Date(newContest.endDate + 'T23:59:59Z').toISOString();
      
      // Валидация данных перед отправкой
      if (!newContest.title || newContest.title.trim().length < 3) {
        addToast({ type: 'error', message: 'Название должно быть минимум 3 символа' });
        setIsLoading(false);
        return;
      }
      
      if (!newContest.description || newContest.description.trim().length < 10) {
        addToast({ type: 'error', message: 'Описание должно быть минимум 10 символов' });
        setIsLoading(false);
        return;
      }
      
      // Создаем конкурс через API
      const contestData = {
        organizer_id: authId,
        title: newContest.title.trim(),
        description: newContest.description.trim(),
        full_description: null, // Убрали поле "Полное описание"
        documents_and_tasks: (newContest.documentsAndTasks || '').trim() || null,
        type: newContest.type || 'olympiad',
        custom_tags: customTags.length > 0 ? customTags : null,
        start_date: startDate,
        end_date: endDate,
        status: newContest.status || 'open',
        participant_limit: newContest.participantLimit || null,
        results_published: false
      };
      
      console.log('Отправка данных конкурса:', contestData);
      
      const response = await fetch(`${API_BASE_URL}/contests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contestData)
      });
      
      if (response.ok) {
        const createdContest = await response.json();
        let imageUrl = null;
        
        // Если есть изображение, загружаем его
        if (newContestImage) {
          try {
            const formData = new FormData();
            formData.append('file', newContestImage);
            
            const imageResponse = await fetch(`${API_BASE_URL}/contests/${createdContest.id}/image`, {
              method: 'POST',
              body: formData
            });
            
            if (imageResponse.ok) {
              const contestWithImage = await imageResponse.json();
              imageUrl = contestWithImage.image;
            }
          } catch (imageError) {
            console.error('Ошибка загрузки изображения:', imageError);
            // Продолжаем, даже если изображение не загрузилось
          }
        }
        
        // Если есть файлы, загружаем их
        if (contestFiles.length > 0) {
          for (const file of contestFiles) {
            try {
              const formData = new FormData();
              formData.append('file', file);
              
              const fileResponse = await fetch(`${API_BASE_URL}/contests/${createdContest.id}/files`, {
                method: 'POST',
                body: formData
              });
              
              if (!fileResponse.ok) {
                console.error(`Ошибка загрузки файла ${file.name}:`, await fileResponse.text());
              }
            } catch (fileError) {
              console.error(`Ошибка загрузки файла ${file.name}:`, fileError);
              // Продолжаем загрузку других файлов
            }
          }
        }
        
        // Обновляем список конкурсов, загружая с сервера
        const reloadResponse = await fetch(`${API_BASE_URL}/contests`);
        if (reloadResponse.ok) {
          const contestsData = await reloadResponse.json();
          const formattedContests: Contest[] = contestsData.map((c: any) => ({
            id: c.id.toString(),
            title: c.title,
            description: c.description,
            fullDescription: c.full_description || c.description,
            documentsAndTasks: c.documents_and_tasks,
            type: c.type as ContestType,
            customTags: c.custom_tags || [],
            startDate: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '',
            endDate: c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : '',
            organizerId: c.organizer_id.toString(),
            organizerName: c.organizer_name,
            image: c.image ? `${API_BASE_URL}${c.image}` : getRandomImage(),
            status: c.status as ContestStatus,
            participantLimit: c.participant_limit,
            resultsPublished: c.results_published || false,
            files: c.files ? c.files.map((f: any) => ({
              name: f.name || 'Файл',
              url: f.url,
              size: f.size || 0
            })) : []
          }));
          
          // Объединяем с локальными карточками
          const backendIds = new Set(formattedContests.map(c => c.id));
          const localContests = INITIAL_CONTESTS.filter(c => !backendIds.has(c.id));
          setContests([...formattedContests, ...localContests]);
        }
        
        // Сбрасываем форму
      setNewContest({ type: 'olympiad', status: 'open' });
      setNewContestImage(null);
      setNewContestImagePreview(null);
      setCustomTags([]);
      setShowCustomTagInput(false);
      setCustomTagInput('');
      setContestFiles([]);
        setNewContestImage(null);
        setNewContestImagePreview(null);
        
        // Переключаемся на панель организатора
        setViewWithNavigation('organizer_dashboard');
      addToast({ type: 'success', message: 'Конкурс создан успешно!' });
      } else {
        const errorData = await response.json();
        console.error('Ошибка создания конкурса:', errorData);
        
        // Обрабатываем ошибки валидации
        let errorMessage = 'Ошибка при создании конкурса';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors
            const errors = errorData.detail.map((e: any) => {
              const field = e.loc?.join('.') || 'поле';
              return `${field}: ${e.msg}`;
            }).join(', ');
            errorMessage = `Ошибка валидации: ${errors}`;
          } else {
            errorMessage = errorData.detail;
          }
        }
        addToast({ type: 'error', message: errorMessage });
      }
    } catch (error: any) {
      console.error('Ошибка создания конкурса:', error);
      addToast({ type: 'error', message: 'Ошибка при создании конкурса. Проверьте подключение к серверу.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContest = async (id: string) => {
    if (!confirm('Вы уверены? Все заявки также будут удалены. Это действие необратимо.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/contests/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok || response.status === 204) {
        // Удаляем из локального состояния
        setContests(contests.filter(c => c.id !== id));
        setApplications(applications.filter(a => a.contestId !== id));
        
        // Переключаемся на панель организатора, если мы были на странице конкурса
        if (view === 'organizer_contest_details' && selectedContestId === id) {
          setViewWithNavigation('organizer_dashboard');
        }
        
        addToast({ type: 'success', message: 'Конкурс удален' });
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка при удалении конкурса' }));
        addToast({ type: 'error', message: errorData.detail || 'Ошибка при удалении конкурса' });
      }
    } catch (error) {
      console.error('Ошибка удаления конкурса:', error);
      addToast({ type: 'error', message: 'Ошибка при удалении конкурса. Проверьте подключение к серверу.' });
    }
  };

  const handleUpdateContest = async (contestId: string, updatedData: Partial<Contest>) => {
    try {
      // Преобразуем данные для бэкенда
      const updateData: any = {};
      
      if (updatedData.title) updateData.title = updatedData.title.trim();
      if (updatedData.description) updateData.description = updatedData.description.trim();
      if (updatedData.fullDescription !== undefined) updateData.full_description = updatedData.fullDescription?.trim() || null;
      if (updatedData.documentsAndTasks !== undefined) updateData.documents_and_tasks = updatedData.documentsAndTasks?.trim() || null;
      if (updatedData.type) updateData.type = updatedData.type;
      if (updatedData.startDate) updateData.start_date = new Date(updatedData.startDate + 'T00:00:00Z').toISOString();
      if (updatedData.endDate) updateData.end_date = new Date(updatedData.endDate + 'T23:59:59Z').toISOString();
      if (updatedData.status) updateData.status = updatedData.status;
      if (updatedData.participantLimit !== undefined) updateData.participant_limit = updatedData.participantLimit || null;
      
      const response = await fetch(`${API_BASE_URL}/contests/${contestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const updatedContest = await response.json();
        
        // Обновляем конкурс в локальном состоянии
        setContests(contests.map(c => {
          if (c.id === contestId) {
            return {
              ...c,
              title: updatedContest.title,
              description: updatedContest.description,
              fullDescription: updatedContest.full_description || updatedContest.description,
              documentsAndTasks: updatedContest.documents_and_tasks,
              type: updatedContest.type as ContestType,
              startDate: updatedContest.start_date ? new Date(updatedContest.start_date).toISOString().split('T')[0] : c.startDate,
              endDate: updatedContest.end_date ? new Date(updatedContest.end_date).toISOString().split('T')[0] : c.endDate,
              status: updatedContest.status as ContestStatus,
              participantLimit: updatedContest.participant_limit,
            };
          }
          return c;
        }));
        
        setEditingContest(null);
        addToast({ type: 'success', message: 'Конкурс обновлен успешно!' });
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка при обновлении конкурса' }));
        addToast({ type: 'error', message: errorData.detail || 'Ошибка при обновлении конкурса' });
      }
    } catch (error) {
      console.error('Ошибка обновления конкурса:', error);
      addToast({ type: 'error', message: 'Ошибка при обновлении конкурса. Проверьте подключение к серверу.' });
    }
  };

  const handlePublishResults = (contestId: string) => {
    simulateLoading(() => {
      setContests(contests.map(c => c.id === contestId ? { ...c, resultsPublished: true, status: 'completed' } : c));
      addToast({ type: 'success', message: 'Результаты опубликованы!' });
    });
  };

  // Функция генерации изображения сертификата
  const generateCertificateImage = (certificateData: any, style: 'elegant' | 'modern' | 'classic' = 'elegant'): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('');
        return;
      }

      // Фон в зависимости от стиля
      if (style === 'elegant') {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
        gradient.addColorStop(0, '#fef3c7');
        gradient.addColorStop(1, '#fde68a');
        ctx.fillStyle = gradient;
      } else if (style === 'modern') {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
        gradient.addColorStop(0, '#e0e7ff');
        gradient.addColorStop(1, '#c7d2fe');
        ctx.fillStyle = gradient;
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
        gradient.addColorStop(0, '#fef2f2');
        gradient.addColorStop(1, '#fee2e2');
        ctx.fillStyle = gradient;
      }
      ctx.fillRect(0, 0, 1200, 800);

      // Декоративная рамка
      ctx.strokeStyle = style === 'elegant' ? '#92400e' : style === 'modern' ? '#4338ca' : '#991b1b';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, 1120, 720);

      // Заголовок
      ctx.fillStyle = style === 'elegant' ? '#92400e' : style === 'modern' ? '#4338ca' : '#991b1b';
      ctx.font = 'bold 48px serif';
      ctx.textAlign = 'center';
      ctx.fillText('СЕРТИФИКАТ', 600, 150);

      // Подзаголовок
      ctx.font = '32px serif';
      ctx.fillText(certificateData.contest_title || 'Конкурс', 600, 220);

      // Текст награждения
      ctx.font = 'italic 28px serif';
      ctx.fillText('награждается', 600, 300);

      // Имя получателя
      ctx.font = 'bold 42px serif';
      ctx.fillText(certificateData.recipient_name || 'Участник', 600, 380);

      // Команда
      if (certificateData.team_name) {
        ctx.font = '28px serif';
        ctx.fillText(`Команда: ${certificateData.team_name}`, 600, 430);
      }

      // Достижение
      if (certificateData.achievement) {
        ctx.font = 'bold 36px serif';
        ctx.fillText(certificateData.achievement, 600, 500);
      }

      // Кастомный текст
      if (certificateData.custom_text) {
        ctx.font = '24px serif';
        const lines = certificateData.custom_text.split('\n');
        lines.forEach((line: string, index: number) => {
          ctx.fillText(line, 600, 570 + (index * 35));
        });
      }

      // Дата
      ctx.font = '20px serif';
      ctx.fillText(new Date().toLocaleDateString('ru-RU'), 600, 720);

      // Подпись
      ctx.font = '18px serif';
      if (certificateData.organizer_name) {
        ctx.fillText(certificateData.organizer_name, 600, 750);
      }

      resolve(canvas.toDataURL('image/png'));
    });
  };

  // Автоматическая генерация сертификатов
  const handleAutoGenerateCertificates = async (contestId: string, topN: number = 3) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/certificates/auto-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contest_id: parseInt(contestId),
          top_n: topN
        })
      });

      if (!response.ok) {
        const error = await response.json();
        addToast({ type: 'error', message: error.detail || 'Ошибка при генерации сертификатов' });
        return;
      }

      const generatedCertificates = await response.json();
      
      const contest = contests.find(c => c.id === contestId);
      
      // Генерируем изображения для каждого сертификата
      for (const cert of generatedCertificates) {
        const imageData = await generateCertificateImage({
          recipient_name: cert.recipient_name,
          team_name: cert.team_name,
          contest_title: cert.contest_title,
          achievement: cert.achievement,
          organizer_name: contest?.organizerName
        }, 'elegant');

        // Сохраняем изображение на сервере
        if (imageData) {
          await fetch(`${API_BASE_URL}/certificates/${cert.id}/save-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image_data: imageData
            })
          });
        }
      }

      // Обновляем список сертификатов
      const certsResponse = await fetch(`${API_BASE_URL}/certificates/contest/${contestId}`);
      if (certsResponse.ok) {
        const certsData = await certsResponse.json();
        setCertificates(prev => {
          const otherCerts = prev.filter(c => c.contest_id !== parseInt(contestId));
          return [...otherCerts, ...certsData];
        });
      }

      addToast({ type: 'success', message: `Успешно создано ${generatedCertificates.length} сертификатов!` });
    } catch (error) {
      console.error('Ошибка генерации сертификатов:', error);
      addToast({ type: 'error', message: 'Ошибка при генерации сертификатов' });
    } finally {
      setIsLoading(false);
    }
  };

  // Создание сертификата через конструктор
  const handleCreateCustomCertificate = async (application: Application) => {
    try {
      setIsLoading(true);
      
      const contest = contests.find(c => c.id === selectedContestId);
      if (!contest) return;

      const response = await fetch(`${API_BASE_URL}/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contest_id: parseInt(contest.id),
          application_id: parseInt(application.id),
          user_id: parseInt(application.userId),
          recipient_name: certificateBuilderData.recipient_name || application.applicantName,
          team_name: certificateBuilderData.team_name || application.group,
          contest_title: certificateBuilderData.contest_title || contest.title,
          achievement: certificateBuilderData.achievement || undefined,
          template_type: 'custom',
          certificate_data: {
            custom_text: certificateBuilderData.custom_text,
            template_style: certificateBuilderData.template_style
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        addToast({ type: 'error', message: error.detail || 'Ошибка при создании сертификата' });
        return;
      }

      const newCertificate = await response.json();

      // Генерируем изображение
      const imageData = await generateCertificateImage({
        recipient_name: certificateBuilderData.recipient_name || application.applicantName,
        team_name: certificateBuilderData.team_name || application.group,
        contest_title: certificateBuilderData.contest_title || contest.title,
        achievement: certificateBuilderData.achievement,
        custom_text: certificateBuilderData.custom_text,
        organizer_name: contest.organizerName
      }, certificateBuilderData.template_style);

      // Сохраняем изображение
      if (imageData) {
        await fetch(`${API_BASE_URL}/certificates/${newCertificate.id}/save-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_data: imageData
          })
        });
      }

      // Обновляем список
      setCertificates(prev => [...prev, newCertificate]);
      setShowCertificateBuilder(false);
      setCertificateBuilderData({
        recipient_name: '',
        team_name: '',
        contest_title: '',
        achievement: '',
        custom_text: '',
        template_style: 'elegant'
      });

      addToast({ type: 'success', message: 'Сертификат успешно создан!' });
    } catch (error) {
      console.error('Ошибка создания сертификата:', error);
      addToast({ type: 'error', message: 'Ошибка при создании сертификата' });
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для перезагрузки заявок конкурса
  const reloadContestApplications = async (contestId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/contest/${contestId}`);
      if (response.ok) {
        const applicationsData = await response.json();
        const formattedApplications: Application[] = applicationsData.map((app: any) => ({
          id: app.id.toString(),
          contestId: app.contest_id.toString(),
          contestTitle: app.contest_title,
          userId: app.user_id.toString(),
          userLogin: app.user_login,
          applicantName: app.applicant_name,
          group: app.group || '',
          email: app.email,
          telegramUsername: app.telegram_username || undefined,
          status: app.status as Application['status'],
          submissionDate: new Date(app.submission_date).toISOString().split('T')[0],
          score: app.score || undefined
        }));
        
        setApplications(prev => {
          const otherApps = prev.filter(a => a.contestId !== contestId);
          return [...otherApps, ...formattedApplications];
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки заявок конкурса:', error);
    }
  };

  const handleUpdateAppStatus = async (appId: string, newStatus: Application['status']) => {
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (response.ok) {
        addToast({ type: 'success', message: 'Статус заявки обновлен' });
        
        // Перезагружаем заявки конкурса, чтобы получить актуальные данные из БД
        if (view === 'organizer_contest_details' && selectedContestId) {
          await reloadContestApplications(selectedContestId);
        } else {
          // Если не в режиме управления конкурсом, обновляем только конкретную заявку
          const updatedApp = await response.json();
          setApplications(prev => prev.map(a => {
            if (a.id === appId) {
              return {
                ...a,
                status: updatedApp.status as Application['status'],
              };
            }
            return a;
          }));
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка при обновлении статуса' }));
        addToast({ type: 'error', message: errorData.detail || 'Ошибка при обновлении статуса' });
      }
    } catch (error) {
      console.error('Ошибка обновления статуса заявки:', error);
      addToast({ type: 'error', message: 'Ошибка при обновлении статуса. Проверьте подключение к серверу.' });
    }
  };

  const handleUpdateScore = async (appId: string, score: number) => {
    // Обновляем локально сразу для лучшего UX
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, score } : a));
    
    // Сохраняем на бэкенд (debounce можно добавить позже)
    try {
      const response = await fetch(`${API_BASE_URL}/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: isNaN(score) ? null : score
        })
      });

      if (!response.ok) {
        // Откатываем изменение при ошибке
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка при обновлении оценки' }));
        addToast({ type: 'error', message: errorData.detail || 'Ошибка при обновлении оценки' });
        // Перезагружаем заявки, чтобы вернуть правильное значение
        if (view === 'organizer_contest_details' && selectedContestId) {
          await reloadContestApplications(selectedContestId);
        }
      }
    } catch (error) {
      console.error('Ошибка обновления оценки:', error);
      // Откатываем изменение при ошибке
      if (view === 'organizer_contest_details' && selectedContestId) {
        await reloadContestApplications(selectedContestId);
      }
    }
  };

  // --- Components for Views ---

  const ProfileEditForm = () => {
    const [form, setForm] = useState<Partial<UserData>>({ ...currentUser });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      
      // Validation
      if (!form.name || !form.email) {
        addToast({ type: 'error', message: 'Имя и Email обязательны' });
        return;
      }
      if (passwords.new && passwords.new !== passwords.confirm) {
        addToast({ type: 'error', message: 'Пароли не совпадают' });
        return;
      }

      setIsSaving(true);
      await fakeDelay(1000);
      
      const updatedUser = { ...currentUser, ...form } as UserData;
      setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      setIsSaving(false);
      addToast({ type: 'success', message: 'Профиль успешно обновлен' });
      
      // Clear passwords
      setPasswords({ current: '', new: '', confirm: '' });
    };

    return (
      <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Настройки профиля</h2>
        <p className="text-slate-500 mb-8">Управляйте личной информацией и безопасностью</p>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="md:col-span-1">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="relative inline-block mb-4 group cursor-pointer">
                   <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-4xl font-bold text-blue-600 border-4 border-white shadow-lg overflow-hidden">
                      {form.avatar ? 
                        <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" /> : 
                        (form.name?.[0] || 'U')
                      }
                   </div>
                   <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <Camera className="w-8 h-8 text-white" />
                   </div>
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{form.name}</h3>
                <div className="text-sm text-slate-500 uppercase font-bold mb-4">{currentUser?.role}</div>
                <button type="button" className="text-sm text-blue-600 font-bold hover:underline">Загрузить фото</button>
             </div>
          </div>

          {/* Form Section */}
          <div className="md:col-span-2 space-y-6">
             {/* General Info */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                   <User className="w-5 h-5 text-blue-600"/>
                   <h3 className="font-bold text-lg text-slate-900">Основная информация</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">ФИО</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        value={form.name || ''}
                        onChange={e => setForm({...form, name: e.target.value})}
                        required
                      />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Телефон</label>
                         <input 
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                           value={form.phone || ''}
                           placeholder="+7 (___) ___-__-__"
                           onChange={e => setForm({...form, phone: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">
                            {currentUser?.role === 'organizer' ? 'Название организации' : 'Класс / Группа'}
                         </label>
                         <input 
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                           value={form.group || ''}
                           onChange={e => setForm({...form, group: e.target.value})}
                         />
                      </div>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">О себе</label>
                      <textarea 
                         className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition h-24 resize-none"
                         value={form.bio || ''}
                         onChange={e => setForm({...form, bio: e.target.value})}
                         placeholder="Расскажите немного о себе..."
                      />
                   </div>
                </div>
             </div>

             {/* Security */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                   <Lock className="w-5 h-5 text-blue-600"/>
                   <h3 className="font-bold text-lg text-slate-900">Безопасность</h3>
                </div>
                <div className="space-y-4">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                      <input 
                        type="email"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        value={form.email || ''}
                        onChange={e => setForm({...form, email: e.target.value})}
                        required
                      />
                   </div>
                   <div className="pt-2 border-t border-slate-100 mt-4">
                      <div className="flex justify-between items-center mb-4 mt-2">
                        <label className="text-sm font-bold text-slate-700">Смена пароля</label>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-blue-600">
                           {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input 
                           type={showPassword ? "text" : "password"}
                           placeholder="Новый пароль"
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                           value={passwords.new}
                           onChange={e => setPasswords({...passwords, new: e.target.value})}
                         />
                         <input 
                           type={showPassword ? "text" : "password"}
                           placeholder="Подтвердите пароль"
                           className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                           value={passwords.confirm}
                           onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                         />
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setViewWithNavigation('catalog')} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition">Отмена</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition flex items-center gap-2 disabled:opacity-70"
                >
                   {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5" /> Сохранить</>}
                </button>
             </div>
          </div>
        </form>
      </div>
    );
  };

  // Login Form Component
  const LoginForm = ({ role }: { role: 'participant' | 'organizer' }) => {
    const [loginOrEmail, setLoginOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Отладка: отслеживаем изменения ошибок
    useEffect(() => {
      console.log('Errors state changed in LoginForm:', errors);
    }, [errors]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({}); // Очищаем предыдущие ошибки
      
      try {
        const backendRole = role === 'participant' ? 'Студент' : 'Организатор';
        await handleBackendLogin(loginOrEmail, password, backendRole, (newErrors) => {
          console.log('Setting errors in LoginForm callback:', newErrors);
          console.log('Current errors state before update:', errors);
          // Устанавливаем ошибки напрямую
          setErrors(newErrors);
          console.log('Errors set, new state should be:', newErrors);
        });
      } catch (error: any) {
        // Ошибка уже обработана в handleBackendLogin
        console.log('Error caught in LoginForm:', error);
        // Дополнительная проверка - если ошибки не были установлены, устанавливаем их здесь
        setTimeout(() => {
          setErrors((prevErrors) => {
            if (Object.keys(prevErrors).length === 0 && error?.message) {
              const errorMsg = error.message.toLowerCase();
              if (errorMsg.includes('неверный') || errorMsg.includes('401')) {
                console.log('Setting fallback errors');
                return {
                  loginOrEmail: 'Неверный логин или email',
                  password: 'Неверный пароль'
                };
              }
            }
            return prevErrors;
          });
        }, 100);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Логин или Email</label>
          <input
            type="text"
            value={loginOrEmail}
            onChange={(e) => {
              setLoginOrEmail(e.target.value);
              // Очищаем ошибку при изменении поля
              setErrors((prevErrors) => {
                if (prevErrors.loginOrEmail) {
                  const newErrors = { ...prevErrors };
                  delete newErrors.loginOrEmail;
                  return newErrors;
                }
                return prevErrors;
              });
            }}
            placeholder="Введите логин или email"
            required
            className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition ${
              errors.loginOrEmail 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-slate-200 focus:ring-blue-500'
            }`}
          />
          {errors.loginOrEmail && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.loginOrEmail}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Пароль</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Очищаем ошибку при изменении поля
                if (errors.password) {
                  setErrors({ ...errors, password: '' });
                }
              }}
              placeholder="Введите пароль"
              required
              minLength={8}
              className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition pr-12 ${
                errors.password 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.password}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Войти'}
        </button>
      </form>
    );
  };

  // Register Form Component
  const RegisterForm = ({ role }: { role: 'participant' }) => {
    const [login, setLogin] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors({}); // Очищаем предыдущие ошибки
      
      // Клиентская валидация
      if (password !== confirmPassword) {
        setErrors({ confirmPassword: 'Пароли не совпадают' });
        addToast({ type: 'error', message: 'Пароли не совпадают' });
        return;
      }
      if (password.length < 8) {
        setErrors({ password: 'Пароль должен содержать минимум 8 символов' });
        addToast({ type: 'error', message: 'Пароль должен содержать минимум 8 символов' });
        return;
      }
      
      try {
        await handleBackendRegister(login, email, password, 'Студент', (newErrors) => {
          console.log('Setting errors in RegisterForm:', newErrors);
          console.log('Current errors state before update:', errors);
          // Используем функциональное обновление, чтобы гарантировать правильное состояние
          setErrors((prevErrors) => {
            console.log('Updating errors from:', prevErrors, 'to:', newErrors);
            return newErrors;
          });
        });
      } catch (error) {
        // Ошибка уже обработана в handleBackendRegister
        console.log('Error caught in RegisterForm:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Логин</label>
          <input
            type="text"
            value={login}
            onChange={(e) => {
              setLogin(e.target.value);
              // Очищаем ошибку при изменении поля
              setErrors((prevErrors) => {
                if (prevErrors.login) {
                  const newErrors = { ...prevErrors };
                  delete newErrors.login;
                  return newErrors;
                }
                return prevErrors;
              });
            }}
            placeholder="Введите логин (мин. 3 символа)"
            required
            minLength={3}
            maxLength={25}
            className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition ${
              errors.login 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-slate-200 focus:ring-blue-500'
            }`}
          />
          {errors.login && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.login}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              // Очищаем ошибку при изменении поля
              setErrors((prevErrors) => {
                if (prevErrors.email) {
                  const newErrors = { ...prevErrors };
                  delete newErrors.email;
                  return newErrors;
                }
                return prevErrors;
              });
            }}
            placeholder="Введите email"
            required
            className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition ${
              errors.email 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-slate-200 focus:ring-blue-500'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Пароль</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Очищаем ошибку при изменении поля
                setErrors((prevErrors) => {
                  if (prevErrors.password) {
                    const newErrors = { ...prevErrors };
                    delete newErrors.password;
                    return newErrors;
                  }
                  return prevErrors;
                });
              }}
              placeholder="Введите пароль (мин. 8 символов)"
              required
              minLength={8}
              maxLength={128}
              className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition pr-12 ${
                errors.password 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.password}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Подтвердите пароль</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                // Очищаем ошибку при изменении поля
                setErrors((prevErrors) => {
                  if (prevErrors.confirmPassword) {
                    const newErrors = { ...prevErrors };
                    delete newErrors.confirmPassword;
                    return newErrors;
                  }
                  return prevErrors;
                });
              }}
              placeholder="Повторите пароль"
              required
              minLength={8}
              className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition pr-12 ${
                errors.confirmPassword 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-200 focus:ring-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.confirmPassword}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Зарегистрироваться'}
        </button>
      </form>
    );
  };


  const renderCatalog = () => {
    const catalogTheme = themeColors[themeColor as keyof typeof themeColors] || themeColors.blue;
    const heroText = language === 'ru' 
      ? { title: 'Единый портал образовательных конкурсов', subtitle: 'Участвуйте в олимпиадах, хакатонах и творческих проектах. Формируйте портфолио и получайте сертификаты онлайн.', button: 'Найти конкурс' }
      : { title: 'Unified Educational Contests Portal', subtitle: 'Participate in olympiads, hackathons and creative projects. Build your portfolio and get certificates online.', button: 'Find Contest' };
    
    return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className={`bg-gradient-to-r ${catalogTheme.gradient} rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden ${highContrast ? 'ring-4 ring-white' : ''}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05))] bg-[length:20px_20px] opacity-30"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 animate-spin-slow text-yellow-300" />
            <h1 className={`text-3xl md:text-5xl font-bold leading-tight ${highContrast ? 'drop-shadow-2xl' : ''}`}>
              {heroText.title}
            </h1>
          </div>
          <p className={`text-white/90 text-lg mb-8 ${highContrast ? 'font-semibold' : ''}`}>{heroText.subtitle}</p>
          <button 
             onClick={() => { document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' }) }}
             className="bg-white text-slate-800 font-bold py-3 px-8 rounded-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-lg focus:ring-4 focus:ring-white/50 outline-none transform"
          >
            {heroText.button}
          </button>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Filters */}
      <div className={`flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-xl border shadow-sm sticky top-20 z-40 transition-all duration-300 ${
        highContrast 
          ? 'bg-white border-slate-400' 
          : 'bg-white border-slate-200'
      }`} id="catalog-grid">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {['all', 'olympiad', 'hackathon', 'creative', 'sport'].map(type => (
            <button
              key={type}
              onClick={() => { setIsLoading(true); setTimeout(() => { setFilterType(type); setIsLoading(false); }, 400); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                filterType === type 
                  ? `${catalogTheme.bg} text-white shadow-md hover:shadow-lg` 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'all' 
                ? (language === 'ru' ? 'Все типы' : 'All Types')
                : getTypeLabel(type as ContestType)
              }
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-slate-400" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48 cursor-pointer transition-all"
          >
            <option value="all">{language === 'ru' ? 'Все статусы' : 'All Statuses'}</option>
            <option value="open">{language === 'ru' ? 'Идет прием заявок' : 'Accepting Applications'}</option>
            <option value="judging">{language === 'ru' ? 'Идет судейство' : 'Judging'}</option>
            <option value="completed">{language === 'ru' ? 'Завершенные' : 'Completed'}</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading 
          ? Array.from({ length: 6 }).map((_, i) => <ContestCardSkeleton key={i} />)
          : contests
              .filter(c => {
                if (filterType === 'all') return true;
                return c.type === filterType;
              })
              .filter(c => filterStatus === 'all' || c.status === filterStatus)
              .map(contest => (
                <div key={contest.id} 
                     onClick={() => { simulateLoading(() => { setSelectedContestId(contest.id); setView('contest_details'); }, 500); }}
                     className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full focus-within:ring-4 focus-within:ring-blue-200"
                     tabIndex={0}
                     onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedContestId(contest.id); setView('contest_details'); } }}
                >
                  <div className="h-48 relative overflow-hidden">
                    <LazyImage src={contest.image} alt={contest.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                       <span className="bg-gradient-to-r from-blue-500/95 to-indigo-500/95 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20 hover:scale-105 transition-transform">
                          {getTypeLabel(contest.type)}
                       </span>
                       {contest.customTags && contest.customTags.length > 0 && contest.customTags.map((tag, idx) => (
                         <span key={idx} className="bg-gradient-to-r from-purple-500/95 to-pink-500/95 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-white/20">
                           {formatTypeAsHashtag(tag)}
                         </span>
                       ))}
                    </div>
                    <div className="absolute bottom-3 right-3">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getContestStatusLabel(contest.status).color}`}>
                          {getContestStatusLabel(contest.status).label}
                       </span>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-xs text-slate-400 mb-2 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(contest.endDate).toLocaleDateString('ru-RU')}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{contest.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-3 flex-1">{contest.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                       <div className="flex items-center text-slate-500 text-sm">
                          <Users className="w-4 h-4 mr-1.5" />
                          {applications.filter(a => a.contestId === contest.id).length} заявок
                       </div>
                       <span className={`${catalogTheme.primary === 'blue' ? 'text-blue-600' : catalogTheme.primary === 'purple' ? 'text-purple-600' : catalogTheme.primary === 'green' ? 'text-green-600' : catalogTheme.primary === 'orange' ? 'text-orange-600' : 'text-teal-600'} font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform`}>
                         {language === 'ru' ? 'Подробнее' : 'Details'} <ChevronLeft className="w-4 h-4 rotate-180 ml-1"/>
                       </span>
                    </div>
                  </div>
                </div>
              ))}
      </div>
      {!isLoading && contests.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-400">{language === 'ru' ? 'Конкурсы не найдены' : 'No contests found'}</p>
        </div>
      )}
    </div>
  );
  };

  const renderContestDetails = () => {
    const contest = contests.find(c => c.id === selectedContestId);
    if (!contest) return null;
    const existingApp = currentUser ? applications.find(a => a.contestId === contest.id && a.userId === currentUser.id) : null;
    const StatusIcon = existingApp ? getStatusInfo(existingApp.status).icon : null;

    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
        <button onClick={() => setViewWithNavigation('catalog')} className="flex items-center text-slate-500 hover:text-slate-800 transition">
          <ChevronLeft className="w-5 h-5 mr-1" /> Назад в каталог
        </button>

        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="relative h-64 md:h-80">
            <LazyImage src={contest.image} className="w-full h-full object-cover" alt="Cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-8 text-white">
              <div className="flex gap-3 mb-2">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20">{getTypeLabel(contest.type)}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getContestStatusLabel(contest.status).color}`}>{getContestStatusLabel(contest.status).label}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold shadow-sm mb-2">{contest.title}</h1>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                 <Briefcase className="w-4 h-4" /> Организатор: {contest.organizerName}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3">
             <div className="lg:col-span-2 p-8 border-r border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Описание</h3>
                <p className="text-slate-600 leading-relaxed mb-8 whitespace-pre-wrap">{contest.fullDescription}</p>

                <h3 className="text-xl font-bold text-slate-900 mb-4">Документы и задания</h3>
                <div className="space-y-3">
                  {contest.documentsAndTasks ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{contest.documentsAndTasks}</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 italic">
                      Документы и задания не добавлены
                    </div>
                  )}
                </div>

                {contest.files && contest.files.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Прикрепленные файлы</h3>
                    <div className="space-y-2">
                      {contest.files.map((f, i) => (
                        <a
                          key={i}
                          href={`${API_BASE_URL}${f.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer group"
                        >
                          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors mr-4">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 group-hover:text-blue-700 truncate">{f.name}</div>
                            <div className="text-xs text-slate-500">{formatFileSize(f.size)}</div>
                          </div>
                          <Download className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity ml-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             <div className="p-8 bg-slate-50">
                {currentUser?.role === 'participant' ? (
                  <>
                    {existingApp ? (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getStatusInfo(existingApp.status).color.replace('text-', 'bg-').split(' ')[1]}`}>
                          {StatusIcon && <StatusIcon className={`w-8 h-8 ${getStatusInfo(existingApp.status).color.split(' ')[0]}`} />}
                        </div>
                        <div className="text-slate-500 text-sm font-medium mb-1">Статус заявки</div>
                        <div className={`text-xl font-bold mb-4 ${getStatusInfo(existingApp.status).color.split(' ')[0]}`}>{getStatusInfo(existingApp.status).label}</div>
                        
                        {contest.resultsPublished && existingApp.score !== undefined && (
                           <div className="mb-6 bg-slate-50 p-4 rounded-xl">
                              <div className="text-slate-400 text-xs uppercase font-bold mb-1">Ваш результат</div>
                              <div className="text-3xl font-bold text-slate-800">{existingApp.score} <span className="text-sm text-slate-400 font-normal">баллов</span></div>
                           </div>
                        )}

                        <button onClick={() => setViewWithNavigation('user_applications')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">
                           Перейти к заявкам
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Подать заявку</h3>
                        {contest.status === 'open' ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Зарегистрирован как</label>
                              <input 
                                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed" 
                                value={currentUser?.login || currentUser?.name || 'Не указано'}
                                readOnly
                                disabled
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                              <input 
                                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed" 
                                value={currentUser?.email || ''}
                                readOnly
                                disabled
                              />
                            </div>
                            <input 
                              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                              placeholder="ФИО или Название команды *"
                              value={applicationForm.name}
                              onChange={e => setApplicationForm({...applicationForm, name: e.target.value})}
                              required
                            />
                             <input 
                              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                              placeholder="Класс / Группа"
                              value={applicationForm.group}
                              onChange={e => setApplicationForm({...applicationForm, group: e.target.value})}
                            />
                            <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Telegram username</label>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-medium">@</span>
                                <input 
                                  className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                  placeholder="username"
                                  value={applicationForm.telegram}
                                  onChange={e => {
                                    // Убираем @ если пользователь его ввел
                                    const value = e.target.value.replace('@', '');
                                    setApplicationForm({...applicationForm, telegram: value});
                                  }}
                                />
                              </div>
                            </div>
                            <button onClick={handleApply} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2">
                               Отправить заявку <Send className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500">
                             Прием заявок на этот конкурс закрыт.
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                     <p className="text-slate-600 mb-4">Вы просматриваете как {currentUser?.role === 'organizer' ? 'Организатор' : 'Администратор'}</p>
                     <button onClick={() => setViewWithNavigation(currentUser?.role === 'admin' ? 'admin_dashboard' : 'organizer_dashboard')} className="w-full py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 text-slate-700 transition">
                        Перейти в панель управления
                     </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  // Загружаем заявки при открытии страницы "Мои заявки"
  useEffect(() => {
    const loadUserApplications = async () => {
      if (view !== 'user_applications' || !currentUser) return;
      
      const authId = currentUser.auth_id || (currentUser.id ? parseInt(currentUser.id) : null);
      if (!authId) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/applications/user/${authId}`);
        if (response.ok) {
          const applicationsData = await response.json();
          const formattedApplications: Application[] = applicationsData.map((app: any) => ({
            id: app.id.toString(),
            contestId: app.contest_id.toString(),
            contestTitle: app.contest_title,
            userId: app.user_id.toString(),
            userLogin: app.user_login,
            applicantName: app.applicant_name,
            group: app.group || '',
            email: app.email,
            telegramUsername: app.telegram_username || undefined,
            status: app.status as Application['status'],
            submissionDate: new Date(app.submission_date).toISOString().split('T')[0],
            score: app.score || undefined
          }));
          setApplications(formattedApplications);
        }
      } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
      }
    };
    
    loadUserApplications();
  }, [view, currentUser]);

  // Загружаем заявки конкурса при открытии управления конкурсом
  useEffect(() => {
    const loadContestApplications = async () => {
      if (view !== 'organizer_contest_details' || !selectedContestId) return;
      
      try {
        const response = await fetch(`${API_BASE_URL}/applications/contest/${selectedContestId}`);
        if (response.ok) {
          const applicationsData = await response.json();
          const formattedApplications: Application[] = applicationsData.map((app: any) => ({
            id: app.id.toString(),
            contestId: app.contest_id.toString(),
            contestTitle: app.contest_title,
            userId: app.user_id.toString(),
            userLogin: app.user_login,
            applicantName: app.applicant_name,
            group: app.group || '',
            email: app.email,
            telegramUsername: app.telegram_username || undefined,
            status: app.status as Application['status'],
            submissionDate: new Date(app.submission_date).toISOString().split('T')[0],
            score: app.score || undefined
          }));
          
          // Обновляем существующие заявки, сохраняя те, которые относятся к другим конкурсам
          setApplications(prev => {
            const otherApps = prev.filter(a => a.contestId !== selectedContestId);
            return [...otherApps, ...formattedApplications];
          });
        }
      } catch (error) {
        console.error('Ошибка загрузки заявок конкурса:', error);
      }
    };
    
    loadContestApplications();
  }, [view, selectedContestId]);

  const renderUserApplications = () => (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <h2 className="text-3xl font-bold text-slate-900">Мои заявки</h2>
      <div className="space-y-4">
        {currentUser && applications.filter(a => {
          const authId = currentUser.auth_id ? currentUser.auth_id.toString() : currentUser.id?.toString();
          return a.userId === authId || a.userId === currentUser.id?.toString();
        }).map(app => {
          const contest = contests.find(c => c.id === app.contestId || c.id.toString() === app.contestId);
          const statusInfo = getStatusInfo(app.status);
          const StatusIcon = statusInfo.icon;
          const canDownloadCertificate = contest?.resultsPublished && (app.status === 'participant' || app.status === 'winner');
          const isWinner = app.status === 'winner';

          return (
             <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 hover:shadow-md transition">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-500">{new Date(app.submissionDate).toLocaleDateString()}</span>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">ID: {app.id}</span>
                   </div>
                   <h3 
                     className="text-xl font-bold text-slate-900 mb-1 cursor-pointer hover:text-blue-600 transition" 
                     onClick={() => { 
                       if (contest || app.contestId) {
                         setSelectedContestId(contest?.id || app.contestId);
                         setViewWithNavigation('contest_details');
                       }
                     }}
                   >
                     {app.contestTitle || contest?.title || 'Неизвестный конкурс'}
                   </h3>
                   <div className="text-slate-500 text-sm mb-4">Участник: {app.applicantName} ({app.group})</div>
                   
                   <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${statusInfo.color}`}>
                         <StatusIcon className="w-4 h-4" /> {statusInfo.label}
                      </span>
                      {contest?.resultsPublished && app.score !== undefined && (
                        <span className="text-slate-700 font-bold px-3">Результат: {app.score} баллов</span>
                      )}
                   </div>
                </div>

                {canDownloadCertificate && (
                   <div className="flex flex-col justify-center gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                      {isWinner && (
                         <button className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition">
                            <Trophy className="w-4 h-4" /> Скачать Диплом
                         </button>
                      )}
                      <button className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition">
                         <FileText className="w-4 h-4" /> Сертификат
                      </button>
                   </div>
                )}
             </div>
          );
        })}
        {currentUser && applications.filter(a => a.userId === currentUser.id).length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
             <p className="text-slate-500 mb-4">У вас пока нет заявок</p>
             <button onClick={() => setViewWithNavigation('catalog')} className="text-blue-600 font-bold hover:underline">Перейти в каталог</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrganizerDashboard = () => (
    <div className="space-y-8 animate-in fade-in">
       <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Панель Организатора</h2>
            <p className="text-slate-500 mt-1">Управление конкурсами и заявками</p>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setViewWithNavigation('organizer_create');
            }} 
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
          >
             <Plus className="w-5 h-5" /> Создать конкурс
          </button>
       </div>

       <div className="grid grid-cols-1 gap-6">
          {currentUser && contests.filter(c => c.organizerId === currentUser.id).map(contest => {
            const contestApps = applications.filter(a => a.contestId === contest.id);
            const pendingApps = contestApps.filter(a => a.status === 'pending').length;

            return (
              <div key={contest.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center">
                 <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                    <LazyImage src={contest.image} className="w-full h-full object-cover" alt="" />
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${getContestStatusLabel(contest.status).color}`}>
                          {getContestStatusLabel(contest.status).label}
                       </span>
                       <span className="text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">{getTypeLabel(contest.type)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{contest.title}</h3>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                       <span className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {contest.startDate} — {contest.endDate}</span>
                       <span className="flex items-center"><Users className="w-4 h-4 mr-1"/> {contestApps.length} участников</span>
                    </div>
                 </div>
                 
                 <div className="flex flex-col items-end gap-3 min-w-[200px]">
                    {pendingApps > 0 && (
                       <div className="text-sm font-bold text-amber-600 flex items-center bg-amber-50 px-3 py-1 rounded-full animate-pulse">
                          {pendingApps} новых заявок
                       </div>
                    )}
                    <button 
                       onClick={() => { setSelectedContestId(contest.id); setOrganizerTab('applications'); setViewWithNavigation('organizer_contest_details'); }}
                       className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition w-full"
                    >
                       Управление
                    </button>
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );

  const renderCreateContest = () => (
     <div className="max-w-3xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-slate-100 animate-in slide-in-from-bottom-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Создание нового конкурса</h2>
        <div className="space-y-6">
           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Название мероприятия</label>
              <input 
                 className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                 placeholder="Например: Олимпиада по физике 2024"
                 value={newContest.title || ''} 
                 onChange={e => setNewContest({...newContest, title: e.target.value})}
              />
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">Дата начала</label>
                 <input type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition" value={newContest.startDate} onChange={e => setNewContest({...newContest, startDate: e.target.value})} />
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-700 mb-2">Дата окончания</label>
                 <input type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 transition" value={newContest.endDate} onChange={e => setNewContest({...newContest, endDate: e.target.value})} />
              </div>
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Тип конкурса <span className="text-xs text-slate-500 font-normal">(обязательно)</span></label>
              
              {/* Standard Types */}
              <div className="flex gap-2 flex-wrap mb-4">
                 {(['olympiad', 'hackathon', 'creative', 'sport'] as ContestType[]).map(t => {
                   const isSelected = newContest.type === t;
                   return (
                    <button 
                      key={t} 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                         setNewContest({...newContest, type: t});
                       }}
                       className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                         isSelected 
                           ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-lg shadow-blue-200' 
                           : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:shadow-md'
                       }`}
                     >
                       {getTypeLabel(t)}
                    </button>
                   );
                 })}
              </div>

              {/* Custom Tags (Хэштеги) */}
              <div className="mb-3">
                <label className="block text-sm font-bold text-slate-700 mb-2">Дополнительные хэштеги <span className="text-xs text-slate-500 font-normal">(необязательно)</span></label>
                
                {/* Selected Tags */}
                {customTags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {customTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-semibold border border-purple-200"
                      >
                        {formatTypeAsHashtag(tag)}
                        <button
                          type="button"
                          onClick={() => {
                            setCustomTags(customTags.filter((_, i) => i !== index));
                          }}
                          className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Add Tag Button */}
                {!showCustomTagInput && (
                  <button 
                    type="button"
                    onClick={() => {
                      setShowCustomTagInput(true);
                      setCustomTagInput('');
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 bg-purple-50 hover:bg-purple-100 text-sm font-semibold transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить хэштег
                  </button>
                )}

                {/* Custom Tag Input */}
                {showCustomTagInput && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2 items-center">
                      <Hash className="w-5 h-5 text-purple-600" />
                      <input
                        type="text"
                        value={customTagInput}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (!value.startsWith('#')) {
                            value = '#' + value;
                          }
                          value = value.replace(/\s+/g, '_');
                          setCustomTagInput(value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customTagInput.trim().length > 1) {
                            e.preventDefault();
                            const newTag = customTagInput.trim();
                            if (!customTags.includes(newTag)) {
                              setCustomTags([...customTags, newTag]);
                              setCustomTagInput('');
                              setShowCustomTagInput(false);
                              addToast({ type: 'success', message: `Хэштег ${formatTypeAsHashtag(newTag)} добавлен!` });
                            } else {
                              addToast({ type: 'info', message: 'Такой хэштег уже добавлен' });
                            }
                          }
                          if (e.key === 'Escape') {
                            setShowCustomTagInput(false);
                            setCustomTagInput('');
                          }
                        }}
                        placeholder="введите_хэштег"
                        className="flex-1 px-4 py-2.5 rounded-lg border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white text-slate-800 font-medium"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customTagInput.trim().length > 1) {
                            const newTag = customTagInput.trim();
                            if (!customTags.includes(newTag)) {
                              setCustomTags([...customTags, newTag]);
                              addToast({ type: 'success', message: `Хэштег ${formatTypeAsHashtag(newTag)} добавлен!` });
                            } else {
                              addToast({ type: 'info', message: 'Такой хэштег уже добавлен' });
                            }
                            setCustomTagInput('');
                            setShowCustomTagInput(false);
                          }
                        }}
                        className="px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md"
                      >
                        Добавить
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomTagInput(false);
                          setCustomTagInput('');
                        }}
                        className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-purple-600">Символ # добавляется автоматически. Используйте _ вместо пробелов</p>
                  </div>
                )}
              </div>
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Описание</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-32 transition" placeholder="Описание конкурса" value={newContest.description} onChange={e => setNewContest({...newContest, description: e.target.value})} />
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Документы и задания</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-40 transition" placeholder="Введите текст с документами, заданиями, требованиями и т.д." value={newContest.documentsAndTasks || ''} onChange={e => setNewContest({...newContest, documentsAndTasks: e.target.value})} />
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Прикрепленные файлы <span className="text-xs text-slate-500 font-normal">(PDF, DOC, DOCX, TXT и т.д.)</span></label>
              
              {/* Список выбранных файлов */}
              {contestFiles.length > 0 && (
                <div className="mb-3 space-y-2">
                  {contestFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setContestFiles(contestFiles.filter((_, i) => i !== index));
                        }}
                        className="ml-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Кнопка загрузки файла */}
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                <div className="flex flex-col items-center justify-center pt-3 pb-4">
                  <FileText className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">Нажмите для загрузки файлов</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, TXT, XLS, XLSX до 50MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                  multiple
                  onChange={(e) => {
                    const fileList = e.target.files;
                    if (!fileList) return;
                    
                    const files = Array.from(fileList);
                    const maxSize = 50 * 1024 * 1024; // 50MB
                    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'];
                    
                    const validFiles: File[] = [];
                    
                    files.forEach((file: File) => {
                      const fileName = file.name || '';
                      const ext = '.' + fileName.split('.').pop()?.toLowerCase();
                      if (!allowedExtensions.includes(ext)) {
                        addToast({ type: 'error', message: `Файл ${fileName} имеет неподдерживаемый формат` });
                        return;
                      }
                      if (file.size > maxSize) {
                        addToast({ type: 'error', message: `Файл ${fileName} слишком большой (макс. 50MB)` });
                        return;
                      }
                      validFiles.push(file);
                    });
                    
                    if (validFiles.length > 0) {
                      setContestFiles([...contestFiles, ...validFiles]);
                    }
                  }}
                />
              </label>
           </div>

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Изображение конкурса</label>
              <div className="space-y-3">
                 {newContestImagePreview ? (
                    <div className="relative">
                       <img src={newContestImagePreview} alt="Предпросмотр" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                       <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setNewContestImage(null);
                            setNewContestImagePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                       >
                          <X className="w-4 h-4" />
                       </button>
                    </div>
                 ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500 font-medium">Нажмите для загрузки изображения</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG до 5MB</p>
                       </div>
                       <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                   addToast({ type: 'error', message: 'Размер файла не должен превышать 5MB' });
                                   return;
                                }
                                setNewContestImage(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                   setNewContestImagePreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                             }
                          }}
                       />
                    </label>
                 )}
              </div>
           </div>

           <div className="pt-6 flex gap-4">
              <button 
                 type="button"
                 onClick={() => {
                    setViewWithNavigation('organizer_dashboard');
                    setNewContest({ type: 'olympiad', status: 'open' });
                    setCustomTags([]);
                    setShowCustomTagInput(false);
                    setCustomTagInput('');
      setNewContestImage(null);
      setNewContestImagePreview(null);
      setShowCustomTagInput(false);
      setCustomTagInput('');
                    setNewContestImage(null);
                    setNewContestImagePreview(null);
                 }} 
                 className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
              >
                 Отмена
              </button>
              <button 
                 type="button"
                 onClick={handleCreateContest} 
                 disabled={isLoading}
                 className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isLoading ? 'Создание...' : 'Опубликовать конкурс'}
              </button>
           </div>
        </div>
     </div>
  );

  // Загружаем сертификаты при открытии вкладки results
  useEffect(() => {
    if (organizerTab === 'results' && selectedContestId) {
      const loadCertificates = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/certificates/contest/${selectedContestId}`);
          if (response.ok) {
            const certsData = await response.json();
            setCertificates(prev => {
              const otherCerts = prev.filter(c => c.contest_id !== parseInt(selectedContestId));
              return [...otherCerts, ...certsData];
            });
          }
        } catch (error) {
          console.error('Ошибка загрузки сертификатов:', error);
        }
      };
      loadCertificates();
    }
  }, [organizerTab, selectedContestId]);

  // Обновление предпросмотра сертификата в конструкторе
  useEffect(() => {
    if (showCertificateBuilder && selectedApplicationForCertificate) {
      const contest = contests.find(c => c.id === selectedContestId);
      if (!contest) return;

      const updatePreview = async () => {
        const previewData = {
          recipient_name: certificateBuilderData.recipient_name || selectedApplicationForCertificate.applicantName,
          team_name: certificateBuilderData.team_name || selectedApplicationForCertificate.group,
          contest_title: certificateBuilderData.contest_title || contest.title,
          achievement: certificateBuilderData.achievement,
          custom_text: certificateBuilderData.custom_text,
          organizer_name: contest.organizerName
        };
        
        const imageData = await generateCertificateImage(previewData, certificateBuilderData.template_style);
        const canvas = document.getElementById('certificate-preview') as HTMLCanvasElement;
        if (canvas && imageData) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
            }
          };
          img.src = imageData;
        }
      };
      
      updatePreview();
    }
  }, [showCertificateBuilder, selectedApplicationForCertificate, certificateBuilderData]);

  const renderContestManagement = () => {
     const contest = contests.find(c => c.id === selectedContestId);
     if (!contest) return null;
     const contestApps = applications.filter(a => a.contestId === contest.id);

     return (
        <div className="space-y-6 animate-in fade-in">
           <button onClick={() => setViewWithNavigation('organizer_dashboard')} className="flex items-center text-slate-500 hover:text-slate-800 mb-4 transition">
              <ChevronLeft className="w-4 h-4 mr-1" /> К списку конкурсов
           </button>
           
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex justify-between items-center flex-wrap gap-4">
              <div>
                 <h2 className="text-2xl font-bold text-slate-900">{contest.title}</h2>
                 <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getContestStatusLabel(contest.status).color}`}>{getContestStatusLabel(contest.status).label}</span>
                    <span>Заявок: {contestApps.length}</span>
                    {contest.resultsPublished && <span className="text-green-600 font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1"/> Результаты опубликованы</span>}
                 </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
                 <button onClick={() => setOrganizerTab('info')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${organizerTab === 'info' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Инфо</button>
                 <button onClick={() => setOrganizerTab('applications')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${organizerTab === 'applications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Заявки ({contestApps.length})</button>
                 <button onClick={() => setOrganizerTab('results')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${organizerTab === 'results' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Публикация</button>
              </div>
           </div>

           {organizerTab === 'applications' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                         <tr>
                            <th className="px-6 py-4">Логин</th>
                            <th className="px-6 py-4">Название команды</th>
                            <th className="px-6 py-4">Telegram</th>
                            <th className="px-6 py-4">Статус</th>
                            <th className="px-6 py-4">Оценка</th>
                            <th className="px-6 py-4 text-right">Действия</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {contestApps.map(app => (
                            <tr key={app.id} className="hover:bg-slate-50 transition">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                     <button
                                        onClick={() => {
                                           // Переход на профиль пользователя
                                           setViewWithNavigation('user_profile');
                                           // Здесь можно добавить логику для открытия профиля конкретного пользователя
                                        }}
                                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
                                     >
                                        {app.userLogin || 'Не указан'}
                                     </button>
                                  </div>
                               </td>
                               <td className="px-6 py-4 font-medium text-slate-900">{app.applicantName}</td>
                               <td className="px-6 py-4 text-slate-600">
                                  {app.telegramUsername ? (
                                     <a 
                                        href={`https://t.me/${app.telegramUsername.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition"
                                     >
                                        <span>@</span>
                                        <span>{app.telegramUsername.replace('@', '')}</span>
                                     </a>
                                  ) : (
                                     <span className="text-slate-400">—</span>
                                  )}
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusInfo(app.status).color}`}>{getStatusInfo(app.status).label}</span>
                               </td>
                               <td className="px-6 py-4">
                                  <input 
                                     type="number" className="w-16 px-2 py-1 border border-slate-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                     placeholder="-" 
                                     value={app.score ?? ''}
                                     onChange={e => handleUpdateScore(app.id, parseInt(e.target.value))}
                                  />
                               </td>
                               <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                  <button onClick={() => handleUpdateAppStatus(app.id, 'approved')} title="Принять" className="p-1.5 hover:bg-green-100 text-green-600 rounded transition"><CheckCircle className="w-5 h-5"/></button>
                                  <button onClick={() => handleUpdateAppStatus(app.id, 'rejected')} title="Отклонить" className="p-1.5 hover:bg-red-100 text-red-600 rounded transition"><X className="w-5 h-5"/></button>
                                  <button onClick={() => handleUpdateAppStatus(app.id, 'winner')} title="Сделать победителем" className={`p-1.5 rounded transition ${app.status === 'winner' ? 'bg-amber-100 text-amber-600' : 'hover:bg-amber-50 text-slate-400 hover:text-amber-600'}`}><Trophy className="w-5 h-5"/></button>
                               </td>
                            </tr>
                         ))}
                         {contestApps.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Заявок пока нет</td></tr>}
                      </tbody>
                   </table>
                 </div>
              </div>
           )}

           {organizerTab === 'results' && (
              <div className="space-y-6">
                 {/* Статистика */}
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                       <Award className="w-6 h-6 text-blue-600"/> Результаты и сертификаты
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-4 mb-8 text-left bg-slate-50 p-4 rounded-xl">
                       <div>
                          <div className="text-xs text-slate-400 uppercase font-bold">Всего участников</div>
                          <div className="text-2xl font-bold">{contestApps.filter(a => a.status === 'participant' || a.status === 'winner').length}</div>
                       </div>
                       <div>
                          <div className="text-xs text-slate-400 uppercase font-bold">С оценками</div>
                          <div className="text-2xl font-bold text-blue-600">{contestApps.filter(a => a.score !== null && a.score !== undefined).length}</div>
                       </div>
                       <div>
                          <div className="text-xs text-slate-400 uppercase font-bold">Победителей</div>
                          <div className="text-2xl font-bold text-amber-600">{contestApps.filter(a => a.status === 'winner').length}</div>
                       </div>
                    </div>

                    {/* Автоматическая генерация сертификатов */}
                    <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                       <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <SparklesIcon className="w-5 h-5 text-blue-600"/> Автоматическая генерация сертификатов
                       </h4>
                       <p className="text-sm text-slate-600 mb-4">
                          Система автоматически определит победителей по максимальным оценкам и создаст для них красивые сертификаты
                       </p>
                       <div className="flex gap-3 items-center">
                          <input 
                             type="number" 
                             min="1" 
                             max="10" 
                             defaultValue={3}
                             id="topN"
                             className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                             placeholder="3"
                          />
                          <label htmlFor="topN" className="text-sm text-slate-700 font-medium">топ участников</label>
                          <button 
                             onClick={() => handleAutoGenerateCertificates(contest.id, parseInt((document.getElementById('topN') as HTMLInputElement)?.value || '3'))}
                             disabled={contestApps.filter(a => a.score !== null && a.score !== undefined).length === 0}
                             className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                             <SparklesIcon className="w-4 h-4"/> Сгенерировать автоматически
                          </button>
                       </div>
                    </div>

                    {/* Ручной конструктор сертификатов */}
                    <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                       <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <FileImage className="w-5 h-5 text-purple-600"/> Конструктор сертификатов
                       </h4>
                       <p className="text-sm text-slate-600 mb-4">
                          Создайте персонализированный сертификат для любого участника вручную
                       </p>
                       <button 
                          onClick={() => setShowCertificateBuilder(true)}
                          className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition flex items-center gap-2"
                       >
                          <FileImage className="w-4 h-4"/> Открыть конструктор
                       </button>
                    </div>

                    {/* Публикация результатов */}
                    <div className="border-t border-slate-200 pt-6">
                       <h4 className="text-lg font-bold text-slate-900 mb-4">Публикация результатов</h4>
                       <p className="text-slate-500 mb-4">
                          После публикации результаты станут доступны всем участникам в личных кабинетах. 
                          Победители смогут скачать дипломы, участники — сертификаты.
                          Действие необратимо.
                       </p>
                       {contest.resultsPublished ? (
                          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-700 rounded-xl font-bold">
                             <CheckCircle className="w-5 h-5"/> Результаты уже опубликованы
                          </div>
                       ) : (
                          <button onClick={() => handlePublishResults(contest.id)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                             Опубликовать результаты
                          </button>
                       )}
                    </div>
                 </div>

                 {/* Список созданных сертификатов */}
                 {certificates.filter(c => c.contest_id === parseInt(contest.id)).length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                       <h4 className="text-lg font-bold text-slate-900 mb-4">Созданные сертификаты</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {certificates.filter(c => c.contest_id === parseInt(contest.id)).map((cert) => (
                             <div key={cert.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-start justify-between mb-2">
                                   <div>
                                      <p className="font-bold text-slate-900">{cert.recipient_name}</p>
                                      {cert.team_name && <p className="text-sm text-slate-500">{cert.team_name}</p>}
                                   </div>
                                   {cert.is_auto_generated && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">Авто</span>
                                   )}
                                </div>
                                {cert.achievement && (
                                   <p className="text-sm text-amber-600 font-medium mb-2">{cert.achievement}</p>
                                )}
                                {cert.certificate_file && (
                                   <a
                                      href={`${API_BASE_URL}${cert.certificate_file}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                   >
                                      <DownloadIcon className="w-4 h-4"/> Скачать
                                   </a>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           )}

           {/* Модальное окно конструктора сертификатов */}
           {showCertificateBuilder && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                 <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
                       <h3 className="text-2xl font-bold text-slate-900">Конструктор сертификатов</h3>
                       <button
                          onClick={() => {
                             setShowCertificateBuilder(false);
                             setSelectedApplicationForCertificate(null);
                             setCertificateBuilderData({
                                recipient_name: '',
                                team_name: '',
                                contest_title: '',
                                achievement: '',
                                custom_text: '',
                                template_style: 'elegant'
                             });
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition"
                       >
                          <X className="w-6 h-6 text-slate-500" />
                       </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                       {/* Выбор участника */}
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Выберите участника</label>
                          <select
                             className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                             value={selectedApplicationForCertificate?.id || ''}
                             onChange={(e) => {
                                const app = contestApps.find(a => a.id === e.target.value);
                                if (app) {
                                   setSelectedApplicationForCertificate(app);
                                   setCertificateBuilderData({
                                      recipient_name: app.applicantName,
                                      team_name: app.group,
                                      contest_title: contest.title,
                                      achievement: '',
                                      custom_text: '',
                                      template_style: 'elegant'
                                   });
                                }
                             }}
                          >
                             <option value="">-- Выберите участника --</option>
                             {contestApps.map(app => (
                                <option key={app.id} value={app.id}>
                                   {app.applicantName} {app.group ? `(${app.group})` : ''} {app.score !== null && app.score !== undefined ? `- ${app.score} баллов` : ''}
                                </option>
                             ))}
                          </select>
                       </div>

                       {selectedApplicationForCertificate && (
                          <>
                             {/* Данные сертификата */}
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">Имя получателя</label>
                                   <input
                                      type="text"
                                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                      value={certificateBuilderData.recipient_name}
                                      onChange={(e) => setCertificateBuilderData({...certificateBuilderData, recipient_name: e.target.value})}
                                   />
                                </div>
                                <div>
                                   <label className="block text-sm font-bold text-slate-700 mb-2">Название команды</label>
                                   <input
                                      type="text"
                                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                      value={certificateBuilderData.team_name}
                                      onChange={(e) => setCertificateBuilderData({...certificateBuilderData, team_name: e.target.value})}
                                   />
                                </div>
                             </div>

                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Название конкурса</label>
                                <input
                                   type="text"
                                   className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                   value={certificateBuilderData.contest_title}
                                   onChange={(e) => setCertificateBuilderData({...certificateBuilderData, contest_title: e.target.value})}
                                />
                             </div>

                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Достижение (1 место, Победитель и т.д.)</label>
                                <input
                                   type="text"
                                   className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                   value={certificateBuilderData.achievement}
                                   onChange={(e) => setCertificateBuilderData({...certificateBuilderData, achievement: e.target.value})}
                                   placeholder="Например: 1 место, Победитель, Призер"
                                />
                             </div>

                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Кастомный текст</label>
                                <textarea
                                   className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none h-32"
                                   value={certificateBuilderData.custom_text}
                                   onChange={(e) => setCertificateBuilderData({...certificateBuilderData, custom_text: e.target.value})}
                                   placeholder="Дополнительный текст на сертификате..."
                                />
                             </div>

                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Стиль шаблона</label>
                                <select
                                   className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                   value={certificateBuilderData.template_style}
                                   onChange={(e) => setCertificateBuilderData({...certificateBuilderData, template_style: e.target.value as any})}
                                >
                                   <option value="elegant">Элегантный (золотой)</option>
                                   <option value="modern">Современный (синий)</option>
                                   <option value="classic">Классический (красный)</option>
                                </select>
                             </div>

                             {/* Предпросмотр */}
                             <div className="border-t border-slate-200 pt-6">
                                <h4 className="text-lg font-bold text-slate-900 mb-4">Предпросмотр</h4>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                   <canvas
                                      id="certificate-preview"
                                      className="w-full border border-slate-200 rounded-lg"
                                      style={{ maxWidth: '100%', height: 'auto' }}
                                   />
                                </div>
                             </div>

                             {/* Кнопки действий */}
                             <div className="flex gap-4 pt-4 border-t border-slate-200">
                                <button
                                   onClick={() => {
                                      setShowCertificateBuilder(false);
                                      setSelectedApplicationForCertificate(null);
                                   }}
                                   className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                                >
                                   Отмена
                                </button>
                                <button
                                   onClick={() => {
                                      if (selectedApplicationForCertificate) {
                                         handleCreateCustomCertificate(selectedApplicationForCertificate);
                                      }
                                   }}
                                   disabled={isLoading || !selectedApplicationForCertificate}
                                   className="flex-[2] py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                   {isLoading ? 'Создание...' : 'Создать сертификат'}
                                </button>
                             </div>
                          </>
                       )}
                    </div>
                 </div>
              </div>
           )}

           {organizerTab === 'info' && (
             <div className="bg-white rounded-2xl p-8 border border-slate-200">
               {editingContest ? (
                 <div className="space-y-6">
                   <h3 className="text-xl font-bold text-slate-900">Редактирование конкурса</h3>
                   
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Название конкурса *</label>
                     <input
                       type="text"
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                       value={editingContest.title || ''}
                       onChange={e => setEditingContest({...editingContest, title: e.target.value})}
                     />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Краткое описание *</label>
                     <textarea
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[100px]"
                       value={editingContest.description || ''}
                       onChange={e => setEditingContest({...editingContest, description: e.target.value})}
                     />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Полное описание</label>
                     <textarea
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[150px]"
                       value={editingContest.fullDescription || ''}
                       onChange={e => setEditingContest({...editingContest, fullDescription: e.target.value})}
                     />
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Документы и задания</label>
                     <textarea
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition min-h-[200px]"
                       placeholder="Введите текст с документами, заданиями, требованиями и т.д."
                       value={editingContest.documentsAndTasks || ''}
                       onChange={e => setEditingContest({...editingContest, documentsAndTasks: e.target.value})}
                     />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Дата начала *</label>
                       <input
                         type="date"
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                         value={editingContest.startDate || ''}
                         onChange={e => setEditingContest({...editingContest, startDate: e.target.value})}
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Дата окончания *</label>
                       <input
                         type="date"
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                         value={editingContest.endDate || ''}
                         onChange={e => setEditingContest({...editingContest, endDate: e.target.value})}
                       />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Тип конкурса</label>
                       <select
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                         value={editingContest.type || 'olympiad'}
                         onChange={e => setEditingContest({...editingContest, type: e.target.value as ContestType})}
                       >
                         <option value="olympiad">Олимпиада</option>
                         <option value="creative">Творческий</option>
                         <option value="sport">Спортивный</option>
                         <option value="hackathon">Хакатон</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">Статус</label>
                       <select
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                         value={editingContest.status || 'open'}
                         onChange={e => setEditingContest({...editingContest, status: e.target.value as ContestStatus})}
                       >
                         <option value="open">Открыт</option>
                         <option value="closed">Закрыт</option>
                         <option value="judging">На оценке</option>
                         <option value="completed">Завершен</option>
                       </select>
                     </div>
                   </div>
                   
                   <div className="flex gap-4 pt-4">
                     <button
                       type="button"
                       onClick={() => setEditingContest(null)}
                       className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                     >
                       Отмена
                     </button>
                     <button
                       type="button"
                       onClick={() => {
                         if (editingContest.title && editingContest.description && editingContest.startDate && editingContest.endDate) {
                           handleUpdateContest(contest.id, editingContest);
                         } else {
                           addToast({ type: 'error', message: 'Заполните все обязательные поля' });
                         }
                       }}
                       className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                     >
                       Сохранить изменения
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                   <div className="flex justify-between items-center">
                     <h3 className="text-xl font-bold text-slate-900">Информация о конкурсе</h3>
                     <div className="flex gap-2">
                       <button
                         type="button"
                         onClick={() => setEditingContest({
                           ...contest,
                           documentsAndTasks: contest.documentsAndTasks
                         })}
                         className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                       >
                         Редактировать
                       </button>
                       <button
                         type="button"
                         onClick={() => handleDeleteContest(contest.id)}
                         className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
                       >
                         Удалить
                       </button>
                     </div>
                   </div>
                   
                   <div className="space-y-4">
                     <div>
                       <h4 className="text-sm font-bold text-slate-500 mb-2">Название</h4>
                       <p className="text-slate-900">{contest.title}</p>
                     </div>
                     
                     <div>
                       <h4 className="text-sm font-bold text-slate-500 mb-2">Краткое описание</h4>
                       <p className="text-slate-900">{contest.description}</p>
                     </div>
                     
                     <div>
                       <h4 className="text-sm font-bold text-slate-500 mb-2">Полное описание</h4>
                       <p className="text-slate-600 whitespace-pre-wrap">{contest.fullDescription || contest.description}</p>
                     </div>
                     
                     <div>
                       <h4 className="text-sm font-bold text-slate-500 mb-2">Документы и задания</h4>
                       {contest.documentsAndTasks ? (
                         <p className="text-slate-600 whitespace-pre-wrap">{contest.documentsAndTasks}</p>
                       ) : (
                         <p className="text-slate-400 italic">Документы и задания не добавлены</p>
                       )}
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <h4 className="text-sm font-bold text-slate-500 mb-2">Дата начала</h4>
                         <p className="text-slate-900">{new Date(contest.startDate).toLocaleDateString('ru-RU')}</p>
                       </div>
                       <div>
                         <h4 className="text-sm font-bold text-slate-500 mb-2">Дата окончания</h4>
                         <p className="text-slate-900">{new Date(contest.endDate).toLocaleDateString('ru-RU')}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           )}
        </div>
     );
  };

  // Загрузка данных для админ-панели
  useEffect(() => {
    const loadAdminData = async () => {
      if (view !== 'admin_dashboard') return;
      
      try {
        // Загружаем пользователей
        const usersResponse = await fetch(`${API_BASE_URL}/auth/users`);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          // Получаем логин из данных пользователя
          const formattedUsers: UserData[] = usersData.map((u: any) => {
            // Логин из Auth таблицы
            const login = u.login || 'Неизвестно';
            return {
              id: u.id.toString(),
              auth_id: u.id,
              name: u.name || login,
              email: u.email,
              role: u.role === 'Студент' ? 'participant' : u.role === 'Организатор' ? 'organizer' : 'admin',
              group: '',
              avatar: '',
              phone: '',
              login: login
            };
          });
          setUsers(formattedUsers);
        }
        
        // Загружаем статистику
        const statsResponse = await fetch(`${API_BASE_URL}/auth/stats`);
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setAdminStats(stats);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных админ-панели:', error);
      }
    };
    
    loadAdminData();
  }, [view]);

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    const authId = parseInt(userId);
    if (isNaN(authId)) return;
    
    // Маппинг ролей для бэкенда
    const backendRole = newRole === 'participant' ? 'Студент' : 
                       newRole === 'organizer' ? 'Организатор' : 
                       'Администратор';
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${authId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: backendRole })
      });
      
      if (response.ok) {
        // Обновляем локальное состояние
        setUsers(users.map(u => u.id === userId ? {...u, role: newRole as UserRole} : u));
        addToast({ type: 'success', message: 'Роль пользователя изменена' });
        
        // Перезагружаем статистику
        const statsResponse = await fetch(`${API_BASE_URL}/auth/stats`);
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setAdminStats(stats);
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка при обновлении роли' }));
        addToast({ type: 'error', message: errorData.detail || 'Ошибка при обновлении роли' });
      }
    } catch (error) {
      console.error('Ошибка обновления роли:', error);
      addToast({ type: 'error', message: 'Ошибка при обновлении роли. Проверьте подключение к серверу.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя? Все связанные данные будут удалены.')) {
      return;
    }
    
    const authId = parseInt(userId);
    if (isNaN(authId)) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${authId}`, {
        method: 'DELETE',
      });
      
      if (response.ok || response.status === 204) {
        // Удаляем из локального состояния
        setUsers(users.filter(u => u.id !== userId));
        addToast({ type: 'success', message: 'Пользователь удален' });
        
        // Перезагружаем статистику
        const statsResponse = await fetch(`${API_BASE_URL}/auth/stats`);
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setAdminStats(stats);
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка при удалении пользователя' }));
        addToast({ type: 'error', message: errorData.detail || 'Ошибка при удалении пользователя' });
      }
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      addToast({ type: 'error', message: 'Ошибка при удалении пользователя. Проверьте подключение к серверу.' });
    }
  };

  const renderAdminDashboard = () => (
     <div className="space-y-8 animate-in fade-in">
        <h2 className="text-3xl font-bold text-slate-900">Административная панель</h2>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-400 text-sm font-medium mb-1">Всего пользователей</div>
              <div className="text-3xl font-bold text-slate-900">{adminStats.total_users}</div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-400 text-sm font-medium mb-1">Конкурсов</div>
              <div className="text-3xl font-bold text-slate-900">{adminStats.total_contests}</div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-400 text-sm font-medium mb-1">Активных заявок</div>
              <div className="text-3xl font-bold text-blue-600">{adminStats.active_applications}</div>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-400 text-sm font-medium mb-1">Организаторов</div>
              <div className="text-3xl font-bold text-slate-900">{adminStats.users_by_role['Организатор'] || 0}</div>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Управление пользователями</div>
           <div className="overflow-x-auto">
             <table className="w-full text-left min-w-[600px]">
                <thead className="text-xs text-slate-400 uppercase bg-white">
                   <tr>
                      <th className="px-6 py-3 font-semibold">Логин</th>
                      <th className="px-6 py-3 font-semibold">Имя</th>
                      <th className="px-6 py-3 font-semibold">Email</th>
                      <th className="px-6 py-3 font-semibold">Роль</th>
                      <th className="px-6 py-3 font-semibold text-right">Действия</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {users.length === 0 ? (
                     <tr>
                       <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                         Загрузка пользователей...
                       </td>
                     </tr>
                   ) : (
                     users.map(u => {
                        const login = u.login || u.name?.split(' ')[0] || 'Не указано';
                        return (
                        <tr key={u.id} className="hover:bg-slate-50 transition">
                           <td className="px-6 py-4 font-medium">{login}</td>
                           <td className="px-6 py-4 font-medium">{u.name || login}</td>
                           <td className="px-6 py-4 text-slate-500">{u.email}</td>
                           <td className="px-6 py-4">
                              <select 
                                 className="bg-slate-100 border-none rounded px-2 py-1 text-sm font-medium text-slate-700 outline-none transition"
                                 value={u.role}
                                 onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                              >
                                 <option value="participant">Участник</option>
                                 <option value="organizer">Организатор</option>
                                 <option value="admin">Админ</option>
                              </select>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                 onClick={() => handleDeleteUser(u.id)}
                                 className="text-red-500 hover:bg-red-50 p-2 rounded transition"
                                 title="Удалить пользователя"
                              >
                                 <Trash2 className="w-4 h-4"/>
                              </button>
                           </td>
                        </tr>
                        );
                     })
                   )}
                </tbody>
             </table>
           </div>
        </div>
     </div>
  );

  // --- Main Logic ---

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.setProperty('--main-font-size', `${globalFontSize}%`);
    html.style.fontSize = `${globalFontSize}%`;
    body.style.fontSize = `${globalFontSize}%`;
    
    return () => {
      html.style.fontSize = '';
      body.style.fontSize = '';
    };
  }, [globalFontSize]);

  const currentTheme = themeColors[themeColor as keyof typeof themeColors] || themeColors.blue;
  
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  return (
    <div 
      className={`min-h-screen font-sans text-slate-900 selection:bg-blue-200 accessibility-page transition-all duration-500 ${
        highContrast 
          ? 'bg-white' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 gradient-animated'
      }`}
    >
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Background Animation */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Accessibility Buttons */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 items-end">
        {/* Language Toggle */}
        <button
          onClick={handleLanguageToggle}
          className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-300 hover:scale-110 transform"
          aria-label="Переключить язык"
          title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
        >
          <Globe className="w-6 h-6" />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white text-indigo-600 rounded-full text-xs font-bold flex items-center justify-center">
            {language === 'ru' ? 'RU' : 'EN'}
          </span>
        </button>

        {/* Theme Settings */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-purple-300 hover:scale-110 transform"
            aria-label="Настройки темы"
            title="Настройки оформления"
          >
            <Palette className="w-6 h-6" />
          </button>
          
          {isThemeMenuOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 min-w-[320px] z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-800">{language === 'ru' ? 'Настройки оформления' : 'Theme Settings'}</h3>
              </div>
              
              {/* Color Theme */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {language === 'ru' ? 'Цветовая тема:' : 'Color Theme:'}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(themeColors).map(([key, color]) => (
                    <button
                      key={key}
                      onClick={() => handleThemeChange(key)}
                      className={`w-10 h-10 rounded-lg ${color.bg} ${color.hover} transition-all duration-300 shadow-md hover:scale-110 transform ${
                        themeColor === key ? 'ring-4 ring-offset-2 ring-purple-500' : ''
                      }`}
                      aria-label={`Выбрать тему ${key}`}
                      title={key}
                    />
                  ))}
                </div>
              </div>

              {/* Contrast Toggle */}
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Contrast className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">
                      {language === 'ru' ? 'Высокий контраст' : 'High Contrast'}
                    </span>
                  </div>
                  <button
                    onClick={handleContrastToggle}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      highContrast ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                    aria-label="Переключить контрастность"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                        highContrast ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {language === 'ru' ? 'Размер шрифта:' : 'Font Size:'}
                  </span>
                  <span className="text-sm font-bold text-purple-600">{globalFontSize}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={decreaseGlobalFont}
                    className="flex-1 h-8 bg-white hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <ZoomOut className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    onClick={increaseGlobalFont}
                    className="flex-1 h-8 bg-white hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <ZoomIn className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetAllSettings}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                {language === 'ru' ? 'Сбросить все настройки' : 'Reset All Settings'}
              </button>
            </div>
          )}
        </div>

        {/* Braille Button */}
        <button
          onClick={() => navigate('/braille')}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-300 hover:scale-110 transform"
          aria-label="Перейти на страницу переводчика Брайля"
          title="Переводчик на шрифт Брайля"
        >
          <Languages className="w-6 h-6" />
        </button>
      </div>
      
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        highContrast 
          ? 'bg-white border-slate-400' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div 
               className="flex items-center gap-2.5 font-bold text-2xl tracking-tight cursor-pointer transition-all duration-300 hover:scale-105 text-slate-900"
               onClick={() => setViewWithNavigation('catalog')}
            >
               <div className={`${currentTheme.bg} text-white p-1.5 rounded-lg shadow-sm transition-all duration-300`}>
                  <Trophy className="w-5 h-5" strokeWidth={3} />
               </div>
               EduContest
            </div>

            <div className={`hidden md:flex p-1 rounded-xl gap-1 transition-all duration-300 ${
              highContrast ? 'bg-slate-200' : 'bg-slate-100/80'
            }`}>
               <button 
                 onClick={() => setViewWithNavigation('catalog')} 
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                   view === 'catalog' || view === 'contest_details' 
                     ? `bg-white shadow ${currentTheme.primary === 'blue' ? 'text-blue-700' : currentTheme.primary === 'purple' ? 'text-purple-700' : currentTheme.primary === 'green' ? 'text-green-700' : currentTheme.primary === 'orange' ? 'text-orange-700' : 'text-teal-700'}` 
                     : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                 {language === 'ru' ? 'Каталог' : 'Catalog'}
               </button>
               
               {isLoggedIn && currentUser?.role === 'participant' && (
                  <button 
                    onClick={() => setViewWithNavigation('user_applications')} 
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      view === 'user_applications' 
                        ? `bg-white shadow ${currentTheme.primary === 'blue' ? 'text-blue-700' : currentTheme.primary === 'purple' ? 'text-purple-700' : currentTheme.primary === 'green' ? 'text-green-700' : currentTheme.primary === 'orange' ? 'text-orange-700' : 'text-teal-700'}` 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ru' ? 'Мои заявки' : 'My Applications'}
                  </button>
               )}
               {isLoggedIn && currentUser?.role === 'organizer' && (
                  <button 
                    onClick={() => setViewWithNavigation('organizer_dashboard')} 
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      view.startsWith('organizer') 
                        ? `bg-white shadow ${currentTheme.primary === 'blue' ? 'text-blue-700' : currentTheme.primary === 'purple' ? 'text-purple-700' : currentTheme.primary === 'green' ? 'text-green-700' : currentTheme.primary === 'orange' ? 'text-orange-700' : 'text-teal-700'}` 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ru' ? 'Организатор' : 'Organizer'}
                  </button>
               )}
               {isLoggedIn && currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => setViewWithNavigation('admin_dashboard')} 
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      view === 'admin_dashboard' 
                        ? `bg-white shadow ${currentTheme.primary === 'blue' ? 'text-blue-700' : currentTheme.primary === 'purple' ? 'text-purple-700' : currentTheme.primary === 'green' ? 'text-green-700' : currentTheme.primary === 'orange' ? 'text-orange-700' : 'text-teal-700'}` 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ru' ? 'Админ' : 'Admin'}
                  </button>
               )}
            </div>
          </div>

          <div className="flex items-center gap-4">
             {isLoggedIn && currentUser ? (
               <div className="pl-4 border-l border-slate-200 relative" ref={profileMenuRef}>
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-3 focus:outline-none group text-left"
                  >
                      <div className="text-right hidden sm:block">
                         <div className="text-sm font-bold text-slate-900 leading-none mb-1">{currentUser.name}</div>
                         <div className="text-xs font-medium text-slate-500 uppercase">{currentUser.role === 'participant' ? 'Участник' : currentUser.role === 'organizer' ? 'Организатор' : 'Администратор'}</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md ring-4 ring-slate-50 cursor-pointer overflow-hidden transition group-hover:scale-105">
                         {currentUser.avatar && currentUser.avatar.length > 2 ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover"/> : currentUser.name[0]}
                      </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                       <button onClick={() => { navigate('/users'); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition">
                          <Settings className="w-4 h-4"/> Настройки профиля
                       </button>
                       <div className="h-px bg-slate-100"></div>
                       <button onClick={() => { handleLogout(); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition">
                          <LogOut className="w-4 h-4" /> Выйти
                       </button>
                    </div>
                  )}
               </div>
             ) : (
               <div className="flex items-center gap-3">
                 <button
                   onClick={() => navigate('/role-selection')}
                   className={`px-4 py-2 text-sm font-medium text-slate-700 transition ${
                     currentTheme.primary === 'blue' ? 'hover:text-blue-600' : 
                     currentTheme.primary === 'purple' ? 'hover:text-purple-600' : 
                     currentTheme.primary === 'green' ? 'hover:text-green-600' : 
                     currentTheme.primary === 'orange' ? 'hover:text-orange-600' : 
                     'hover:text-teal-600'
                   }`}
                 >
                   {language === 'ru' ? 'Войти' : 'Login'}
                 </button>
                 <button
                   onClick={() => navigate('/register')}
                   className={`px-4 py-2 ${currentTheme.bg} text-white rounded-lg text-sm font-medium ${currentTheme.hover} transition shadow-md hover:shadow-lg transform hover:scale-105`}
                 >
                   {language === 'ru' ? 'Регистрация' : 'Register'}
                 </button>
               </div>
             )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 pb-32">
         {view === 'catalog' && renderCatalog()}
         {view === 'contest_details' && renderContestDetails()}
         {view === 'user_applications' && renderUserApplications()}
         {view === 'organizer_dashboard' && renderOrganizerDashboard()}
         {view === 'organizer_create' && renderCreateContest()}
         {view === 'organizer_contest_details' && renderContestManagement()}
         {view === 'admin_dashboard' && renderAdminDashboard()}
         {view === 'profile' && <ProfileEditForm />}
      </main>

      <SupportWidget addToast={addToast} />
    </div>
  );
};

// --- Router Setup ---

// Users Page Component - Настройки профиля
const UsersPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<UserData & {
    login?: string;
    education_type?: 'school' | 'university';
    school_name?: string;
    class_name?: string;
    education_degree?: string;
    university_name?: string;
  }>>({});
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [userAuthId, setUserAuthId] = useState<number | null>(null);
  const [userLogin, setUserLogin] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Загружаем данные пользователя при монтировании
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          navigate('/role-selection');
          return;
        }

        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setUserLogin(user.name || user.login || ''); // Сохраняем логин из localStorage
        
        // Получаем auth_id из сохраненного пользователя (id из таблицы auth)
        const authId = user.auth_id || (user.id ? parseInt(user.id) : null);
        if (authId) {
          setUserAuthId(typeof authId === 'string' ? parseInt(authId) : authId);
          
          // Загружаем профиль с бэкенда
          try {
            const response = await fetch(`${API_BASE_URL}/users/me?user_id=${authId}`);
            if (response.ok) {
              const profileData = await response.json();
              setUserLogin(profileData.login || user.name || '');
              setForm({
                id: user.id,
                name: profileData.name || user.name || '',
                login: profileData.login || user.name || '',
                email: profileData.email || user.email || '',
                role: profileData.role === 'Студент' ? 'participant' : profileData.role === 'Организатор' ? 'organizer' : 'admin',
                group: profileData.group || user.group || '',
                phone: profileData.phone || user.phone || '',
                bio: profileData.bio || user.bio || '',
                avatar: profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : user.avatar || '',
                education_type: profileData.education_type || (user.group ? 'school' : 'university') || 'school',
                school_name: profileData.school_name || '',
                class_name: profileData.class_name || '',
                education_degree: profileData.education_degree || '',
                university_name: profileData.university_name || ''
              });
              
              setCurrentUser(prev => prev ? {
                ...prev,
                name: profileData.name || prev.name,
                email: profileData.email || prev.email,
                phone: profileData.phone || prev.phone,
                group: profileData.group || prev.group,
                bio: profileData.bio || prev.bio,
                avatar: profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : prev.avatar
              } : null);
            } else {
              console.error('Ошибка загрузки профиля:', response.status, response.statusText);
              // Используем данные из localStorage, если API вернул ошибку
              setUserLogin(user.name || user.login || '');
              setForm({
                id: user.id,
                name: user.name || '',
                login: user.name || user.login || '',
                email: user.email || '',
                role: user.role || 'participant',
                group: user.group || '',
                phone: user.phone || '',
                bio: user.bio || '',
                avatar: user.avatar || '',
                education_type: user.education_type || 'school',
                school_name: user.school_name || '',
                class_name: user.class_name || '',
                education_degree: user.education_degree || '',
                university_name: user.university_name || ''
              });
            }
          } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            // Используем данные из localStorage, если API недоступен
            setUserLogin(user.name || user.login || '');
            setForm({
              id: user.id,
              name: user.name || '',
              login: user.name || user.login || '',
              email: user.email || '',
              role: user.role || 'participant',
              group: user.group || '',
              phone: user.phone || '',
              bio: user.bio || '',
              avatar: user.avatar || '',
              education_type: user.education_type || 'school',
              school_name: user.school_name || '',
              class_name: user.class_name || '',
              education_degree: user.education_degree || '',
              university_name: user.university_name || ''
            });
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
        navigate('/role-selection');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userAuthId) return;

    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'Файл должен быть изображением' });
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/users/avatar?user_id=${userAuthId}`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Загружаем полный профиль с обновленным аватаром
        const profileResponse = await fetch(`${API_BASE_URL}/users/me?user_id=${userAuthId}`);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const avatarUrl = profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : '';
          
          // Обновляем форму
          setForm(prev => ({
            ...prev,
            avatar: avatarUrl,
            login: profileData.login || prev.login
          }));
          
          // Обновляем текущего пользователя
          const updatedUser = {
            ...currentUser,
            avatar: avatarUrl,
            login: profileData.login || currentUser?.name || '',
            name: profileData.name || currentUser?.name || '',
            email: profileData.email || currentUser?.email || '',
            phone: profileData.phone || currentUser?.phone || '',
            group: profileData.group || currentUser?.group || '',
            bio: profileData.bio || currentUser?.bio || '',
            education_type: profileData.education_type,
            school_name: profileData.school_name,
            class_name: profileData.class_name,
            education_degree: profileData.education_degree,
            university_name: profileData.university_name
          };
          
          setCurrentUser(updatedUser);
          setUserLogin(profileData.login || userLogin);
          
          // Сохраняем полный профиль в localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          addToast({ type: 'success', message: 'Фото успешно загружено' });
        } else {
          addToast({ type: 'error', message: 'Фото загружено, но не удалось обновить профиль' });
        }
      } else {
        const error = await response.json();
        addToast({ type: 'error', message: error.detail || 'Ошибка при загрузке фото' });
      }
    } catch (error: any) {
      addToast({ type: 'error', message: 'Ошибка при загрузке фото. Проверьте подключение к серверу.' });
      console.error('Ошибка загрузки фото:', error);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userAuthId) return;

    // Validation
    if (!form.name || !form.email) {
      addToast({ type: 'error', message: 'Имя и Email обязательны' });
      return;
    }

    if (passwords.new && passwords.new !== passwords.confirm) {
      addToast({ type: 'error', message: 'Пароли не совпадают' });
      return;
    }

    setIsSaving(true);

    try {
      // Обновляем профиль через API
      const updateData = {
        name: form.name,
        phone: form.phone,
        group: form.group,
        bio: form.bio,
        education_type: form.education_type || 'school',
        school_name: form.school_name,
        class_name: form.class_name,
        education_degree: form.education_degree,
        university_name: form.university_name
      };

      const response = await fetch(`${API_BASE_URL}/users/me?user_id=${userAuthId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Загружаем полный обновленный профиль с сервера
        const profileResponse = await fetch(`${API_BASE_URL}/users/me?user_id=${userAuthId}`);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          
          // Формируем полный объект пользователя с данными из БД
          const updatedUser = {
            id: profileData.auth_id?.toString() || currentUser?.id || '',
            auth_id: profileData.auth_id || userAuthId,
            name: profileData.name || form.name || '',
            email: profileData.email || form.email || '',
            role: profileData.role === 'Студент' ? 'participant' : profileData.role === 'Организатор' ? 'organizer' : 'admin',
            phone: profileData.phone || '',
            group: profileData.group || '',
            bio: profileData.bio || '',
            avatar: profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : '',
            login: profileData.login || userLogin || '',
            // Новые поля для образования
            education_type: profileData.education_type,
            school_name: profileData.school_name,
            class_name: profileData.class_name,
            education_degree: profileData.education_degree,
            university_name: profileData.university_name
          };

          // Обновляем состояние формы с актуальными данными
          setForm({
            ...form,
            name: profileData.name || form.name,
            email: profileData.email || form.email,
            phone: profileData.phone || form.phone,
            group: profileData.group || form.group,
            bio: profileData.bio || form.bio,
            avatar: profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : form.avatar,
            login: profileData.login || form.login,
            education_type: profileData.education_type || form.education_type,
            school_name: profileData.school_name || form.school_name,
            class_name: profileData.class_name || form.class_name,
            education_degree: profileData.education_degree || form.education_degree,
            university_name: profileData.university_name || form.university_name
          });

          setCurrentUser(updatedUser);
          setUserLogin(profileData.login || userLogin);
          
          // Сохраняем в localStorage с полными данными из БД
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          addToast({ type: 'success', message: 'Профиль успешно обновлен' });
          
          // Clear passwords
          setPasswords({ current: '', new: '', confirm: '' });
        } else {
          addToast({ type: 'error', message: 'Профиль обновлен, но не удалось загрузить обновленные данные' });
        }
      } else {
        let errorMessage = 'Ошибка при обновлении профиля';
        try {
          const error = await response.json();
          errorMessage = error.detail || errorMessage;
        } catch {
          errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        }
        addToast({ type: 'error', message: errorMessage });
      }
    } catch (error: any) {
      console.error('Ошибка обновления профиля:', error);
      const errorMessage = error instanceof TypeError && error.message.includes('fetch') 
        ? 'Не удалось подключиться к серверу. Проверьте, что бэкенд запущен на порту 8000.'
        : 'Ошибка при обновлении профиля. Проверьте подключение к серверу.';
      addToast({ type: 'error', message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-lg bg-white/90">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 font-bold text-xl text-slate-900 hover:text-blue-600 transition">
            <ChevronLeft className="w-5 h-5" />
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-blue-600" />
              EduContest
            </div>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-32">
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Настройки профиля</h2>
          <p className="text-slate-500 mb-8">Управляйте личной информацией и безопасностью</p>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avatar Section */}
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="relative inline-block mb-4 group cursor-pointer" onClick={handleAvatarClick}>
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-4xl font-bold text-blue-600 border-4 border-white shadow-lg overflow-hidden">
                    {form.avatar ? (
                      <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      ((form.login || userLogin || form.name)?.[0] || 'U').toUpperCase()
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                  {!uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{form.login || userLogin || form.name || 'Пользователь'}</h3>
                <div className="text-sm text-slate-500 uppercase font-bold mb-4">
                  {currentUser.role === 'participant' ? 'Участник' : currentUser.role === 'organizer' ? 'Организатор' : 'Администратор'}
                </div>
                <button 
                  type="button" 
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="text-sm text-blue-600 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? 'Загрузка...' : 'Загрузить фото'}
                </button>
              </div>
            </div>

            {/* Form Section */}
            <div className="md:col-span-2 space-y-6">
              {/* General Info */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <User className="w-5 h-5 text-blue-600"/>
                  <h3 className="font-bold text-lg text-slate-900">Основная информация</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Логин</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed" 
                      value={form.login || userLogin || ''}
                      disabled
                      readOnly
                    />
                    <p className="text-xs text-slate-500 mt-1">Логин нельзя изменить</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Телефон</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        value={form.phone || ''}
                        placeholder="+7 (___) ___-__-__"
                        onChange={e => setForm({...form, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Тип образования</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({...form, education_type: 'school'})}
                          className={`flex-1 px-4 py-3 rounded-xl border font-medium transition ${
                            form.education_type === 'school' || !form.education_type
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Школа
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({...form, education_type: 'university'})}
                          className={`flex-1 px-4 py-3 rounded-xl border font-medium transition ${
                            form.education_type === 'university'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Университет
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Поля для школы */}
                  {(form.education_type === 'school' || !form.education_type) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Название школы</label>
                        <input 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                          value={form.school_name || ''}
                          placeholder="Например: Лицей №5"
                          onChange={e => setForm({...form, school_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Класс</label>
                        <input 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                          value={form.class_name || ''}
                          placeholder="Например: 9Б"
                          onChange={e => setForm({...form, class_name: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {/* Поля для университета */}
                  {form.education_type === 'university' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Степень образования</label>
                        <select 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                          value={form.education_degree || ''}
                          onChange={e => setForm({...form, education_degree: e.target.value})}
                        >
                          <option value="">Выберите степень</option>
                          <option value="Бакалавриат">Бакалавриат</option>
                          <option value="Специалитет">Специалитет</option>
                          <option value="Магистратура">Магистратура</option>
                          <option value="Аспирантура">Аспирантура</option>
                          <option value="Докторантура">Докторантура</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Институт / Университет</label>
                        <input 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                          value={form.university_name || ''}
                          placeholder="Например: МГУ им. Ломоносова"
                          onChange={e => setForm({...form, university_name: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">О себе</label>
                    <textarea 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition h-24 resize-none"
                      value={form.bio || ''}
                      onChange={e => setForm({...form, bio: e.target.value})}
                      placeholder="Расскажите немного о себе..."
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <Lock className="w-5 h-5 text-blue-600"/>
                  <h3 className="font-bold text-lg text-slate-900">Безопасность</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                    <input 
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                      value={form.email || ''}
                      onChange={e => setForm({...form, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-100 mt-4">
                    <div className="flex justify-between items-center mb-4 mt-2">
                      <label className="text-sm font-bold text-slate-700">Смена пароля</label>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-blue-600">
                        {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Новый пароль"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        value={passwords.new}
                        onChange={e => setPasswords({...passwords, new: e.target.value})}
                      />
                      <input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Подтвердите пароль"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        value={passwords.confirm}
                        onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => navigate('/')} 
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition flex items-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5" /> Сохранить</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 animate-in slide-in-from-right fade-in ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Role Selection Page Component
const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 animate-in fade-in duration-700">
      <div className="bg-white max-w-4xl w-full rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
        {isLoading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin"/></div>}
        
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 font-bold text-2xl tracking-tight mb-8">
              <div className="bg-white text-blue-600 p-2 rounded-xl shadow-lg">
                <Trophy className="w-6 h-6" strokeWidth={3} />
              </div>
              EduContest
            </div>
            <h1 className="text-4xl font-bold mb-4">Единый портал образовательных конкурсов</h1>
            <p className="text-blue-100 text-lg">Управляйте заявками, участвуйте в олимпиадах и публикуйте результаты в одном месте.</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Выберите роль</h2>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/login?role=participant')} 
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition group text-left outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Студент</div>
                <div className="text-sm text-slate-500">Подача заявок, портфолио</div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/login?role=organizer')} 
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition group text-left outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Организатор</div>
                <div className="text-sm text-slate-500">Создание конкурсов, оценка</div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/login?role=admin')} 
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition group text-left outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Администратор</div>
                <div className="text-sm text-slate-500">Управление системой, пользователями</div>
              </div>
            </button>
          </div>
          <p className="mt-8 text-center text-sm text-slate-400">Демонстрационная версия MVP</p>
        </div>
      </div>
    </div>
  );
};

// Login Page Component
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roleParam = searchParams.get('role') as 'participant' | 'organizer' | 'admin' | null;
  
  const [selectedRole, setSelectedRole] = useState<'participant' | 'organizer' | 'admin' | null>(roleParam);
  const [loginOrEmail, setLoginOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleBackendLogin = async (
    loginOrEmail: string, 
    password: string, 
    role: string,
    setErrors?: (errors: Record<string, string>) => void
  ) => {
    setIsLoading(true);
    try {
      const isEmail = loginOrEmail.includes('@');
      const data: any = {
        password: password,
        role: role
      };
      
      if (isEmail) {
        data.email = loginOrEmail;
      } else {
        data.login = loginOrEmail;
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        const fieldErrors: Record<string, string> = {};
        
        try {
          const errorData = await response.json();
          
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorData.detail.forEach((err: any) => {
                if (typeof err === 'string') {
                  errorMessage = err;
                } else if (err.msg) {
                  const fieldPath = err.loc || [];
                  const fieldName = fieldPath[fieldPath.length - 1];
                  
                  if (fieldName) {
                    let displayField = fieldName;
                    if (fieldName === 'login') displayField = 'loginOrEmail';
                    if (fieldName === 'email') displayField = 'loginOrEmail';
                    
                    let translatedMsg = err.msg;
                    if (err.type) {
                      if (err.type.includes('email') || err.type.includes('value_error.email')) {
                        translatedMsg = 'Введите корректный email адрес';
                      } else if (err.type.includes('string_too_short')) {
                        translatedMsg = `Минимальная длина: ${err.ctx?.min_length || 3} символов`;
                      } else if (err.type.includes('string_too_long')) {
                        translatedMsg = `Максимальная длина: ${err.ctx?.max_length || 128} символов`;
                      } else if (err.type.includes('value_error')) {
                        translatedMsg = 'Неверное значение';
                      }
                    }
                    
                    fieldErrors[displayField] = translatedMsg;
                  } else {
                    errorMessage = err.msg;
                  }
                }
              });
              
              if (Object.keys(fieldErrors).length === 0) {
                errorMessage = errorData.detail.map((err: any) => {
                  if (typeof err === 'string') return err;
                  if (err.msg) return err.msg;
                  return JSON.stringify(err);
                }).join(', ');
              }
            } else {
              errorMessage = errorData.detail;
              const detailLower = errorMessage.toLowerCase();
              if (detailLower.includes('логин') || detailLower.includes('login') || detailLower.includes('неверный логин')) {
                fieldErrors['loginOrEmail'] = errorMessage;
              } else if (detailLower.includes('email') || detailLower.includes('почт') || detailLower.includes('неверный email')) {
                fieldErrors['loginOrEmail'] = errorMessage;
              } else if (detailLower.includes('парол') || detailLower.includes('password') || detailLower.includes('неверный пароль')) {
                fieldErrors['password'] = errorMessage;
              } else if (detailLower.includes('неверный логин/email') || detailLower.includes('неверный логин/email, пароль') || detailLower.includes('неверный логин/email или пароль')) {
                fieldErrors['loginOrEmail'] = 'Неверный логин или email';
                fieldErrors['password'] = 'Неверный пароль';
              } else {
                fieldErrors['loginOrEmail'] = errorMessage;
              }
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (parseError) {
          errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        }
        
        if (setErrors) {
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            if (response.status === 401 || response.status === 403) {
              setErrors({ 
                loginOrEmail: errorMessage.includes('логин') || errorMessage.includes('email') ? errorMessage : 'Неверный логин или email',
                password: errorMessage.includes('парол') ? errorMessage : 'Неверный пароль'
              });
            } else {
              setErrors({ loginOrEmail: errorMessage });
            }
          }
        }
        
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      
      const backendRole = userData.role;
      const frontendRole: UserRole = backendRole === 'Студент' ? 'participant' : 
                                      backendRole === 'Организатор' ? 'organizer' : 
                                      backendRole === 'Администратор' ? 'admin' :
                                      'participant';
      
      const baseUser: UserData & { auth_id?: number } = {
        id: userData.id.toString(),
        auth_id: userData.id, // Сохраняем auth_id для API запросов
        name: userData.login,
        email: userData.email,
        role: frontendRole,
        group: '',
        avatar: ''
      };

      // Сначала сохраняем базовые данные
      localStorage.setItem('user', JSON.stringify(baseUser));
      addToast({ type: 'success', message: `Добро пожаловать, ${baseUser.name}!` });
      
      // Затем загружаем полный профиль с сервера (включая аватар)
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/users/me?user_id=${userData.id}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const fullUser = {
            ...baseUser,
            name: profileData.name || baseUser.name,
            email: profileData.email || baseUser.email,
            phone: profileData.phone || '',
            group: profileData.group || '',
            bio: profileData.bio || '',
            avatar: profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : '',
            login: profileData.login || baseUser.name,
            education_type: profileData.education_type,
            school_name: profileData.school_name,
            class_name: profileData.class_name,
            education_degree: profileData.education_degree,
            university_name: profileData.university_name
          };
          
          // Обновляем с полными данными
          localStorage.setItem('user', JSON.stringify(fullUser));
        }
      } catch (profileError) {
        console.error('Ошибка загрузки профиля после входа:', profileError);
        // Не критично, продолжаем с базовыми данными
      }
      
      navigate('/');
    } catch (error: any) {
      let errorMessage = 'Ошибка авторизации';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте, что бэкенд запущен на порту 8000.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addToast({ type: 'error', message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!selectedRole) {
      addToast({ type: 'error', message: 'Выберите роль' });
      return;
    }
    
    try {
      const backendRole = selectedRole === 'participant' ? 'Студент' : 
                          selectedRole === 'organizer' ? 'Организатор' : 
                          'Администратор';
      await handleBackendLogin(loginOrEmail, password, backendRole, setErrors);
    } catch (error) {
      // Ошибка уже обработана
    }
  };

  if (!selectedRole) {
    // Если роль не выбрана, перенаправляем на страницу выбора роли
    navigate('/role-selection');
    return null;
  }

  const roleLabel = selectedRole === 'participant' ? 'Студент' : 
                    selectedRole === 'organizer' ? 'Организатор' : 
                    'Администратор';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 animate-in fade-in duration-700">
      <div className="bg-white max-w-4xl w-full rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
        {isLoading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin"/></div>}
        
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 font-bold text-2xl tracking-tight mb-8">
              <div className="bg-white text-blue-600 p-2 rounded-xl shadow-lg">
                <Trophy className="w-6 h-6" strokeWidth={3} />
              </div>
              EduContest
            </div>
            <h1 className="text-4xl font-bold mb-4">Единый портал образовательных конкурсов</h1>
            <p className="text-blue-100 text-lg">Управляйте заявками, участвуйте в олимпиадах и публикуйте результаты в одном месте.</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-6">
            <button
              onClick={() => navigate('/role-selection')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 transition"
            >
              <ChevronLeft className="w-5 h-5" /> Назад к выбору роли
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Вход как {roleLabel}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Логин или Email</label>
              <input
                type="text"
                value={loginOrEmail}
                onChange={(e) => {
                  setLoginOrEmail(e.target.value);
                  setErrors((prevErrors) => {
                    if (prevErrors.loginOrEmail) {
                      const newErrors = { ...prevErrors };
                      delete newErrors.loginOrEmail;
                      return newErrors;
                    }
                    return prevErrors;
                  });
                }}
                placeholder="Введите логин или email"
                required
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition ${
                  errors.loginOrEmail 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.loginOrEmail && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.loginOrEmail}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prevErrors) => {
                      if (prevErrors.password) {
                        const newErrors = { ...prevErrors };
                        delete newErrors.password;
                        return newErrors;
                      }
                      return prevErrors;
                    });
                  }}
                  placeholder="Введите пароль"
                  required
                  minLength={8}
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition pr-12 ${
                    errors.password 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Войти'}
            </button>
          </form>

          {selectedRole === 'participant' ? (
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                Нет аккаунта?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Зарегистрироваться
                </button>
              </p>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-sm text-slate-500">
                Регистрация доступна только для студентов
              </p>
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

// Register Page Component  
const RegisterPage = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleBackendRegister = async (
    login: string, 
    email: string, 
    password: string, 
    role: string,
    setErrors?: (errors: Record<string, string>) => void
  ) => {
    setIsLoading(true);
    try {
      const data = {
        login: login,
        email: email,
        password: password,
        role: role
      };

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        const fieldErrors: Record<string, string> = {};
        
        try {
          const errorData = await response.json();
          
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorData.detail.forEach((err: any) => {
                if (typeof err === 'string') {
                  errorMessage = err;
                } else if (err.msg) {
                  const fieldPath = err.loc || [];
                  const fieldName = fieldPath[fieldPath.length - 1];
                  
                  if (fieldName) {
                    let translatedMsg = err.msg;
                    if (err.type) {
                      if (err.type.includes('email') || err.type.includes('value_error.email')) {
                        translatedMsg = 'Введите корректный email адрес';
                      } else if (err.type.includes('string_too_short')) {
                        translatedMsg = `Минимальная длина: ${err.ctx?.min_length || 3} символов`;
                      } else if (err.type.includes('string_too_long')) {
                        translatedMsg = `Максимальная длина: ${err.ctx?.max_length || 128} символов`;
                      } else if (err.type.includes('value_error')) {
                        translatedMsg = 'Неверное значение';
                      }
                    }
                    
                    fieldErrors[fieldName] = translatedMsg;
                  } else {
                    errorMessage = err.msg;
                  }
                }
              });
              
              if (Object.keys(fieldErrors).length === 0) {
                errorMessage = errorData.detail.map((err: any) => {
                  if (typeof err === 'string') return err;
                  if (err.msg) return err.msg;
                  return JSON.stringify(err);
                }).join(', ');
              }
            } else {
              errorMessage = errorData.detail;
              const detailLower = errorMessage.toLowerCase();
              if (detailLower.includes('логин') || detailLower.includes('login') || detailLower.includes('пользователь с таким логином')) {
                fieldErrors['login'] = errorMessage;
              } else if (detailLower.includes('email') || detailLower.includes('почт') || detailLower.includes('пользователь с таким email')) {
                fieldErrors['email'] = errorMessage;
              } else if (detailLower.includes('парол') || detailLower.includes('password')) {
                fieldErrors['password'] = errorMessage;
              } else {
                fieldErrors['email'] = errorMessage;
              }
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch (parseError) {
          errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        }
        
        if (setErrors) {
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            const detailLower = errorMessage.toLowerCase();
            const newFieldErrors: Record<string, string> = {};
            if (detailLower.includes('логин') || detailLower.includes('login')) {
              newFieldErrors['login'] = errorMessage;
            } else if (detailLower.includes('email') || detailLower.includes('почт')) {
              newFieldErrors['email'] = errorMessage;
            } else if (detailLower.includes('парол') || detailLower.includes('password')) {
              newFieldErrors['password'] = errorMessage;
            } else if (response.status === 400 || response.status === 422) {
              newFieldErrors['email'] = errorMessage;
            }
            
            if (Object.keys(newFieldErrors).length > 0) {
              setErrors(newFieldErrors);
            }
          }
        }
        
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      
      const backendRole = userData.role;
      const frontendRole: UserRole = backendRole === 'Студент' ? 'participant' : 
                                      backendRole === 'Организатор' ? 'organizer' : 
                                      backendRole === 'Администратор' ? 'admin' :
                                      'participant';
      
      const baseUser: UserData & { auth_id?: number } = {
        id: userData.id.toString(),
        auth_id: userData.id, // Сохраняем auth_id для API запросов
        name: userData.login,
        email: userData.email,
        role: frontendRole,
        group: '',
        avatar: ''
      };

      // Сначала сохраняем базовые данные
      localStorage.setItem('user', JSON.stringify(baseUser));
      addToast({ type: 'success', message: `Регистрация успешна! Добро пожаловать, ${baseUser.name}!` });
      
      // Затем загружаем полный профиль с сервера (включая аватар)
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/users/me?user_id=${userData.id}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const fullUser = {
            ...baseUser,
            name: profileData.name || baseUser.name,
            email: profileData.email || baseUser.email,
            phone: profileData.phone || '',
            group: profileData.group || '',
            bio: profileData.bio || '',
            avatar: profileData.avatar ? `${API_BASE_URL}${profileData.avatar}` : '',
            login: profileData.login || baseUser.name,
            education_type: profileData.education_type,
            school_name: profileData.school_name,
            class_name: profileData.class_name,
            education_degree: profileData.education_degree,
            university_name: profileData.university_name
          };
          
          // Обновляем с полными данными
          localStorage.setItem('user', JSON.stringify(fullUser));
        }
      } catch (profileError) {
        console.error('Ошибка загрузки профиля после регистрации:', profileError);
        // Не критично, продолжаем с базовыми данными
      }
      
      navigate('/');
    } catch (error: any) {
      let errorMessage = 'Ошибка регистрации';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте, что бэкенд запущен на порту 8000.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addToast({ type: 'error', message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Пароли не совпадают' });
      addToast({ type: 'error', message: 'Пароли не совпадают' });
      return;
    }
    if (password.length < 8) {
      setErrors({ password: 'Пароль должен содержать минимум 8 символов' });
      addToast({ type: 'error', message: 'Пароль должен содержать минимум 8 символов' });
      return;
    }
    
    try {
      await handleBackendRegister(login, email, password, 'Студент', setErrors);
    } catch (error) {
      // Ошибка уже обработана
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 animate-in fade-in duration-700">
      <div className="bg-white max-w-4xl w-full rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
        {isLoading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-600 animate-spin"/></div>}
        
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 font-bold text-2xl tracking-tight mb-8">
              <div className="bg-white text-blue-600 p-2 rounded-xl shadow-lg">
                <Trophy className="w-6 h-6" strokeWidth={3} />
              </div>
              EduContest
            </div>
            <h1 className="text-4xl font-bold mb-4">Единый портал образовательных конкурсов</h1>
            <p className="text-blue-100 text-lg">Управляйте заявками, участвуйте в олимпиадах и публикуйте результаты в одном месте.</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4 transition"
            >
              <ChevronLeft className="w-5 h-5" /> Назад на главную
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Регистрация
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value);
                  setErrors((prevErrors) => {
                    if (prevErrors.login) {
                      const newErrors = { ...prevErrors };
                      delete newErrors.login;
                      return newErrors;
                    }
                    return prevErrors;
                  });
                }}
                placeholder="Введите логин (мин. 3 символа)"
                required
                minLength={3}
                maxLength={25}
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition ${
                  errors.login 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.login && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.login}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prevErrors) => {
                    if (prevErrors.email) {
                      const newErrors = { ...prevErrors };
                      delete newErrors.email;
                      return newErrors;
                    }
                    return prevErrors;
                  });
                }}
                placeholder="Введите email"
                required
                className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prevErrors) => {
                      if (prevErrors.password) {
                        const newErrors = { ...prevErrors };
                        delete newErrors.password;
                        return newErrors;
                      }
                      return prevErrors;
                    });
                  }}
                  placeholder="Введите пароль (мин. 8 символов)"
                  required
                  minLength={8}
                  maxLength={128}
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition pr-12 ${
                    errors.password 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Подтвердите пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((prevErrors) => {
                      if (prevErrors.confirmPassword) {
                        const newErrors = { ...prevErrors };
                        delete newErrors.confirmPassword;
                        return newErrors;
                      }
                      return prevErrors;
                    });
                  }}
                  placeholder="Повторите пароль"
                  required
                  minLength={8}
                  className={`w-full px-4 py-3 rounded-xl border bg-slate-50 focus:bg-white focus:ring-2 outline-none transition pr-12 ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-slate-200 focus:ring-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              Уже есть аккаунт?{' '}
              <button
                onClick={() => navigate('/role-selection')}
                className="text-blue-600 font-bold hover:underline"
              >
                Войти
              </button>
            </p>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

// Braille Translator Page Component
const BraillePage = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fontSize, setFontSize] = useState(24);
  const [globalFontSize, setGlobalFontSize] = useState(() => {
    const saved = localStorage.getItem('braille_global_font_size');
    return saved ? parseInt(saved, 10) : 100;
  });

  const increaseGlobalFont = () => {
    const newSize = Math.min(200, globalFontSize + 10);
    setGlobalFontSize(newSize);
    localStorage.setItem('braille_global_font_size', newSize.toString());
  };

  const decreaseGlobalFont = () => {
    const newSize = Math.max(75, globalFontSize - 10);
    setGlobalFontSize(newSize);
    localStorage.setItem('braille_global_font_size', newSize.toString());
  };

  const resetGlobalFont = () => {
    setGlobalFontSize(100);
    localStorage.setItem('braille_global_font_size', '100');
  };

  const brailleMap: { [key: string]: string } = {
    'а': '⠁', 'б': '⠃', 'в': '⠺', 'г': '⠛', 'д': '⠙', 'е': '⠑', 'ё': '⠡', 'ж': '⠚',
    'з': '⠵', 'и': '⠊', 'й': '⠯', 'к': '⠅', 'л': '⠇', 'м': '⠍', 'н': '⠝', 'о': '⠕',
    'п': '⠏', 'р': '⠗', 'с': '⠎', 'т': '⠞', 'у': '⠥', 'ф': '⠋', 'х': '⠓', 'ц': '⠉',
    'ч': '⠟', 'ш': '⠱', 'щ': '⠭', 'ъ': '⠷', 'ы': '⠮', 'ь': '⠾', 'э': '⠪', 'ю': '⠳',
    'я': '⠫',
    'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓',
    'i': '⠊', 'j': '⠚', 'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏',
    'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞', 'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭',
    'y': '⠽', 'z': '⠵',
    '0': '⠴', '1': '⠂', '2': '⠆', '3': '⠒', '4': '⠲', '5': '⠢', '6': '⠖', '7': '⠶',
    '8': '⠦', '9': '⠔',
    ' ': ' ', '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '!': '⠖', '?': '⠦', '-': '⠤',
    '(': '⠶', ')': '⠶', '\'': '⠄', '"': '⠄'
  };

  const convertToBraille = (text: string): string => {
    return text.split('').map(char => {
      const lowerChar = char.toLowerCase();
      return brailleMap[lowerChar] || (brailleMap[char] || char);
    }).join('');
  };

  const handleTranslate = () => {
    const translated = convertToBraille(inputText);
    setOutputText(translated);
  };

  const handleSpeak = () => {
    const textToSpeak = inputText.trim();
    if (!textToSpeak) return;
    
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsSpeaking(false);
        alert('Ошибка озвучки. Попробуйте еще раз или проверьте настройки браузера.');
      };
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error starting speech synthesis:', error);
        setIsSpeaking(false);
        alert('Браузер не поддерживает озвучку или произошла ошибка.');
      }
    } else {
      alert('Ваш браузер не поддерживает функцию озвучки текста.');
    }
  };

  const handleCopy = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-900 accessibility-page"
      style={{ fontSize: `${globalFontSize}%` }}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-2"
            aria-label="Вернуться на главную страницу"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Назад</span>
          </button>
          
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg p-2 border border-slate-200">
            <span className="text-sm font-semibold text-slate-700 px-2">Размер шрифта:</span>
            <button
              onClick={decreaseGlobalFont}
              className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Уменьшить размер шрифта страницы"
              title="Уменьшить размер шрифта"
            >
              <ZoomOut className="w-5 h-5 text-slate-700" />
            </button>
            <span className="text-sm font-semibold text-blue-600 min-w-[4rem] text-center">{globalFontSize}%</span>
            <button
              onClick={increaseGlobalFont}
              className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Увеличить размер шрифта страницы"
              title="Увеличить размер шрифта"
            >
              <ZoomIn className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={resetGlobalFont}
              className="px-3 h-10 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Сбросить размер шрифта"
              title="Сбросить размер шрифта"
            >
              <RotateCw className="w-4 h-4" />
              <span>Сброс</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Languages className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">Переводчик на шрифт Брайля</h1>
                <p className="text-blue-100 text-lg">Для студентов с нарушениями зрения</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label htmlFor="input-text" className="block text-sm font-semibold text-slate-700">
                  Введите текст
                </label>
                <textarea
                  id="input-text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Введите текст для перевода на шрифт Брайля..."
                  className="w-full h-64 p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all resize-none"
                  style={{ fontSize: '1.125rem' }}
                  aria-label="Поле ввода текста"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleTranslate}
                    disabled={!inputText.trim()}
                    className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-200"
                    aria-label="Перевести текст"
                  >
                    Перевести
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors focus:outline-none focus:ring-4 focus:ring-slate-200"
                    aria-label="Очистить все поля"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="output-text" className="block text-sm font-semibold text-slate-700">
                    Шрифт Брайля
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFontSize(Math.max(16, fontSize - 4))}
                      className="px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      aria-label="Уменьшить размер шрифта"
                    >
                      <span className="text-sm font-bold">A−</span>
                    </button>
                    <span className="text-sm text-slate-600 min-w-[3rem] text-center">{fontSize}px</span>
                    <button
                      onClick={() => setFontSize(Math.min(48, fontSize + 4))}
                      className="px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      aria-label="Увеличить размер шрифта"
                    >
                      <span className="text-sm font-bold">A+</span>
                    </button>
                  </div>
                </div>
                <div
                  id="output-text"
                  className="w-full h-64 p-4 border-2 border-slate-200 rounded-xl bg-slate-50 overflow-y-auto braille-text"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '2.5', letterSpacing: '0.15em' }}
                  role="textbox"
                  aria-label="Результат перевода на шрифт Брайля"
                >
                  {outputText || (
                    <span className="text-slate-400 italic">Здесь появится текст на шрифте Брайля...</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSpeak}
                    disabled={!inputText.trim()}
                    className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 ${
                      isSpeaking
                        ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200'
                        : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200'
                    }`}
                    aria-label={isSpeaking ? 'Остановить озвучивание' : 'Озвучить текст'}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Volume2 className="w-5 h-5" />
                      <span>{isSpeaking ? 'Остановить' : 'Озвучить текст'}</span>
                    </div>
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!outputText}
                    className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-slate-200"
                    aria-label="Копировать результат"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h2 className="text-lg font-bold text-blue-900 mb-3">Полезная информация</h2>
              <ul className="space-y-2 text-slate-700 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Шрифт Брайля — это тактильная система чтения для людей с нарушениями зрения</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Каждый символ представлен комбинацией из 6 точек в ячейке 2×3</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Используйте кнопку "Озвучить текст" для прослушивания введенного текста</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Используйте панель "Размер шрифта" вверху страницы для увеличения всего текста на странице (до 200%)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Вы можете изменить размер шрифта Брайля отдельно для удобства чтения</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Настройки размера шрифта сохраняются автоматически</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App with Router
const AppWithRouter = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/role-selection" element={<RoleSelectionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/braille" element={<BraillePage />} />
        <Route path="/*" element={<App currentUser={currentUser} setCurrentUser={setCurrentUser} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
      </Routes>
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<AppWithRouter />);