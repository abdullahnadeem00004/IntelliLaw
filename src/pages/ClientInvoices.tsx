import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronRight, Clock, CreditCard, FileText, Loader2, Search } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getInvoiceStatus(invoice: any) {
  if (invoice.status === 'PAID') return 'PAID';
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today ? 'OVERDUE' : invoice.status;
}

function getStatusClass(status: string) {
  if (status === 'PAID') return 'bg-success/10 text-success';
  if (status === 'OVERDUE') return 'bg-error/10 text-error';
  if (status === 'PARTIAL') return 'bg-warning/10 text-warning';
  return 'bg-neutral-100 text-neutral-600';
}

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/billing`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load your invoices');
        }

        setInvoices(await response.json());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load your invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return invoices.filter((invoice) => {
      const status = getInvoiceStatus(invoice);
      const matchesStatus = statusFilter === 'All' || status === statusFilter;
      const matchesSearch = [
        invoice.invoiceNumber,
        invoice.clientName,
        invoice.caseId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [invoices, searchTerm, statusFilter]);

  const outstanding = invoices.reduce((sum, invoice) => sum + (invoice.amount - (invoice.amountPaid || 0)), 0);
  const overdue = invoices
    .filter((invoice) => getInvoiceStatus(invoice) === 'OVERDUE')
    .reduce((sum, invoice) => sum + (invoice.amount - (invoice.amountPaid || 0)), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading your invoices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Invoices</h1>
          <p className="text-neutral-500 text-sm mt-1">Read-only invoices issued for your linked cases.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error text-error rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Invoices', value: invoices.length, icon: FileText, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Outstanding', value: `PKR ${outstanding.toLocaleString()}`, icon: CreditCard, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Overdue', value: `PKR ${overdue.toLocaleString()}`, icon: Clock, color: 'text-error', bg: 'bg-error/10' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase">{stat.label}</p>
              <p className="text-lg font-bold text-neutral-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by invoice number or case..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <select
          className="input-field py-2 text-sm w-full md:w-40"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option>All</option>
          <option>UNPAID</option>
          <option>PARTIAL</option>
          <option>OVERDUE</option>
          <option>PAID</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const status = getInvoiceStatus(invoice);
                  return (
                    <tr key={invoice._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-neutral-900">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">Case: {invoice.caseId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-neutral-900">PKR {invoice.amount.toLocaleString()}</p>
                        {(invoice.amountPaid || 0) > 0 && (
                          <p className="text-xs text-neutral-500">Paid: PKR {invoice.amountPaid.toLocaleString()}</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`badge ${getStatusClass(status)}`}>{status}</span>
                      </td>
                      <td className="px-6 py-5 text-sm text-neutral-700">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link to={`/my-invoices/${invoice._id}`} className="btn btn-secondary py-1.5 px-3 text-xs">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    {invoices.length === 0 ? 'No invoices have been issued to you yet.' : 'No invoices match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
