'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserProfile, Address } from '@/types'
import { auth, googleProvider } from '@/lib/firebase/config'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { FirestoreUserService } from '@/lib/firebase/firestoreService'
import { UserRepository } from '@/lib/data/repositories'

interface AuthContextType {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoginModalOpen: boolean
  setIsLoginModalOpen: (open: boolean) => void
  isProfileModalOpen: boolean
  setIsProfileModalOpen: (open: boolean) => void
  loginWithGoogle: () => Promise<UserProfile | null>
  logout: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile | null>
  addAddress: (address: Omit<Address, 'id'>) => Promise<Address | undefined>
  updateAddress: (address: Address) => Promise<void>
  deleteAddress: (id: string) => Promise<void>
  setDefaultAddress: (id: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // 1. Try to load existing profile from Firestore
          let profile = await FirestoreUserService.getById(firebaseUser.uid)

          if (!profile) {
            // Fallback to local repo if Firestore is empty
            profile = await UserRepository.getUserById(firebaseUser.uid)
          }

          if (!profile) {
            // First time Google login: create devotional user profile with REAL Google account data
            profile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Devotee',
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '',
              photoURL: firebaseUser.photoURL || '',
              addresses: [],
              profileComplete: false,
              marketingConsent: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastActiveAt: new Date().toISOString(),
            }
            await FirestoreUserService.save(profile)
            await UserRepository.saveUser(profile)
          }

          localStorage.setItem('vm_session_uid', profile.uid)
          setUser(profile)
        } catch (err) {
          console.warn('Auth sync fallback notice:', err)
        }
      } else {
        // If an old development mock session exists, purge it from browser storage
        const storedUid = typeof window !== 'undefined' ? localStorage.getItem('vm_session_uid') : null
        if (storedUid && storedUid.startsWith('user-google-dev-')) {
          localStorage.removeItem('vm_session_uid')
        }
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async (): Promise<UserProfile | null> => {
    setIsLoading(true)
    try {
      // Real Firebase Google Sign-In
      const credential = await signInWithPopup(auth, googleProvider)
      const fbUser = credential.user

      let profile = await FirestoreUserService.getById(fbUser.uid)
      if (!profile) {
        profile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Devotee',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || '',
          photoURL: fbUser.photoURL || '',
          addresses: [],
          profileComplete: false,
          marketingConsent: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        }
        await FirestoreUserService.save(profile)
        await UserRepository.saveUser(profile)
      }

      localStorage.setItem('vm_session_uid', profile.uid)
      setUser(profile)
      setIsLoginModalOpen(false)

      if (!profile.profileComplete) {
        setIsProfileModalOpen(true)
      }

      return profile
    } catch (firebaseErr: any) {
      console.warn('Firebase Google Sign-In error:', firebaseErr?.code, firebaseErr?.message)

      const code = firebaseErr?.code || ''

      // User closed popup or cancelled: no error needed
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return null
      }

      if (code === 'auth/unauthorized-domain') {
        throw new Error(
          'This domain is not authorized in Firebase. Please add this domain under Firebase Console > Authentication > Settings > Authorized Domains.'
        )
      }

      if (code === 'auth/popup-blocked') {
        throw new Error(
          'Google Sign-In popup was blocked by your browser. Please allow popups for this site and try again.'
        )
      }

      throw new Error(firebaseErr?.message || 'Failed to authenticate with Google. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch {
      // ignore
    }
    localStorage.removeItem('vm_session_uid')
    setUser(null)
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return null
    const updated: UserProfile = {
      ...user,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    await FirestoreUserService.save(updated)
    await UserRepository.saveUser(updated)
    setUser(updated)
    return updated
  }

  const addAddress = async (addressData: Omit<Address, 'id'>) => {
    if (!user) return
    const newAddress: Address = {
      ...addressData,
      id: 'addr-' + Date.now().toString(),
    }
    let updatedAddresses = [...user.addresses]
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }))
    }
    updatedAddresses.push(newAddress)
    await updateProfile({
      addresses: updatedAddresses,
      profileComplete: true,
    })
    return newAddress
  }

  const updateAddress = async (updatedAddress: Address) => {
    if (!user) return
    let updatedAddresses = user.addresses.map((a) =>
      a.id === updatedAddress.id ? updatedAddress : a
    )
    if (updatedAddress.isDefault) {
      updatedAddresses = updatedAddresses.map((a) =>
        a.id === updatedAddress.id ? a : { ...a, isDefault: false }
      )
    }
    await updateProfile({ addresses: updatedAddresses })
  }

  const deleteAddress = async (id: string) => {
    if (!user) return
    const updatedAddresses = user.addresses.filter((a) => a.id !== id)
    await updateProfile({ addresses: updatedAddresses })
  }

  const setDefaultAddress = async (id: string) => {
    if (!user) return
    const updatedAddresses = user.addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }))
    await updateProfile({ addresses: updatedAddresses })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        loginWithGoogle,
        logout,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
