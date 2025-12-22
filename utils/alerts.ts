import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Common configuration for consistent look
const commonConfig = {
    customClass: {
        confirmButton: 'px-6 py-2.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-all shadow-lg mx-2',
        cancelButton: 'px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-all mx-2',
        popup: 'rounded-2xl border-none dark:bg-slate-800 dark:text-white',
        title: 'text-2xl font-bold text-slate-900 dark:text-white',
        htmlContainer: 'text-slate-600 dark:text-slate-400'
    },
    buttonsStyling: false
};

export const showAlert = {
    success: (title: string, text?: string) => {
        return MySwal.fire({
            ...commonConfig,
            icon: 'success',
            title,
            text,
            timer: 3000,
            showConfirmButton: false
        });
    },

    error: (title: string, text?: string) => {
        return MySwal.fire({
            ...commonConfig,
            icon: 'error',
            title,
            text
        });
    },

    info: (title: string, text?: string) => {
        return MySwal.fire({
            ...commonConfig,
            icon: 'info',
            title,
            text
        });
    },

    warning: (title: string, text?: string) => {
        return MySwal.fire({
            ...commonConfig,
            icon: 'warning',
            title,
            text
        });
    },

    confirm: async (title: string, text: string, confirmButtonText = 'Yes, Proceed') => {
        const result = await MySwal.fire({
            ...commonConfig,
            icon: 'warning',
            title,
            text,
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });
        return result.isConfirmed;
    }
};
