
import { useEffect, useState } from 'react';
import { KeyboardState } from '../types';

export const useKeyboard = () => {
  const [keys, setKeys] = useState<KeyboardState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setKeys(prev => ({ ...prev, forward: true })); break;
        case 'KeyS': setKeys(prev => ({ ...prev, backward: true })); break;
        case 'KeyA': setKeys(prev => ({ ...prev, left: true })); break;
        case 'KeyD': setKeys(prev => ({ ...prev, right: true })); break;
        case 'Space': setKeys(prev => ({ ...prev, up: true })); break;
        case 'KeyC': setKeys(prev => ({ ...prev, down: true })); break;
        case 'ShiftLeft': setKeys(prev => ({ ...prev, boost: true })); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setKeys(prev => ({ ...prev, forward: false })); break;
        case 'KeyS': setKeys(prev => ({ ...prev, backward: false })); break;
        case 'KeyA': setKeys(prev => ({ ...prev, left: false })); break;
        case 'KeyD': setKeys(prev => ({ ...prev, right: false })); break;
        case 'Space': setKeys(prev => ({ ...prev, up: false })); break;
        case 'KeyC': setKeys(prev => ({ ...prev, down: false })); break;
        case 'ShiftLeft': setKeys(prev => ({ ...prev, boost: false })); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
};
