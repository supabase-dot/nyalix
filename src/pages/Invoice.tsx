import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuoteRequest {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  product_name: string;
  quantity: number;
  message: string;
  status: 'Pending' | 'Responded' | 'Approved';
  admin_response: string | null;
  admin_responded_at: string | null;
  created_at: string;
  unit_price?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount?: number;
}

const Invoice = () => {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        toast.error('Failed to load invoice');
        return;
      }

      setQuote(data);
      setLoading(false);
    };

    fetchQuote();
  }, [id]);

  const printInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!quote || quote.status !== 'Approved') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invoice Not Available</h1>
          <p className="text-muted-foreground">This quote has not been approved yet or does not exist.</p>
        </div>
      </div>
    );
  }

  const unitPrice = quote.unit_price || 0;
  const taxRate = quote.tax_rate || 0;
  const quantity = quote.quantity;
  const subtotal = unitPrice * quantity;
  const taxAmount = quote.tax_amount || (subtotal * taxRate);
  const total = quote.total_amount || (subtotal + taxAmount);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Nyalix Medical PVT LTD</h1>
              <p className="text-blue-100">Medical Equipment Excellence</p>
            </div>
            <button
              onClick={printInvoice}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Print Invoice
            </button>
          </div>
        </div>

        {/* Invoice Header */}
        <div className="p-8 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
              <p className="text-gray-600">Invoice #: {quote.id}</p>
              <p className="text-gray-600">Date: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Quote Request Date:</p>
              <p className="font-semibold">{new Date(quote.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bill To:</h3>
              <div className="space-y-2">
                <p className="font-semibold">{quote.name}</p>
                <p>{quote.company}</p>
                <p>{quote.email}</p>
                <p>{quote.phone}</p>
                <p>{quote.country}</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quote Details:</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">Product:</span> {quote.product_name}</p>
                <p><span className="font-semibold">Quantity:</span> {quote.quantity}</p>
                <p><span className="font-semibold">Status:</span> {quote.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="px-8 pb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Quantity</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Unit Price</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">{quote.product_name}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{quantity}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">${unitPrice.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">${subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 pb-8">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="font-semibold mb-2">Thank you for choosing Nyalix Medical PVT LTD</p>
            <p>For any questions, please contact us at info@nyalixmed.com or call +971 50 123 4567</p>
            <p className="text-sm mt-4">&copy; 2026 Nyalix Medical PVT LTD. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;