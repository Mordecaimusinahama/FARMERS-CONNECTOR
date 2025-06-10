import React, { createContext, useState } from 'react';

export const SampleContext = createContext();

export const SampleProvider = ({ children }) => {
  const [value, setValue] = useState('Hello from context!');
  return (
    <SampleContext.Provider value={{ value, setValue }}>
      {children}
    </SampleContext.Provider>
  );
}; 