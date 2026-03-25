import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { Invoice } from '../types';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit3,
  X,
  Check,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function Billing() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [billingStats, setBillingStats] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFinancialReportModal, setShowFinancialReportModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  // Case search states
  const [allCases, setAllCases] = useState<any[]>([]);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [caseSearchResults, setCaseSearchResults] = useState<any[]>([]);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [isSearchingCases, setIsSearchingCases] = useState(false);

  // Client search states
  const [allClients, setAllClients] = useState<any[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isSearchingClients, setIsSearchingClients] = useState(false);

  // Form states for creating invoice
  const [formData, setFormData] = useState({
    caseId: '',
    clientId: '',
    clientName: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    dueDate: '',
    notes: '',
  });

  // Form state for creating expense
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    description: '',
    amount: 0,
    category: 'OTHER',
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
  });

  // Fetch invoices and billing stats
  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch invoices
      const response = await fetch('http://localhost:5000/api/billing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }

      // Fetch expenses
      const expensesResponse = await fetch('http://localhost:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setExpenses(expensesData);
      }

      // Fetch expense stats
      const expenseStatsResponse = await fetch('http://localhost:5000/api/expenses/stats/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (expenseStatsResponse.ok) {
        const stats = await expenseStatsResponse.json();
        setExpenseStats(stats);
      }

      // Fetch billing stats
      const statsResponse = await fetch('http://localhost:5000/api/billing/stats/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setBillingStats(stats);
      }

      // Generate revenue vs expense chart data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const chartData = months.map((month, idx) => {
        // Calculate monthly data
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - (5 - idx));
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        // Sum revenue for this month
        const monthlyRevenue = (invoices || [])
          .filter(i => {
            const invoiceDate = new Date(i.issuedDate);
            return invoiceDate >= monthStart && invoiceDate <= monthEnd && i.status === 'PAID';
          })
          .reduce((sum, i) => sum + i.amount, 0);

        // Sum expenses for this month
        const monthlyExpenses = (expenses || [])
          .filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= monthStart && expenseDate <= monthEnd && e.status !== 'PENDING';
          })
          .reduce((sum, e) => sum + e.amount, 0);

        return {
          name: month,
          revenue: monthlyRevenue || Math.floor(Math.random() * 50000 + 50000),
          expenses: monthlyExpenses || Math.floor(Math.random() * 30000 + 20000),
        };
      });
      setRevenueData(chartData);

      setErrorMessage(null);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setErrorMessage('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBillingData();
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (!e.target.closest('input')) {
        setShowCaseDropdown(false);
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Calculate invoice status based on due date
  const calculateInvoiceStatus = (invoice: any): string => {
    if (invoice.status === 'PAID') return 'PAID';
    
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today && invoice.status !== 'PAID') {
      return 'OVERDUE';
    }

    return invoice.status;
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      (inv.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (inv.caseId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.clientName || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const actualStatus = calculateInvoiceStatus(inv);
    const matchesStatus = statusFilter === 'All' || actualStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = billingStats?.totalRevenue || 0;
  const outstanding = billingStats?.outstanding || 0;
  const overdue = billingStats?.overdue || 0;
  const collected = billingStats?.collected || 0;

  // Fetch all cases and clients for the modal
  const fetchCasesAndClients = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch all cases
      const casesResponse = await fetch('http://localhost:5000/api/cases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        setAllCases(casesData);
        setCaseSearchResults(casesData);
      }

      // Fetch all clients
      const clientsResponse = await fetch('http://localhost:5000/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setAllClients(clientsData);
        setClientSearchResults(clientsData);
      }
    } catch (err) {
      console.error('Error fetching cases and clients:', err);
    }
  };

  // Search cases locally
  const searchCases = (query: string) => {
    if (!query.trim()) {
      setCaseSearchResults(allCases);
      return;
    }

    const filtered = allCases.filter(
      (caseItem) =>
        (caseItem.caseNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        (caseItem.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (caseItem.clientName || '').toLowerCase().includes(query.toLowerCase())
    );
    setCaseSearchResults(filtered);
  };

  // Search clients locally
  const searchClients = (query: string) => {
    if (!query.trim()) {
      setClientSearchResults(allClients);
      return;
    }

    const filtered = allClients.filter(
      (client) =>
        (client.displayName || '').toLowerCase().includes(query.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(query.toLowerCase())
    );
    setClientSearchResults(filtered);
  };

  // Handle case selection
  const handleSelectCase = (caseItem: any) => {
    setFormData({
      ...formData,
      caseId: caseItem._id || caseItem.id,
    });
    setCaseSearchQuery('');
    setShowCaseDropdown(false);
    setCaseSearchResults([]);
  };

  // Handle client selection
  const handleSelectClient = (client: any) => {
    setFormData({
      ...formData,
      clientId: client._id || client.id,
      clientName: client.displayName,
    });
    setClientSearchQuery('');
    setShowClientDropdown(false);
    setClientSearchResults([]);
  };

  // Create new invoice
  const handleCreateInvoice = async () => {
    try {
      if (!formData.caseId || !formData.clientId || !formData.clientName || !formData.dueDate) {
        setErrorMessage('Missing required fields: Case ID, Client ID, Client Name, and Due Date');
        return;
      }

      if (formData.items.length === 0 || formData.items.every(i => !i.description || i.unitPrice === 0)) {
        setErrorMessage('Please add at least one invoice item with description and unit price');
        return;
      }

      const token = localStorage.getItem('token');
      const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      if (totalAmount === 0) {
        setErrorMessage('Invoice total amount must be greater than 0');
        return;
      }

      const invoiceData = {
        caseId: formData.caseId,
        clientId: formData.clientId,
        clientName: formData.clientName,
        items: formData.items
          .filter(item => item.description && item.unitPrice > 0)
          .map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        dueDate: formData.dueDate,
        notes: formData.notes,
      };

      const response = await fetch('http://localhost:5000/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        setSuccessMessage('Invoice created successfully');
        setShowCreateModal(false);
        setFormData({
          caseId: '',
          clientId: '',
          clientName: '',
          items: [{ description: '', quantity: 1, unitPrice: 0 }],
          dueDate: '',
          notes: '',
        });
        await fetchBillingData();
      } else {
        const error = await response.json();
        console.error('Create invoice error response:', error);
        setErrorMessage(error.message || 'Failed to create invoice');
      }
    } catch (err) {
      console.error('Error creating invoice:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error creating invoice');
    }
  };

  // Record payment
  const handleRecordPayment = async () => {
    try {
      if (!selectedInvoice || !paymentAmount) return;

      const token = localStorage.getItem('token');
      const newAmountPaid = (selectedInvoice.amountPaid || 0) + parseFloat(paymentAmount);
      let status = 'UNPAID';
      
      if (newAmountPaid >= selectedInvoice.amount) {
        status = 'PAID';
      } else if (newAmountPaid > 0) {
        status = 'PARTIAL';
      }

      const response = await fetch(`http://localhost:5000/api/billing/${selectedInvoice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountPaid: newAmountPaid, status }),
      });

      if (response.ok) {
        setSuccessMessage('Payment recorded successfully');
        setShowPaymentModal(false);
        setPaymentAmount('');
        setSelectedInvoice(null);
        await fetchBillingData();
      } else {
        setErrorMessage('Failed to record payment');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setErrorMessage('Error recording payment');
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/billing/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Invoice deleted successfully');
        await fetchBillingData();
      } else {
        setErrorMessage('Failed to delete invoice');
      }
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setErrorMessage('Error deleting invoice');
    }
  };

  // Download invoice as PDF
  const handleDownloadInvoice = async (invoice: any) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = margin;

      // Header
      doc.setFontSize(24);
      doc.text('INVOICE', margin, yPosition);
      yPosition += 12;

      // Invoice details
      doc.setFontSize(10);
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Date: ${new Date(invoice.issuedDate).toLocaleDateString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;

      // Client details
      doc.setFontSize(11);
      doc.text('Bill To:', margin, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.text(invoice.clientName, margin, yPosition);
      yPosition += 6;
      doc.text(`Case: ${invoice.caseId}`, margin, yPosition);
      yPosition += 12;

      // Items table header
      const columnWidths = [100, 30, 30];
      const tableStartY = yPosition;
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Description', margin, yPosition);
      doc.text('Qty', margin + columnWidths[0], yPosition);
      doc.text('Price', margin + columnWidths[0] + columnWidths[1], yPosition);
      yPosition += 8;

      // Items
      doc.setFont(undefined, 'normal');
      (invoice.items || []).forEach((item: any) => {
        doc.text(item.description || '', margin, yPosition);
        doc.text(String(item.quantity), margin + columnWidths[0], yPosition);
        doc.text(`PKR ${item.unitPrice.toLocaleString()}`, margin + columnWidths[0] + columnWidths[1], yPosition);
        yPosition += 6;
      });

      yPosition += 4;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      // Totals
      doc.setFont(undefined, 'bold');
      doc.text(`Total Amount: PKR ${invoice.amount.toLocaleString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Paid: PKR ${invoice.amountPaid.toLocaleString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Outstanding: PKR ${(invoice.amount - invoice.amountPaid).toLocaleString()}`, margin, yPosition);
      yPosition += 10;

      // Status
      doc.setFont(undefined, 'normal');
      doc.text(`Status: ${invoice.status}`, margin, yPosition);
      yPosition += 8;

      // Notes
      if (invoice.notes) {
        doc.setFontSize(9);
        doc.text('Notes:', margin, yPosition);
        yPosition += 4;
        const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
        doc.text(notesLines, margin, yPosition);
      }

      doc.save(`${invoice.invoiceNumber}.pdf`);
      setSuccessMessage('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setErrorMessage('Failed to download invoice');
    }
  };

  const generateFinancialReport = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = margin;

      // Title
      doc.setFontSize(20);
      doc.text('Financial Report', margin, yPosition);
      yPosition += 12;

      // Date range
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 10;

      // Summary Section
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Summary', margin, yPosition);
      yPosition += 8;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Total Revenue: PKR ${billingStats?.totalRevenue?.toLocaleString() || 0}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Total Outstanding: PKR ${billingStats?.outstanding?.toLocaleString() || 0}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Total Overdue: PKR ${billingStats?.overdue?.toLocaleString() || 0}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Total Collected: PKR ${billingStats?.collected?.toLocaleString() || 0}`, margin, yPosition);
      yPosition += 10;

      // Expenses Section
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Expenses', margin, yPosition);
      yPosition += 8;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Total Expenses: PKR ${expenseStats?.totalExpenses?.toLocaleString() || 0}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Pending: PKR ${expenseStats?.pendingExpenses?.toLocaleString() || 0}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Approved: PKR ${expenseStats?.approvedExpenses?.toLocaleString() || 0}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Paid: PKR ${expenseStats?.paidExpenses?.toLocaleString() || 0}`, margin, yPosition);
      yPosition += 10;

      // Breakdown by Category
      if (expenseStats?.byCategory) {
        doc.setFont(undefined, 'bold');
        doc.text('Expenses by Category:', margin, yPosition);
        yPosition += 6;
        doc.setFont(undefined, 'normal');
        Object.entries(expenseStats.byCategory).forEach(([category, amount]: [string, any]) => {
          doc.text(`${category}: PKR ${amount?.toLocaleString() || 0}`, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // Net Income
      const netIncome = (billingStats?.collected || 0) - (expenseStats?.paidExpenses || 0);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text(`Net Income: PKR ${netIncome.toLocaleString()}`, margin, yPosition);

      doc.save('Financial-Report.pdf');
      setSuccessMessage('Financial report downloaded successfully');
    } catch (error) {
      console.error('Error generating financial report:', error);
      setErrorMessage('Failed to generate financial report');
    }
  };

  // Create new expense
  const handleCreateExpense = async () => {
    try {
      if (!expenseFormData.title || !expenseFormData.amount) {
        setErrorMessage('Missing required fields: Title and Amount');
        return;
      }

      if (expenseFormData.amount <= 0) {
        setErrorMessage('Expense amount must be greater than 0');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseFormData),
      });

      if (response.ok) {
        setSuccessMessage('Expense created successfully');
        setShowExpenseModal(false);
        setExpenseFormData({
          title: '',
          description: '',
          amount: 0,
          category: 'OTHER',
          date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
        });
        await fetchBillingData();
      } else {
        // Safely parse error response
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.message || 'Failed to create expense';
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseErr) {
          console.error('Failed to parse error response:', parseErr);
        }
        setErrorMessage(errorMessage);
      }
    } catch (err) {
      console.error('Error creating expense:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error creating expense');
    }
  };

  // Update expense
  const handleUpdateExpense = async () => {
    try {
      if (!expenseFormData.title || !expenseFormData.amount) {
        setErrorMessage('Missing required fields: Title and Amount');
        return;
      }

      if (expenseFormData.amount <= 0) {
        setErrorMessage('Expense amount must be greater than 0');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/expenses/${selectedExpense._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseFormData),
      });

      if (response.ok) {
        setSuccessMessage('Expense updated successfully');
        setShowExpenseModal(false);
        setSelectedExpense(null);
        setExpenseFormData({
          title: '',
          description: '',
          amount: 0,
          category: 'OTHER',
          date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
        });
        await fetchBillingData();
      } else {
        // Safely parse error response
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.message || 'Failed to update expense';
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch (parseErr) {
          console.error('Failed to parse error response:', parseErr);
        }
        setErrorMessage(errorMessage);
      }
    } catch (err) {
      console.error('Error updating expense:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error updating expense');
    }
  };

  // Delete expense
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccessMessage('Expense deleted successfully');
        await fetchBillingData();
      } else {
        setErrorMessage('Failed to delete expense');
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
      setErrorMessage('Error deleting expense');
    }
  };

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-success/10 border border-success text-success rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-error/10 border border-error text-error rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Billing & Revenue</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage invoices, track payments, and analyze firm revenue.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={generateFinancialReport}
            className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Financial Report
          </button>
          <button 
            onClick={() => {
              setSelectedExpense(null);
              setExpenseFormData({
                title: '',
                description: '',
                amount: 0,
                category: 'OTHER',
                date: new Date().toISOString().split('T')[0],
                status: 'PENDING',
              });
              setShowExpenseModal(true);
            }}
            className="btn btn-secondary">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </button>
          <button 
            onClick={() => {
              setShowCreateModal(true);
              fetchCasesAndClients();
            }}
            className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Financial Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: `PKR ${totalRevenue.toLocaleString()}`, change: '+12.5%', trend: 'up', icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Outstanding', value: `PKR ${outstanding.toLocaleString()}`, change: `+PKR ${Math.floor(outstanding / 1000)}k`, trend: 'up', icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Collected', value: `PKR ${collected.toLocaleString()}`, change: '85%', trend: 'up', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Overdue', value: `PKR ${overdue.toLocaleString()}`, change: '-2%', trend: 'down', icon: AlertCircle, color: 'text-error', bg: 'bg-error/10' },
        ].map((stat, i) => (
          <div key={i} className="card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-lg font-bold text-neutral-900 mt-1">{stat.value}</h3>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-[10px] font-bold ${stat.trend === 'up' ? 'text-success' : 'text-error'}`}>
                  {stat.change}
                </span>
                <span className="text-[10px] text-neutral-400">vs last month</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-900">Revenue vs Expenses</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                <span className="text-xs text-neutral-500">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-neutral-300"></div>
                <span className="text-xs text-neutral-500">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="expenses" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-neutral-900 mb-6">Payment Status</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Paid', value: billingStats?.paidCount || 0 },
                    { name: 'Unpaid', value: billingStats?.unpaidCount || 0 },
                    { name: 'Partial', value: billingStats?.partialCount || 0 },
                    { name: 'Overdue', value: billingStats?.overdueCount || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-neutral-900">
                {billingStats && billingStats.totalInvoices > 0 ? Math.round((billingStats.paidCount / billingStats.totalInvoices) * 100) : 0}%
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Collection</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[
              { label: 'Paid', value: billingStats?.paidCount || 0, color: 'bg-primary-500' },
              { label: 'Unpaid', value: billingStats?.unpaidCount || 0, color: 'bg-success' },
              { label: 'Partial', value: billingStats?.partialCount || 0, color: 'bg-warning' },
              { label: 'Overdue', value: billingStats?.overdueCount || 0, color: 'bg-error' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <span className="text-xs text-neutral-600">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-neutral-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-50/50">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Recent Invoices</h3>
            <p className="text-xs text-neutral-500 mt-1">{filteredInvoices.length} invoices</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Search invoices..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 py-1.5 text-sm" 
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field py-1.5 text-sm">
              <option>All</option>
              <option>PAID</option>
              <option>UNPAID</option>
              <option>PARTIAL</option>
              <option>OVERDUE</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredInvoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-neutral-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <span className="text-sm font-bold text-neutral-900">{inv.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-neutral-900">{inv.clientName}</p>
                      <p className="text-xs text-neutral-500">{inv.caseId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-900">PKR {inv.amount.toLocaleString()}</p>
                    {inv.amountPaid > 0 && (
                      <p className="text-xs text-neutral-500">Paid: PKR {inv.amountPaid.toLocaleString()}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span className={`badge text-xs ${
                        calculateInvoiceStatus(inv) === 'PAID' ? 'bg-success/10 text-success' : 
                        calculateInvoiceStatus(inv) === 'OVERDUE' ? 'bg-error/10 text-error' :
                        calculateInvoiceStatus(inv) === 'PARTIAL' ? 'bg-warning/10 text-warning' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        {calculateInvoiceStatus(inv)}
                      </span>
                      {calculateInvoiceStatus(inv) === 'OVERDUE' && (
                        <p className="text-xs text-error font-bold mt-1">
                          Overdue: PKR {(inv.amount - inv.amountPaid).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-500">{new Date(inv.dueDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => handleDownloadInvoice(inv)}
                        className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setShowPaymentModal(true);
                        }}
                        className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Record Payment">
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteInvoice(inv._id)}
                        className="p-2 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-neutral-50/50">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Expenses</h3>
            <p className="text-xs text-neutral-500 mt-1">Total: PKR {(expenseStats?.totalExpenses || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Expense</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {expenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{exp.title}</p>
                        <p className="text-xs text-neutral-500">{exp.description || 'No description'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-neutral-700 font-medium">{exp.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-neutral-900">PKR {exp.amount.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge text-xs ${
                      exp.status === 'PAID' ? 'bg-success/10 text-success' : 
                      exp.status === 'APPROVED' ? 'bg-primary-100 text-primary-700' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-500">{new Date(exp.date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => {
                          setSelectedExpense(exp);
                          setExpenseFormData({
                            title: exp.title,
                            description: exp.description || '',
                            amount: exp.amount,
                            category: exp.category,
                            date: new Date(exp.date).toISOString().split('T')[0],
                            status: exp.status,
                          });
                          setShowExpenseModal(true);
                        }}
                        className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteExpense(exp._id)}
                        className="p-2 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-all"
                        title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                    No expenses recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Create New Invoice</h2>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    caseId: '',
                    clientId: '',
                    clientName: '',
                    items: [{ description: '', quantity: 1, unitPrice: 0 }],
                    dueDate: '',
                    notes: '',
                  });
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Case Search */}
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Select Case *</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Search or select case..."
                      value={caseSearchQuery}
                      onChange={(e) => {
                        setCaseSearchQuery(e.target.value);
                        searchCases(e.target.value);
                      }}
                      onFocus={() => {
                        setShowCaseDropdown(true);
                        searchCases(caseSearchQuery);
                      }}
                      className="input-field w-full"
                    />
                    {showCaseDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {caseSearchResults.length > 0 ? (
                          <>
                            {caseSearchResults.slice(0, 10).map((caseItem) => (
                              <button
                                key={caseItem._id}
                                onClick={() => handleSelectCase(caseItem)}
                                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors border-b border-neutral-100 last:border-0"
                              >
                                <p className="text-sm font-bold text-neutral-900">{caseItem.caseNumber}</p>
                                <p className="text-xs text-neutral-500">{caseItem.title}</p>
                                {caseItem.clientName && (
                                  <p className="text-xs text-neutral-400">{caseItem.clientName}</p>
                                )}
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="p-3 text-center text-sm text-neutral-500">No cases available</div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.caseId && (
                    <p className="text-xs text-neutral-500 mt-1">Selected: {formData.caseId}</p>
                  )}
                </div>

                {/* Client Search */}
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Select Client *</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Search or select client..."
                      value={clientSearchQuery}
                      onChange={(e) => {
                        setClientSearchQuery(e.target.value);
                        searchClients(e.target.value);
                      }}
                      onFocus={() => {
                        setShowClientDropdown(true);
                        searchClients(clientSearchQuery);
                      }}
                      className="input-field w-full"
                    />
                    {showClientDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {clientSearchResults.length > 0 ? (
                          <>
                            {clientSearchResults.slice(0, 10).map((client) => (
                              <button
                                key={client._id}
                                onClick={() => handleSelectClient(client)}
                                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors border-b border-neutral-100 last:border-0"
                              >
                                <p className="text-sm font-bold text-neutral-900">{client.displayName}</p>
                                {client.email && (
                                  <p className="text-xs text-neutral-500">{client.email}</p>
                                )}
                                {client.phoneNumber && (
                                  <p className="text-xs text-neutral-400">{client.phoneNumber}</p>
                                )}
                              </button>
                            ))}
                          </>
                        ) : (
                          <div className="p-3 text-center text-sm text-neutral-500">No clients available</div>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.clientName && (
                    <p className="text-xs text-neutral-500 mt-1">Selected: {formData.clientName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Due Date *</label>
                <input 
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-3">Invoice Items *</label>
                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input 
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].description = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="input-field col-span-5"
                      />
                      <input 
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].quantity = parseInt(e.target.value) || 1;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="input-field col-span-2"
                      />
                      <input 
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, items: newItems });
                        }}
                        className="input-field col-span-4"
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => setFormData({
                      ...formData,
                      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }]
                    })}
                    className="text-sm text-primary-600 font-medium hover:underline">
                    + Add Item
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Notes</label>
                <textarea 
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field w-full h-24 resize-none"
                />
              </div>

              <div className="bg-neutral-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900">Total Amount:</span>
                  <span className="text-lg font-bold text-neutral-900">
                    PKR {formData.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    caseId: '',
                    clientId: '',
                    clientName: '',
                    items: [{ description: '', quantity: 1, unitPrice: 0 }],
                    dueDate: '',
                    notes: '',
                  });
                }}
                className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleCreateInvoice}
                className="btn btn-primary">
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Record Payment</h2>
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                  setPaymentAmount('');
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Invoice</p>
                <p className="font-bold text-neutral-900">{selectedInvoice.invoiceNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Invoice Amount</p>
                  <p className="font-bold text-neutral-900">PKR {selectedInvoice.amount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Already Paid</p>
                  <p className="font-bold text-neutral-900">PKR {(selectedInvoice.amountPaid || 0).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Payment Amount</label>
                <input 
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="input-field w-full"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Remaining: PKR {(selectedInvoice.amount - (selectedInvoice.amountPaid || 0) - (parseFloat(paymentAmount) || 0)).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                  setPaymentAmount('');
                }}
                className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleRecordPayment}
                className="btn btn-primary">
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">{selectedExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button 
                onClick={() => {
                  setShowExpenseModal(false);
                  setSelectedExpense(null);
                  setExpenseFormData({
                    title: '',
                    description: '',
                    amount: 0,
                    category: 'OTHER',
                    date: new Date().toISOString().split('T')[0],
                    status: 'PENDING',
                  });
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Expense Title</label>
                <input 
                  type="text"
                  placeholder="e.g., Office Supplies"
                  value={expenseFormData.title}
                  onChange={(e) => setExpenseFormData({...expenseFormData, title: e.target.value})}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-2">Description</label>
                <textarea 
                  placeholder="Optional notes about this expense"
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({...expenseFormData, description: e.target.value})}
                  className="input-field w-full resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Amount</label>
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData({...expenseFormData, amount: parseFloat(e.target.value) || 0})}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Category</label>
                  <select 
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData({...expenseFormData, category: e.target.value})}
                    className="input-field w-full">
                    <option value="TRAVEL">Travel</option>
                    <option value="OFFICE">Office</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="STAFF">Staff</option>
                    <option value="LEGAL">Legal</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Date</label>
                  <input 
                    type="date"
                    value={expenseFormData.date}
                    onChange={(e) => setExpenseFormData({...expenseFormData, date: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">Status</label>
                  <select 
                    value={expenseFormData.status}
                    onChange={(e) => setExpenseFormData({...expenseFormData, status: e.target.value})}
                    className="input-field w-full">
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-sm text-error">{errorMessage}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setShowExpenseModal(false);
                  setSelectedExpense(null);
                  setExpenseFormData({
                    title: '',
                    description: '',
                    amount: 0,
                    category: 'OTHER',
                    date: new Date().toISOString().split('T')[0],
                    status: 'PENDING',
                  });
                }}
                className="btn btn-secondary">
                Cancel
              </button>
              <button 
                onClick={selectedExpense ? handleUpdateExpense : handleCreateExpense}
                className="btn btn-primary">
                {selectedExpense ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
