import React from 'react';
import { LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

type UserMenuProps = {
  profile: Profile;
};

export function UserMenu({ profile }: UserMenuProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 hover:text-yellow-400 transition-colors">
        <User className="w-5 h-5" />
        <span>{profile.username}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-900 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}