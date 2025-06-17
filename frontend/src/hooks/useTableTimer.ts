import { useState, useEffect, useCallback } from 'react';
import { Table } from '../types';

interface UseTableTimerProps {
  table: Table;
  onTimeUpdate: (tableId: number, elapsedMinutes: number) => void;
}

export const useTableTimer = ({ table, onTimeUpdate }: UseTableTimerProps) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0); // en segundos
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Calcular tiempo transcurrido desde el inicio de la sesión
  useEffect(() => {
    if (table.sessionStartTime && table.status === 'occupied') {
      const startTime = new Date(table.sessionStartTime).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000); // en segundos
      setElapsedTime(elapsed);
      setIsRunning(true);
    } else {
      setElapsedTime(0);
      setIsRunning(false);
    }
  }, [table.sessionStartTime, table.status]);

  // Actualizar cronómetro cada segundo
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          // Actualizar cada minuto
          if (newTime % 60 === 0) {
            onTimeUpdate(table.id, Math.floor(newTime / 60));
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, table.id, onTimeUpdate]);

  // Formatear tiempo para mostrar
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calcular costo actual
  const calculateCurrentCost = useCallback((): number => {
    const minutes = Math.floor(elapsedTime / 60);
    const hours = minutes / 60;
    return hours * table.hourlyRate;
  }, [elapsedTime, table.hourlyRate]);

  // Iniciar cronómetro
  const startTimer = useCallback(() => {
    const now = new Date().toISOString();
    setIsRunning(true);
    return now;
  }, []);

  // Detener cronómetro
  const stopTimer = useCallback(() => {
    setIsRunning(false);
    const finalMinutes = Math.floor(elapsedTime / 60);
    const finalCost = calculateCurrentCost();
    return {
      minutes: finalMinutes,
      cost: finalCost,
      elapsedTime
    };
  }, [elapsedTime, calculateCurrentCost]);

  // Resetear cronómetro
  const resetTimer = useCallback(() => {
    setElapsedTime(0);
    setIsRunning(false);
  }, []);

  return {
    elapsedTime,
    isRunning,
    formattedTime: formatTime(elapsedTime),
    currentCost: calculateCurrentCost(),
    startTimer,
    stopTimer,
    resetTimer,
    minutes: Math.floor(elapsedTime / 60),
    hours: Math.floor(elapsedTime / 3600)
  };
}; 