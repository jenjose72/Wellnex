import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';

// Add the missing UserProfile type
type UserProfile = {
  id: string;
  name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  blood_group?: string;
  avatar_url?: string;
  created_at?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<boolean>;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initialize = async () => { 
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        setSession(session);
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setInitialized(true);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user || null);
        
        // Handle email confirmation
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, checking for profile...');
          await ensureUserProfile(session.user);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Helper function to ensure user profile exists
  const ensureUserProfile = async (user: User) => {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users_profile')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking profile:', fetchError);
        return;
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        console.log('Creating profile for user:', user.id);
        const { error: insertError } = await supabase
          .from('users_profile')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || '',
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully');
        }
      }
    } catch (err) {
      console.error('Exception in ensureUserProfile:', err);
    }
  };

  // Improved signup function with better error handling
  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting signup process...');
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name: name // Store name in user metadata
          }
        }
      });
      
      console.log("Signup response:", { data, error });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        console.log("User created with ID:", data.user.id);
        
        // Check if email confirmation is required
        if (!data.user.email_confirmed_at && data.user.confirmation_sent_at) {
          setError("Please check your email and click the confirmation link to complete registration.");
          return;
        }
        
        // If user is confirmed or confirmation not required, proceed
        if (data.user.email_confirmed_at || !data.user.confirmation_sent_at) {
          console.log("User confirmed, creating profile...");
          
          try {
            const { error: profileError } = await supabase
              .from('users_profile')
              .insert({
                id: data.user.id,
                name: name,
                created_at: new Date().toISOString()
              });
          
            if (profileError) {
              console.error("Profile creation error:", profileError);
              // Don't throw - user can complete profile later
            } else {
              console.log("Profile created successfully");
            }
          } catch (err) {
            console.error("Profile creation exception:", err);
          }
          
          console.log("Navigating to main app...");
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Attempting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      console.log('Sign in successful:', data.user?.id);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth/login');
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign out');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'wellnex://reset-password',
      });
      if (error) throw error;
      router.push('/auth/check-email');
    } catch (error: any) {
      setError(error.message || 'An error occurred during password reset');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    try {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('users_profile')
        .upsert({ 
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      return true;
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        initialized,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};