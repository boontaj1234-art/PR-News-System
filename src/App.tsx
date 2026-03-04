import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Image as ImageIcon, 
  FileText, 
  User, 
  ShieldCheck, 
  ChevronRight, 
  Loader2,
  Trash2,
  X,
  Menu,
  LayoutGrid,
  List as ListIcon,
  ExternalLink,
  Lock,
  LogIn,
  LogOut,
  Share2,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  Download,
  Table,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Swal from 'sweetalert2';

// --- Types ---
interface NewsItem {
  id: number;
  doc_id: string;
  date: string;
  title: string;
  content: string;
  image_url: string;
  note: string;
  created_at: string;
}

interface UserAccount {
  username: string;
  name: string;
}

// --- Components ---

// --- Helpers ---
const getDriveViewLink = (url: string) => {
  if (!url) return "";
  // Match potential Google Drive ID (25-50 characters)
  const match = url.match(/[-\w]{25,}/);
  if (match && (url.includes('drive.google.com') || url.includes('googleusercontent.com'))) {
    return `https://drive.google.com/file/d/${match[0]}/view?usp=sharing`;
  }
  return url;
};

const handleShowQR = (item: NewsItem) => {
  const driveLink = getDriveViewLink(item.image_url);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(driveLink)}`;
  
  Swal.fire({
    title: 'QR Code สำหรับรูปภาพ',
    html: `
      <div class="flex flex-col items-center gap-4 p-4">
        <div class="bg-white p-4 rounded-2xl shadow-inner border border-slate-100">
          <img src="${qrUrl}" alt="QR Code" class="w-48 h-48" />
        </div>
        <p class="text-xs text-slate-500 text-center font-medium">สแกนเพื่อเปิดรูปภาพต้นฉบับใน Google Drive</p>
        <a href="${driveLink}" target="_blank" class="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          เปิดลิงก์โดยตรง
        </a>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: 'ปิด',
    confirmButtonColor: '#4f46e5',
    customClass: { popup: 'rounded-[2rem]' }
  });
};

const handleShare = async (item: NewsItem) => {
  const driveLink = getDriveViewLink(item.image_url);
  const shareData = {
    title: item.title,
    text: item.content?.substring(0, 100) + '...',
    url: driveLink || window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.log('Share failed:', err);
    }
  } else {
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${item.title}\n\n${item.content}\n\nดูรูปภาพ/ข่าวเพิ่มเติมได้ที่: ${driveLink || window.location.href}`);
      Swal.fire({
        title: 'คัดลอกลิงก์แล้ว',
        text: 'คุณสามารถนำไปวางเพื่อแชร์ต่อได้ทันที',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }
};

const formatDateThai = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

const Navbar = ({ activeView, setActiveView, user, onLogout }: { 
  activeView: string, 
  setActiveView: (v: string) => void,
  user: UserAccount | null,
  onLogout: () => void
}) => (
  <nav className="sticky top-0 z-50 glass px-4 py-3 mb-6">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <FileText size={20} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Nonggard News</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">ระบบข่าวประชาสัมพันธ์ โรงเรียนบ้านหนองกาด สพป.ศรีสะเกษ เขต 3</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveView('user')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'user' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <User size={16} />
            <span className="hidden sm:inline">ผู้ใช้ทั่วไป</span>
          </button>
          <button 
            onClick={() => setActiveView('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldCheck size={16} />
            <span className="hidden sm:inline">ผู้ดูแลระบบ</span>
          </button>
        </div>

        {user && (
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="ออกจากระบบ"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </div>
  </nav>
);

const NewsCard = ({ 
  item, 
  onImageClick, 
  onDetailClick 
}: { 
  item: NewsItem, 
  onImageClick: (url: string) => void,
  onDetailClick: (item: NewsItem) => void,
  key?: React.Key
}) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
  >
    <div 
      className="relative aspect-[4/3] overflow-hidden bg-slate-100 cursor-zoom-in"
      onClick={() => item.image_url && onImageClick(item.image_url)}
    >
      {item.image_url ? (
        <img 
          src={item.image_url} 
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-300">
          <ImageIcon size={48} />
        </div>
      )}
      <div className="absolute top-4 left-4">
        <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-indigo-600 uppercase tracking-widest border border-white/50">
          {item.doc_id}
        </span>
      </div>
    </div>
    
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-3 font-medium">
        <Calendar size={14} />
        <span>{formatDateThai(item.date)}</span>
      </div>
      
      <h3 
        className="font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors cursor-pointer"
        onClick={() => onDetailClick(item)}
      >
        {item.title}
      </h3>
      
      {item.content && (
        <p 
          className="text-slate-500 text-[11px] line-clamp-3 mb-4 leading-relaxed cursor-pointer"
          onClick={() => onDetailClick(item)}
        >
          {item.content}
        </p>
      )}
      
      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 italic">
            โดย: {item.note || 'ไม่ระบุ'}
          </span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleShare(item);
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="แชร์ข่าว"
          >
            <Share2 size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleShowQR(item);
            }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="แสดง QR Code"
          >
            <QrCode size={14} />
          </button>
        </div>
        <button 
          onClick={() => onDetailClick(item)}
          className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  </motion.div>
);

const ImageModal = ({ url, onClose }: { url: string, onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.5, 1));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center overflow-hidden"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-[110]">
        <div className="flex bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/10">
          <button 
            onClick={handleZoomOut}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="ซูมออก"
          >
            <ZoomOut size={20} />
          </button>
          <button 
            onClick={handleReset}
            className="px-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold transition-all"
          >
            {Math.round(scale * 100)}%
          </button>
          <button 
            onClick={handleZoomIn}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="ซูมเข้า"
          >
            <ZoomIn size={20} />
          </button>
        </div>

        <a 
          href={getDriveViewLink(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-white/10 backdrop-blur-md text-white/70 hover:text-white hover:bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-white/10 transition-all"
          title="เปิดใน Google Drive"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={20} />
        </a>

        <a 
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 bg-white/10 backdrop-blur-md text-white/70 hover:text-white hover:bg-white/20 rounded-2xl flex items-center justify-center border border-white/10 transition-all"
          title="ดาวน์โหลดรูปภาพ"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={20} />
        </a>
        
        <button 
          className="w-10 h-10 bg-white/10 backdrop-blur-md text-white/70 hover:text-white hover:bg-red-500/20 rounded-2xl flex items-center justify-center border border-white/10 transition-all"
          onClick={onClose}
        >
          <X size={24} />
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[110] hidden md:block">
        <p className="text-white/40 text-xs font-medium bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
          {scale > 1 ? 'คลิกค้างเพื่อเลื่อนดูภาพ' : 'ใช้ปุ่มด้านบนเพื่อซูมภาพ'}
        </p>
      </div>

      <div className="w-full h-full flex items-center justify-center p-4 md:p-10 overflow-hidden">
        <motion.div
          drag={scale > 1}
          dragConstraints={{ left: -500 * scale, right: 500 * scale, top: -500 * scale, bottom: 500 * scale }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          className="relative"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.img 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: scale, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            src={url} 
            alt="Full size" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

const NewsDetailModal = ({ item, onClose, onImageClick }: { item: NewsItem, onClose: () => void, onImageClick: (url: string) => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div 
      initial={{ y: 50, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 50, opacity: 0, scale: 0.95 }}
      className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative h-64 md:h-80 bg-slate-100 overflow-hidden">
        {item.image_url ? (
          <img 
            src={item.image_url} 
            alt={item.title} 
            className="w-full h-full object-cover cursor-zoom-in"
            onClick={() => onImageClick(item.image_url)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <ImageIcon size={64} />
          </div>
        )}
        <button 
          className="absolute top-6 right-6 w-10 h-10 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/40 transition-colors"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        
        <div className="absolute top-6 left-6 flex gap-2">
          <button 
            onClick={() => handleShare(item)}
            className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-colors border border-white/20 shadow-lg"
            title="แชร์ข่าว"
          >
            <Share2 size={18} />
          </button>
          <button 
            onClick={() => handleShowQR(item)}
            className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-colors border border-white/20 shadow-lg"
            title="แสดง QR Code"
          >
            <QrCode size={18} />
          </button>
        </div>
        <div className="absolute bottom-6 left-6">
          <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
            {item.doc_id}
          </span>
        </div>
      </div>

      <div className="p-8 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
        <div className="flex items-center gap-3 text-slate-400 text-sm mb-4 font-medium">
          <Calendar size={16} />
          <span>{formatDateThai(item.date)}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>โดย: {item.note || 'ไม่ระบุ'}</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 leading-tight">
          {item.title}
        </h2>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
            {item.content}
          </p>
        </div>
      </div>

      <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex justify-end">
        <button 
          onClick={onClose}
          className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-sm"
        >
          ปิดหน้าต่าง
        </button>
      </div>
    </motion.div>
  </motion.div>
);

const UserView = ({ news }: { news: NewsItem[] }) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  const months = [
    { value: '01', label: 'มกราคม' },
    { value: '02', label: 'กุมภาพันธ์' },
    { value: '03', label: 'มีนาคม' },
    { value: '04', label: 'เมษายน' },
    { value: '05', label: 'พฤษภาคม' },
    { value: '06', label: 'มิถุนายน' },
    { value: '07', label: 'กรกฎาคม' },
    { value: '08', label: 'สิงหาคม' },
    { value: '09', label: 'กันยายน' },
    { value: '10', label: 'ตุลาคม' },
    { value: '11', label: 'พฤศจิกายน' },
    { value: '12', label: 'ธันวาคม' },
  ];

  const years = Array.from(new Set(news.map(item => {
    const date = new Date(item.date);
    return date.getFullYear().toString();
  }))).sort((a, b) => b.localeCompare(a));

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                         item.doc_id.toLowerCase().includes(search.toLowerCase());
    
    const itemDate = new Date(item.date);
    const itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');
    const itemYear = itemDate.getFullYear().toString();
    
    const matchesMonth = filterMonth === '' || itemMonth === filterMonth;
    const matchesYear = filterYear === '' || itemYear === filterYear;
    
    return matchesSearch && matchesMonth && matchesYear;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ข่าวประชาสัมพันธ์</h2>
          <p className="text-slate-500 text-sm">ติดตามข่าวสารและกิจกรรมล่าสุด</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              className="input-field py-2 text-sm min-w-[120px]"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">ทุกเดือน</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select 
              className="input-field py-2 text-sm min-w-[100px]"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">ทุกปี</option>
              {years.map(y => <option key={y} value={y}>{parseInt(y) + 543}</option>)}
            </select>
          </div>

          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ค้นหาข่าวสาร..." 
              className="input-field pl-12 py-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}
            >
              <ListIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {filteredNews.length > 0 ? (
        <motion.div 
          layout
          className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "flex flex-col gap-4"
          }
        >
          <AnimatePresence mode="popLayout">
            {filteredNews.map(item => (
              <NewsCard 
                key={item.id} 
                item={item} 
                onImageClick={(url) => setSelectedImage(url)}
                onDetailClick={(item) => setSelectedNews(item)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Search size={64} strokeWidth={1} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">ไม่พบข้อมูลที่ค้นหา</p>
          <button onClick={() => setSearch('')} className="text-indigo-600 text-sm mt-2 hover:underline">ล้างการค้นหา</button>
        </div>
      )}

      <AnimatePresence>
        {selectedNews && (
          <NewsDetailModal 
            item={selectedNews} 
            onClose={() => setSelectedNews(null)} 
            onImageClick={(url) => setSelectedImage(url)}
          />
        )}
        {selectedImage && (
          <ImageModal 
            url={selectedImage} 
            onClose={() => setSelectedImage(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminView = ({ news, onRefresh }: { news: NewsItem[], onRefresh: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [hasGsUrl, setHasGsUrl] = useState<boolean | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialForm = {
    doc_id: '',
    old_doc_id: '',
    date: new Date().toISOString().split('T')[0],
    title: '',
    content: '',
    note: '',
    image: null as { data: string, mimeType: string, name: string } | null,
    image_url: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setHasGsUrl(data.hasGsUrl));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFormData(prev => ({
          ...prev,
          image: {
            data: base64String,
            mimeType: file.type,
            name: file.name
          }
        }));
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.doc_id) return;

    Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      text: 'กรุณารอสักครู่ ระบบกำลังอัปเดตข้อมูลไปยัง Google Sheets',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: { popup: 'rounded-[2rem]' }
    });

    setLoading(true);
    try {
      const url = editingId ? `/api/news/${editingId}` : '/api/news';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setFormData(initialForm);
        setImagePreview(null);
        setEditingId(null);
        onRefresh();
        Swal.fire({
          title: 'สำเร็จ!',
          text: editingId ? 'แก้ไขข้อมูลเรียบร้อยแล้ว' : 'บันทึกข้อมูลข่าวประชาสัมพันธ์เรียบร้อยแล้ว',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-[2rem]' }
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์',
        icon: 'error',
        customClass: { popup: 'rounded-[2rem]' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setFormData({
      doc_id: item.doc_id,
      old_doc_id: item.doc_id,
      date: item.date,
      title: item.title,
      content: item.content || '',
      note: item.note,
      image: null,
      image_url: item.image_url
    });
    setImagePreview(item.image_url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (item: NewsItem) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "คุณต้องการลบข่าวนี้ใช่หรือไม่? ข้อมูลใน Google Sheets จะถูกลบออกไปด้วย",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'กำลังลบข้อมูล...',
        text: 'ระบบกำลังลบข้อมูลออกจาก Google Sheets',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        customClass: { popup: 'rounded-[2rem]' }
      });

      try {
        const res = await fetch(`/api/news/doc/${encodeURIComponent(item.doc_id)}`, { method: 'DELETE' });
        if (res.ok) {
          onRefresh();
          Swal.fire({
            title: 'ลบสำเร็จ!',
            text: 'ข้อมูลถูกลบออกจากระบบเรียบร้อยแล้ว',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            customClass: { popup: 'rounded-[2rem]' }
          });
        } else {
          throw new Error('Delete failed');
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: 'ผิดพลาด',
          text: 'ไม่สามารถลบข้อมูลได้ในขณะนี้',
          icon: 'error',
          customClass: { popup: 'rounded-[2rem]' }
        });
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingId ? 'แก้ไขข่าวประชาสัมพันธ์' : 'เพิ่มข่าวประชาสัมพันธ์'}
              </h2>
              <p className="text-slate-500 text-sm">จัดการข้อมูลข่าวสารของคุณ</p>
              
              {hasGsUrl === false && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-sm">
                  <div className="mt-0.5"><ExternalLink size={16} /></div>
                  <div>
                    <p className="font-bold">ยังไม่ได้เชื่อมต่อ Google Sheet</p>
                    <p className="opacity-80 text-xs">ข้อมูลจะบันทึกเฉพาะในระบบจำลอง</p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="glass p-6 rounded-[2rem] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">เลขที่</label>
                  <input 
                    required
                    type="text" 
                    placeholder="1/2569" 
                    className="input-field py-2 text-sm"
                    value={formData.doc_id}
                    onChange={e => setFormData({...formData, doc_id: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1 uppercase">วันที่</label>
                  <input 
                    required
                    type="date" 
                    className="input-field py-2 text-sm"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">เรื่อง/กิจกรรม</label>
                <input 
                  required
                  type="text" 
                  placeholder="ระบุหัวข้อข่าว" 
                  className="input-field py-2 text-sm"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">เนื้อข่าว</label>
                <textarea 
                  rows={3}
                  placeholder="ระบุรายละเอียดเนื้อข่าว" 
                  className="input-field py-2 text-sm resize-none"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">หมายเหตุ/ผู้รายงาน</label>
                <input 
                  type="text" 
                  placeholder="ชื่อผู้ลงข้อมูล" 
                  className="input-field py-2 text-sm"
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase">รูปภาพ</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                >
                  {imagePreview ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setFormData({...formData, image: null, image_url: ''});
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <ImageIcon size={24} className="mx-auto mb-2 text-slate-300 group-hover:text-indigo-500" />
                      <p className="text-slate-500 text-xs font-medium">เลือกรูปภาพ</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingId && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData(initialForm);
                      setImagePreview(null);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                  >
                    ยกเลิก
                  </button>
                )}
                <button 
                  disabled={loading}
                  type="submit" 
                  className={`flex-[2] btn-primary justify-center py-3 text-sm ${editingId ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : ''}`}
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (editingId ? <ShieldCheck size={18} /> : <Plus size={18} />)}
                  <span>{editingId ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-800">รายการข่าวทั้งหมด</h3>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                {news.length} รายการ
              </span>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="แสดงแบบรายการ"
              >
                <ListIcon size={16} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="แสดงแบบตาราง"
              >
                <Table size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {viewMode === 'list' ? (
                news.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-slate-100 p-4 rounded-2xl flex gap-4 hover:shadow-md transition-all group"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <ImageIcon size={24} />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                          {item.doc_id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatDateThai(item.date)}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1">{item.title}</h4>
                      {item.content && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-1 leading-relaxed">
                          {item.content}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 line-clamp-1 italic">โดย: {item.note || '-'}</p>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <FileText size={12} />
                          แก้ไข
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Trash2 size={12} />
                          ลบ
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-bottom border-slate-100">
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">เลขที่</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">วันที่</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">เรื่อง/กิจกรรม</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {news.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                                {item.doc_id}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                              {formatDateThai(item.date)}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-[12px] font-bold text-slate-700 line-clamp-1">{item.title}</p>
                              <p className="text-[10px] text-slate-400 italic">โดย: {item.note || '-'}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => handleEdit(item)}
                                  className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="แก้ไข"
                                >
                                  <FileText size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDelete(item)}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="ลบ"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {news.length === 0 && (
              <div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">ยังไม่มีข้อมูลข่าวสาร</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ onLoginSuccess }: { onLoginSuccess: (user: UserAccount) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onLoginSuccess(data.user);
        Swal.fire({
          title: 'ยินดีต้อนรับ!',
          text: `สวัสดีคุณ ${data.user.name}`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-[2rem]' }
        });
      } else {
        Swal.fire({
          title: 'ผิดพลาด',
          text: data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
          icon: 'error',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-[2rem]' }
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'ผิดพลาด',
        text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        icon: 'error',
        confirmButtonColor: '#4f46e5',
        customClass: { popup: 'rounded-[2rem]' }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-[2.5rem] text-center"
      >
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">เข้าสู่ระบบแอดมิน</h2>
        <p className="text-slate-500 text-sm mb-8">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล</p>

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">ชื่อผู้ใช้</label>
            <input 
              required
              type="text" 
              className="input-field"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">รหัสผ่าน</label>
            <input 
              required
              type="password" 
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="btn-primary w-full justify-center py-4 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            <span>เข้าสู่ระบบ</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState('user');
  const [user, setUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('pr_news_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleLoginSuccess = (userData: UserAccount) => {
    setUser(userData);
    localStorage.setItem('pr_news_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pr_news_user');
    setActiveView('user');
  };

  return (
    <div className="min-h-screen pb-20">
      <Navbar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        user={user}
        onLogout={handleLogout}
      />
      
      <main>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={40} />
            <p className="font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeView === 'user' ? (
              <motion.div
                key="user"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <UserView news={news} />
              </motion.div>
            ) : (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {user ? (
                  <AdminView news={news} onRefresh={fetchNews} />
                ) : (
                  <LoginView onLoginSuccess={handleLoginSuccess} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Floating Action Button for Mobile (Admin Shortcut) */}
      {activeView === 'user' && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveView('admin')}
          className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-300 flex items-center justify-center z-40 md:hidden"
        >
          <Plus size={24} />
        </motion.button>
      )}
    </div>
  );
}
