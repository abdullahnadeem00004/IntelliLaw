import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Calendar, CreditCard, FileText, Loader2 } from 'lucide-react';

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

export default function ClientInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/billing/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'Invoice not found');
        }

        setInvoice(await response.json());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invoice not found');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <p className="text-neutral-500 font-medium">Loading invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center text-error">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Invoice Not Found</h2>
        <p className="text-neutral-500">{error || 'The invoice does not exist or is not linked to your profile.'}</p>
        <button onClick={() => navigate('/my-invoices')} className="btn btn-primary">
          Back to My Invoices
        </button>
      </div>
    );
  }

  const status = getInvoiceStatus(invoice);
  const paid = invoice.amountPaid || 0;
  const outstanding = invoice.amount - paid;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/my-invoices')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-neutral-900">{invoice.invoiceNumber}</h1>
              <span className={`badge ${getStatusClass(status)}`}>{status}</span>
            </div>
            <p className="text-neutral-500 text-sm mt-1">Read-only invoice details for your legal matter.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Invoice Amount', value: `PKR ${invoice.amount.toLocaleString()}`, icon: CreditCard, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Paid', value: `PKR ${paid.toLocaleString()}`, icon: FileText, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Outstanding', value: `PKR ${outstanding.toLocaleString()}`, icon: Calendar, color: outstanding > 0 ? 'text-warning' : 'text-success', bg: outstanding > 0 ? 'bg-warning/10' : 'bg-success/10' },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
            <h2 className="text-lg font-bold text-neutral-900">Invoice Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-xs font-bold text-neutral-500 uppercase text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {(invoice.items || []).map((item: any, index: number) => {
                  const quantity = item.quantity || 1;
                  const amount = item.amount || 0;
                  const unitPrice = item.unitPrice ?? amount / quantity;

                  return (
                    <tr key={`${item.description}-${index}`}>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{quantity}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">PKR {unitPrice.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-neutral-900 text-right">PKR {amount.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-6">Invoice Details</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase">Client</p>
                <p className="font-bold text-neutral-900 mt-1">{invoice.clientName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase">Case ID</p>
                <p className="font-bold text-neutral-900 mt-1 break-all">{invoice.caseId}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase">Issued</p>
                <p className="font-bold text-neutral-900 mt-1">{new Date(invoice.issuedDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-400 uppercase">Due</p>
                <p className="font-bold text-neutral-900 mt-1">{new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">Notes</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
