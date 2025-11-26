import { Dispatch, SetStateAction, useState } from 'react';
import { Building2, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

type FeedbackVendorPanelProps = {
  isHr: boolean;
  feedback: any;
  showVendorForm: boolean;
  setShowVendorForm: Dispatch<SetStateAction<boolean>>;
  vendorSearch: string;
  setVendorSearch: (value: string) => void;
  vendorPage: number;
  setVendorPage: Dispatch<SetStateAction<number>>;
  vendorTotalPages: number;
  vendorIdInput: number | '';
  setVendorIdInput: (value: number | '') => void;
  vendorDueDays: number;
  setVendorDueDays: (value: number) => void;
  vendorMessage: string;
  setVendorMessage: (value: string) => void;
  pagedVendors: any[];
  forwardVendorMutation: any;
  formatVendorStatus: (status?: string) => string;
  canForward: boolean;
  userRole?: string;
  requestApprovalMutation?: any;
  approveVendorMutation?: any;
};

export function FeedbackVendorPanel({
  isHr,
  feedback,
  showVendorForm,
  setShowVendorForm,
  vendorSearch,
  setVendorSearch,
  vendorPage,
  setVendorPage,
  vendorTotalPages,
  vendorIdInput,
  setVendorIdInput,
  vendorDueDays,
  setVendorDueDays,
  vendorMessage,
  setVendorMessage,
  pagedVendors,
  forwardVendorMutation,
  formatVendorStatus,
  canForward,
  userRole,
  requestApprovalMutation,
  approveVendorMutation,
}: FeedbackVendorPanelProps) {
  const [showApprovalOptions, setShowApprovalOptions] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          Vendor Management
        </h3>
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${(feedback as any).is_vendor_related ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
          {(feedback as any).is_vendor_related ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Vendor Status Display */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className="font-medium text-gray-900">{formatVendorStatus((feedback as any).vendor_status)}</span>
        </div>

        {/* View Conversation Button */}
        {!(feedback as any).vendor_status || (feedback as any).vendor_status === 'NONE' ? null : (
          <Link
            to={`/vendor-conversation/${feedback.id}`}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            View Vendor Chat
          </Link>
        )}

        {/* Superadmin Approval Workflow */}
        {isHr && (feedback as any).vendor_status && (feedback as any).vendor_status !== 'NONE' && (
          <div className="pt-2 border-t border-gray-100">
            {userRole === 'SUPERADMIN' ? (
              // Superadmin View: Approve/Reject
              !showApprovalOptions ? (
                <button
                  onClick={() => setShowApprovalOptions(true)}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <AlertCircle className="h-4 w-4" />
                  Superadmin Approval
                </button>
              ) : (
                <div className="space-y-3 animate-in slide-in-from-top-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        approveVendorMutation?.mutate({ action: 'approve' });
                        setShowApprovalOptions(false);
                      }}
                      disabled={approveVendorMutation?.isPending}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        approveVendorMutation?.mutate({ action: 'reject' });
                        setShowApprovalOptions(false);
                      }}
                      disabled={approveVendorMutation?.isPending}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                  <button
                    onClick={() => setShowApprovalOptions(false)}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Cancel
                  </button>
                </div>
              )
            ) : (
              // Admin View: Request Approval
              <button
                onClick={() => requestApprovalMutation?.mutate()}
                disabled={requestApprovalMutation?.isPending}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                <AlertCircle className="h-4 w-4" />
                {requestApprovalMutation?.isPending ? 'Sending Request...' : 'Request Superadmin Approval'}
              </button>
            )}
          </div>
        )}

        {/* Vendor Actions */}
        {isHr && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowVendorForm((v) => !v)}
              disabled={!canForward}
              className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!canForward ? 'Already Forwarded' : showVendorForm ? 'Cancel Action' : 'Forward to Vendor'}
            </button>

            {showVendorForm && (
              <div className="space-y-3 animate-in slide-in-from-top-2">
                <input
                  type="text"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  placeholder="Search vendor..."
                  disabled={!canForward}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <select
                  value={vendorIdInput}
                  onChange={(e) => setVendorIdInput(e.target.value ? Number(e.target.value) : '')}
                  disabled={!canForward}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select Vendor</option>
                  {pagedVendors.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.full_name || v.email}
                    </option>
                  ))}
                </select>
                {vendorTotalPages > 1 && (
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <button
                      type="button"
                      onClick={() => setVendorPage((p) => Math.max(1, p - 1))}
                      disabled={vendorPage === 1}
                      className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <span className="font-medium">
                      Page {vendorPage} / {vendorTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVendorPage((p) => Math.min(vendorTotalPages, p + 1))}
                      disabled={vendorPage === vendorTotalPages}
                      className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Due in (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={vendorDueDays}
                    onChange={(e) => setVendorDueDays(Number(e.target.value) || 0)}
                    disabled={!canForward}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <textarea
                  value={vendorMessage}
                  onChange={(e) => setVendorMessage(e.target.value)}
                  rows={2}
                  placeholder="Instructions..."
                  disabled={!canForward}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    forwardVendorMutation.reset();
                    forwardVendorMutation.mutate();
                  }}
                  disabled={!canForward || !vendorIdInput || !vendorMessage.trim() || vendorDueDays < 1 || forwardVendorMutation.isPending}
                  aria-busy={forwardVendorMutation.isPending}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {forwardVendorMutation.isPending ? 'Sending...' : 'Send Request'}
                </button>
                {forwardVendorMutation.isSuccess && (
                  <p className="text-xs text-emerald-700">Request sent to vendor.</p>
                )}
                {forwardVendorMutation.isError && (
                  <p className="text-xs text-red-600">Send failed. Please try again.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackVendorPanel;
