import React from 'react';

interface UserAvatarProps {
    user: {
        name: string;
        avatar?: string;
    } | null;
    className?: string;
    fallbackClassName?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, className = "w-8 h-8", fallbackClassName = "" }) => {
    if (!user) {
        return (
            <div className={`${className} rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 ${fallbackClassName}`}>
                ?
            </div>
        );
    }

    if (user.avatar) {
        return (
            <img
                src={user.avatar}
                alt={user.name}
                className={`${className} rounded-full object-cover border border-slate-100 dark:border-slate-800 ${fallbackClassName}`}
                onError={(e) => {
                    // If image fails to load, hide it and the fallback will show if we had a state,
                    // but for simplicity, we'll just handle it via conditional rendering or standard fallback
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement?.classList.add('avatar-error');
                }}
            />
        );
    }

    return (
        <div className={`${className} rounded-full bg-[#16A34A] text-white flex items-center justify-center font-black ${fallbackClassName}`}>
            {user.name.charAt(0).toUpperCase()}
        </div>
    );
};

export default UserAvatar;
