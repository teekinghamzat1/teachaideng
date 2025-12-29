import React from 'react';
import MyProfile from './MyProfile';
import { UserIcon } from '../components/Icons';

const AdminProfile: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-brand-100 dark:bg-brand-900 rounded-lg">
                    <UserIcon className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Account</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your administrative profile and security</p>
                </div>
            </div>

            <MyProfile isAdminView={true} />
        </div>
    );
};

export default AdminProfile;
