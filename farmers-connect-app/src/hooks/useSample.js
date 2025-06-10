import { useContext } from 'react';
import { SampleContext } from '../context/SampleContext';

export function useSample() {
  return useContext(SampleContext);
} 