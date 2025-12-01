<change>
    <file>App.tsx</file>
    <description>Fetch employees on mount and add fallback admin user for initial login</description>
    <content><![CDATA[import React, { useState, useEffect } from 'react';
import { Plus, Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ResidentsPage } from './components/ResidentsPage';
import { PackagesPage } from './components/PackagesPage';
import { CompaniesPage } from './components/CompaniesPage';
import { EmployeesPage } from './components/EmployeesPage';
import { OccurrencesPage } from './components/OccurrencesPage';
import { ReceivedItemsPage } from './components/ReceivedItemsPage';
import { MaterialsPage } from './components/MaterialsPage';
import { VisitorsPage } from './components/VisitorsPage';
import { TimeSheetPage } from './components/TimeSheetPage';
import { DeliveryDriversPage } from './components/DeliveryDriversPage';
import { DeliveryVisitsPage } from './components/DeliveryVisitsPage';
import { FloatingNotepad } from './components/FloatingNotepad';
import { LoginScreen } from './components/LoginScreen';
import { ConfirmLogoutModal } from './components/ConfirmLogoutModal';
import { 
  MENU_ITEMS, 
  CURRENT_USER, 
  MOCK_RECEIVED_ITEMS, 
  MOCK_BORROWED_MATERIALS, 
  MOCK_VISITORS, 
  MOCK_TIME_RECORDS, 
  MOCK_DELIVERY_DRIVERS, 
  MOCK_DELIVERY_VISITS 
} from './constants';
import { 
  Resident, 
  PackageItem, 
  Company, 
  Employee, 
  Occurrence, 
  ReceivedItem, 
  BorrowedMaterial, 
  Visitor, 
  TimeRecord, 
  DeliveryDriver, 
  DeliveryVisit, 
  UserProfile 
} from './types';
import { supabase } from './src/lib/supabase';

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // App State
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- REAL DATA FROM SUPABASE ---
  const [residents, setResidents] = useState<Resident[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  
  // Loading States
  const [loadingResidents, setLoadingResidents] = useState(false);

  // Mock Data for other pages (To be migrated later)
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>(MOCK_RECEIVED_ITEMS);
  const [materials, setMaterials] = useState<BorrowedMaterial[]>(MOCK_BORROWED_MATERIALS);
  const [visitors, setVisitors] = useState<Visitor[]>(MOCK_VISITORS);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(MOCK_TIME_RECORDS);
  const [deliveryDrivers, setDeliveryDrivers] = useState<DeliveryDriver[]>(MOCK_DELIVERY_DRIVERS);
  const [deliveryVisits, setDeliveryVisits] = useState<DeliveryVisit[]>(MOCK_DELIVERY_VISITS);

  // Global Notepad State
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [isNotepadMinimized, setIsNotepadMinimized] = useState(false);

  // --- SUPABASE FETCHING FUNCTIONS ---
  
  const fetchResidents = async () => {
    setLoadingResidents(true);
    const { data, error } = await supabase.from('residents').select('*').order('name');
    if (error) console.error('Erro ao buscar moradores:', error);
    else setResidents(data || []);
    setLoadingResidents(false);
  };

  const fetchPackages = async () => {
    // Orders by creation descending
    const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false });
    if (error) console.error('Erro ao buscar encomendas:', error);
    else setPackages(data || []);
  };

  const fetchCompanies = async () => {
    const { data, error } = await supabase.from('companies').select('*').order('name');
    if (error) console.error('Erro ao buscar empresas:', error);
    else setCompanies(data || []);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*').order('name');
    if (error) {
      console.error('Erro ao buscar funcionários:', error);
    } else {
      // If database is empty, provide a fallback admin user so the system is usable
      if (!data || data.length === 0) {
        const fallbackAdmin: Employee = {
          id: 'temp-admin',
          name: 'Administrador (Acesso Inicial)',
          cpf: '000.000.000-00',
          role: 'Administrador',
          shift: 'administrativo',
          status: 'ativo',
          entryTime: '00:00',
          exitTime: '23:59',
          phone: '',
          email: 'admin@sistema.com',
          admissionDate: new Date().toLocaleDateString('pt-BR'),
          observations: 'Usuário temporário gerado automaticamente. Cadastre funcionários reais.'
        };
        setEmployees([fallbackAdmin]);
      } else {
        setEmployees(data);
      }
    }
  };

  const fetchOccurrences = async () => {
    const { data, error } = await supabase.from('occurrences').select('*').order('created_at', { ascending: false });
    if (error) console.error('Erro ao buscar ocorrências:', error);
    else setOccurrences(data || []);
  };

  // Fetch Employees on Mount (Critical for Login Screen)
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch Protected Data when Authenticated
  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        fetchResidents(),
        fetchPackages(),
        fetchCompanies(),
        // fetchEmployees is already called on mount
        fetchOccurrences()
      ]);
    }
  }, [isAuthenticated]);

  // --- ACTIONS: RESIDENTS ---
  const handleSaveResident = async (data: Partial<Resident>) => {
    const payload = {
      name: data.name,
      unit: data.unit,
      block: data.block,
      type: data.type,
      status: data.status,
      phone: data.phone,
      cpf: data.cpf,
      email: data.email,
      observations: data.observations
    };

    if (data.id) {
      const { error } = await supabase.from('residents').update(payload).eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('residents').insert([payload]);
      if (error) throw error;
    }
    await fetchResidents();
  };

  const handleDeleteResident = async (id: string) => {
    const { error } = await supabase.from('residents').delete().eq('id', id);
    if (error) throw error;
    await fetchResidents();
  };

  // --- ACTIONS: PACKAGES ---
  const handleSavePackage = async (data: Partial<PackageItem>) => {
    const payload = {
      unit: data.unit,
      block: data.block,
      recipientName: data.recipientName,
      type: data.type,
      sender: data.sender,
      trackingCode: data.trackingCode,
      withdrawalCode: data.withdrawalCode,
      receivedAt: data.receivedAt,
      status: data.status,
      description: data.description,
      observations: data.observations
    };

    if (data.id) {
      const { error } = await supabase.from('packages').update(payload).eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('packages').insert([payload]);
      if (error) throw error;
    }
    await fetchPackages();
  };

  const handlePickupPackage = async (id: string, name: string) => {
    const now = new Date();
    const timestamp = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear().toString().slice(-2)} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { error } = await supabase
      .from('packages')
      .update({ 
        status: 'Retirada', 
        pickedUpBy: name, 
        pickedUpAt: timestamp 
      })
      .eq('id', id);
    
    if (error) throw error;
    await fetchPackages();
  };

  const handleDeletePackage = async (id: string) => {
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) throw error;
    await fetchPackages();
  };

  // --- ACTIONS: COMPANIES ---
  const handleSaveCompany = async (data: Partial<Company>) => {
    const payload = {
      name: data.name,
      type: data.type,
      phone: data.phone,
      status: data.status,
      observations: data.observations
    };

    if (data.id) {
      const { error } = await supabase.from('companies').update(payload).eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('companies').insert([payload]);
      if (error) throw error;
    }
    await fetchCompanies();
  };

  const handleDeleteCompany = async (id: string) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
    await fetchCompanies();
  };

  // --- ACTIONS: EMPLOYEES ---
  const handleSaveEmployee = async (data: Partial<Employee>) => {
    const payload = {
      name: data.name,
      cpf: data.cpf,
      role: data.role,
      shift: data.shift,
      status: data.status,
      entryTime: data.entryTime,
      exitTime: data.exitTime,
      phone: data.phone,
      email: data.email,
      admissionDate: data.admissionDate,
      photoUrl: data.photoUrl,
      observations: data.observations
    };

    if (data.id) {
      const { error } = await supabase.from('employees').update(payload).eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('employees').insert([payload]);
      if (error) throw error;
    }
    await fetchEmployees();
  };

  const handleDeleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    await fetchEmployees();
  };

  // --- ACTIONS: OCCURRENCES ---
  const handleSaveOccurrence = async (data: Partial<Occurrence>) => {
    const payload = {
      outgoingEmployeeName: data.outgoingEmployeeName,
      incomingEmployeeName: data.incomingEmployeeName,
      description: data.description,
      timestamp: data.timestamp
    };

    if (data.id) {
      const { error } = await supabase.from('occurrences').update(payload).eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('occurrences').insert([payload]);
      if (error) throw error;
    }
    await fetchOccurrences();
  };

  const handleDeleteOccurrence = async (id: string) => {
    const { error } = await supabase.from('occurrences').delete().eq('id', id);
    if (error) throw error;
    await fetchOccurrences();
  };

  // Auth Handlers
  const handleLogin = (employeeName: string) => {
    setCurrentUser({
      name: employeeName,
      role: 'OPERADOR'
    });
    setIsAuthenticated(true);
  };

  const handleLogoutRequest = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsAuthenticated(false);
    setIsLogoutModalOpen(false);
    setIsSidebarOpen(false);
    setActivePage('dashboard');
  };

  // Handle saving occurrence from global notepad
  const handleNotepadSave = async (data: Omit<Occurrence, 'id' | 'timestamp'>) => {
    const now = new Date();
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const timestamp = `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()} às ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    await handleSaveOccurrence({ ...data, timestamp });
    setActivePage('ocorrencias');
  };

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <LoginScreen 
        employees={employees} 
        onLogin={handleLogin} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg-app font-sans text-slate-800">
      
      {/* Menu Toggle Button - Always visible when sidebar is closed */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-20 p-2 bg-white rounded-lg shadow-md border border-gray-200 text-slate-600 hover:text-primary hover:border-primary transition-all no-print"
          title="Abrir Menu"
        >
          <Menu size={24} />
        </button>
      )}

      <Sidebar 
        items={MENU_ITEMS} 
        user={currentUser} 
        activePage={activePage}
        onNavigate={setActivePage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogoutRequest}
      />

      {/* Main Content */}
      <main className="w-full px-4 pb-4 md:px-8 md:pb-8 pt-32 min-h-screen transition-all duration-300">
        {activePage === 'dashboard' ? (
          <Dashboard 
            packages={packages}
            occurrences={occurrences}
            employees={employees}
          />
        ) : activePage === 'moradores' ? (
          <ResidentsPage 
            residents={residents}
            onSave={handleSaveResident}
            onDelete={handleDeleteResident}
            isLoading={loadingResidents}
          />
        ) : activePage === 'encomendas' ? (
          <PackagesPage 
            residents={residents}
            packages={packages}
            companies={companies}
            onSave={handleSavePackage}
            onDelete={handleDeletePackage}
            onPickup={handlePickupPackage}
          />
        ) : activePage === 'recebidos' ? (
          <ReceivedItemsPage 
            items={receivedItems}
            setItems={setReceivedItems}
            residents={residents}
          />
        ) : activePage === 'materiais' ? (
          <MaterialsPage 
            materials={materials}
            setMaterials={setMaterials}
            residents={residents}
          />
        ) : activePage === 'visitantes' ? (
          <VisitorsPage 
            visitors={visitors}
            setVisitors={setVisitors}
            residents={residents}
          />
        ) : activePage === 'ponto' ? (
          <TimeSheetPage 
            records={timeRecords}
            setRecords={setTimeRecords}
            employees={employees}
          />
        ) : activePage === 'empresas' ? (
          <CompaniesPage 
            companies={companies}
            onSave={handleSaveCompany}
            onDelete={handleDeleteCompany}
          />
        ) : activePage === 'entregadores' ? (
          <DeliveryDriversPage 
            drivers={deliveryDrivers}
            setDrivers={setDeliveryDrivers}
            companies={companies}
          />
        ) : activePage === 'visitas' ? (
          <DeliveryVisitsPage
            visits={deliveryVisits}
            setVisits={setDeliveryVisits}
            drivers={deliveryDrivers}
          />
        ) : activePage === 'funcionarios' ? (
          <EmployeesPage 
            employees={employees}
            onSave={handleSaveEmployee}
            onDelete={handleDeleteEmployee}
          />
        ) : activePage === 'ocorrencias' ? (
          <OccurrencesPage 
            occurrences={occurrences}
            employees={employees}
            onSave={handleSaveOccurrence}
            onDelete={handleDeleteOccurrence}
            onOpenNotepad={() => {
              setIsNotepadOpen(true);
              setIsNotepadMinimized(false);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 animate-in fade-in duration-300">
            <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Plus size={24} />
            </div>
            <p className="text-lg font-medium">Página em construção</p>
            <p className="text-sm">Selecione uma opção no menu.</p>
          </div>
        )}
      </main>

      {/* Persistent Floating Notepad */}
      <FloatingNotepad 
        isOpen={isNotepadOpen}
        isMinimized={isNotepadMinimized}
        onClose={() => setIsNotepadOpen(false)}
        onMinimize={() => setIsNotepadMinimized(true)}
        onMaximize={() => setIsNotepadMinimized(false)}
        onSave={handleNotepadSave}
        employees={employees}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmLogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
};

export default App;]]></content>
</change>
