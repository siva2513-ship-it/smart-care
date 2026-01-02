
import React from 'react';

export const COLORS = {
  primary: '#2563eb', // Blue-600
  secondary: '#f59e0b', // Amber-500
  success: '#10b981', // Emerald-500
  danger: '#ef4444', // Red-500
  bg: '#f8fafc', // Slate-50
};

export const TIME_ICONS = {
  Morning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
  Afternoon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  ),
  Evening: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Night: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
};

export const MOCK_PRESCRIPTION_DATA: any = {
  medicines: [
    {
      id: '1',
      name: 'Amoxicillin 500mg',
      dosage: '1 Tablet',
      timing: ['Morning', 'Evening'],
      instructions: 'Take after meals. Do not skip doses.',
      icon: 'pill',
      color: 'blue'
    },
    {
      id: '2',
      name: 'Paracetamol 650mg',
      dosage: '1 Tablet',
      timing: ['Afternoon'],
      instructions: 'Only if fever is present.',
      icon: 'capsule',
      color: 'red'
    },
    {
      id: '3',
      name: 'Vitamin D3',
      dosage: '1 Capsule',
      timing: ['Morning'],
      instructions: 'Take once daily with breakfast.',
      icon: 'circle',
      color: 'yellow'
    }
  ],
  summary: "You have 3 medicines to take. The most important ones are Amoxicillin for your infection and Vitamin D3 for your bones. Remember to eat before taking the Amoxicillin."
};
