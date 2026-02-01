import React, { useState, useEffect } from 'react';
import { db } from '../database';
import { Mail, Users, CheckCircle, XCircle, Eye, Clock, ChevronRight } from '../components/Icons';

interface MassEmail {
    id: string;
    subject: string;
    body: string;
    targetGroup: string;
    recipientCount: number;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    bouncedCount: number;
    failedCount: number;
    createdAt: string;
    admin: {
        name: string;
        email: string;
    };
}

interface EmailRecipient {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    status: string;
    sentAt: string | null;
    openedAt: string | null;
    failedAt: string | null;
    errorMessage: string | null;
}

export default function MassEmailTracking() {
    const [campaigns, setCampaigns] = useState<MassEmail[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<MassEmail | null>(null);
    const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        try {
            const data = await db.admin.getMassEmailHistory();
            setCampaigns(data);
        } catch (error) {
            console.error('Failed to load campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRecipients = async (campaignId: string, status?: string) => {
        try {
            const data = await db.admin.getMassEmailRecipients(campaignId, status);
            setRecipients(data);
            setStatusFilter(status || '');
        } catch (error) {
            console.error('Failed to load recipients:', error);
        }
    };

    const handleCampaignClick = (campaign: MassEmail) => {
        setSelectedCampaign(campaign);
        loadRecipients(campaign.id);
    };

    const handleStatusClick = (campaign: MassEmail, status: string) => {
        setSelectedCampaign(campaign);
        loadRecipients(campaign.id, status);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent': return 'text-blue-600 bg-blue-50';
            case 'opened': return 'text-green-600 bg-green-50';
            case 'failed': return 'text-red-600 bg-red-50';
            case 'bounced': return 'text-orange-600 bg-orange-50';
            case 'pending': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const calculatePercentage = (count: number, total: number) => {
        return total > 0 ? Math.round((count / total) * 100) : 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Mass Email Tracking</h1>
            </div>

            {!selectedCampaign ? (
                /* Campaign List View */
                <div className="grid gap-4">
                    {campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleCampaignClick(campaign)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                                        {campaign.subject}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        Sent by {campaign.admin.name} on {new Date(campaign.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Total Recipients */}
                                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <Users className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                                        {campaign.recipientCount}
                                    </div>
                                    <div className="text-xs text-slate-500">Recipients</div>
                                </div>

                                {/* Sent */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusClick(campaign, 'sent');
                                    }}
                                    className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    <Mail className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                    <div className="text-2xl font-black text-blue-600">
                                        {campaign.sentCount}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                        Sent ({calculatePercentage(campaign.sentCount, campaign.recipientCount)}%)
                                    </div>
                                </button>

                                {/* Opened */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusClick(campaign, 'opened');
                                    }}
                                    className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                >
                                    <Eye className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                    <div className="text-2xl font-black text-green-600">
                                        {campaign.openedCount}
                                    </div>
                                    <div className="text-xs text-green-600">
                                        Opened ({calculatePercentage(campaign.openedCount, campaign.sentCount)}%)
                                    </div>
                                </button>

                                {/* Failed */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusClick(campaign, 'failed');
                                    }}
                                    className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                    <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                                    <div className="text-2xl font-black text-red-600">
                                        {campaign.failedCount}
                                    </div>
                                    <div className="text-xs text-red-600">
                                        Failed ({calculatePercentage(campaign.failedCount, campaign.recipientCount)}%)
                                    </div>
                                </button>
                            </div>
                        </div>
                    ))}

                    {campaigns.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <Mail className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500">No mass emails sent yet</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Recipient Detail View */
                <div className="space-y-4">
                    <button
                        onClick={() => {
                            setSelectedCampaign(null);
                            setRecipients([]);
                            setStatusFilter('');
                        }}
                        className="text-brand-500 hover:text-brand-600 font-bold flex items-center gap-2"
                    >
                        ← Back to Campaigns
                    </button>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                            {selectedCampaign.subject}
                        </h2>
                        <p className="text-slate-500 mb-4">
                            {statusFilter ? `Showing ${statusFilter} recipients` : 'All recipients'}
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800">
                                        <th className="text-left py-3 px-4 text-sm font-black text-slate-900 dark:text-white">
                                            Name
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-black text-slate-900 dark:text-white">
                                            Email
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-black text-slate-900 dark:text-white">
                                            Status
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-black text-slate-900 dark:text-white">
                                            Timestamp
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipients.map((recipient) => (
                                        <tr
                                            key={recipient.id}
                                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-white">
                                                {recipient.userName}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                {recipient.userEmail}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(recipient.status)}`}>
                                                    {recipient.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                {recipient.openedAt
                                                    ? new Date(recipient.openedAt).toLocaleString()
                                                    : recipient.sentAt
                                                        ? new Date(recipient.sentAt).toLocaleString()
                                                        : recipient.failedAt
                                                            ? new Date(recipient.failedAt).toLocaleString()
                                                            : '-'}
                                                {recipient.errorMessage && (
                                                    <div className="text-xs text-red-600 mt-1">{recipient.errorMessage}</div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {recipients.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    No recipients found
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
