import { useState, useEffect, useCallback, useRef } from 'react';
import type { FC } from 'react';
import { supabase } from '../lib/supabase';
import type { Patient } from '../lib/supabase';

const PatientView: FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track the last fetch time to prevent too frequent updates
  const lastFetchTimeRef = useRef<number>(Date.now());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable sort function that considers multiple factors
  const stableSortPatients = useCallback((patientList: Patient[]) => {
    return [...patientList].sort((a, b) => {
      // First, compare by risk level (highest priority)
      if (a.risk_level !== b.risk_level) {
        return b.risk_level - a.risk_level;
      }
      
      // If risk levels are equal, compare by priority score
      const aPriority = a.priority_score ?? 0;
      const bPriority = b.priority_score ?? 0;
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // If priority scores are equal, compare by arrival time
      return new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime();
    });
  }, []);

  const fetchPatientQueue = useCallback(async () => {
    // Prevent fetching if less than 2 seconds have passed since last fetch
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 2000) {
      return;
    }
    
    try {
      setLoading(true);
      lastFetchTimeRef.current = now;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/triage/queue`);
        if (response.ok) {
          const data = await response.json();
          // Use stable sort
          const sortedData = stableSortPatients(data);
          setPatients(sortedData);
          setLastUpdated(new Date());
          setError(null);
          return;
        }
      } catch (err) {
        console.error('Error fetching from API, falling back to direct Supabase query:', err);
      }
    } catch (err) {
      console.error('Error fetching patient queue:', err);
      setError('Unable to load patient queue. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [stableSortPatients]);

  // Debounced update function with minimum interval
  const debouncedUpdate = useCallback(() => {
    const minUpdateInterval = 5000; // Minimum 5 seconds between updates
    const now = Date.now();
    
    if (now - lastFetchTimeRef.current < minUpdateInterval) {
      // If an update is already scheduled, don't schedule another one
      if (fetchTimeoutRef.current) return;
      
      // Schedule an update for when the minimum interval has passed
      const timeToNextUpdate = minUpdateInterval - (now - lastFetchTimeRef.current);
      fetchTimeoutRef.current = setTimeout(() => {
        fetchPatientQueue();
        fetchTimeoutRef.current = null;
      }, timeToNextUpdate);
      return;
    }

    // If enough time has passed, update immediately
    fetchPatientQueue();
  }, [fetchPatientQueue]);

  useEffect(() => {
    fetchPatientQueue();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('public:patients')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'patients'
      }, () => {
        debouncedUpdate();
      })
      .subscribe();

    // Set up refresh interval - every 2 minutes
    const intervalId = setInterval(fetchPatientQueue, 120000);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [fetchPatientQueue, debouncedUpdate]);

  // Calculate waiting time in minutes
  const calculateWaitingTime = (arrivalTime: string): number => {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    return Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60));
  };

  // Format waiting time for display
  const formatWaitingTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hr ${remainingMinutes} min`;
    }
  };

  // Format last updated time
  const formatLastUpdated = (): string => {
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div className="patient-view">
      <header>
        <h1>Emergency Room Queue</h1>
        <div className="last-updated">Last updated: {formatLastUpdated()}</div>
      </header>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="queue-container">
        <div className="queue-header">
          <div>Position</div>
          <div>Patient</div>
          <div>Risk Level</div>
          <div>Waiting Time</div>
        </div>
        
        <div className="queue-list">
          {patients.length === 0 ? (
            loading ? (
              <div className="loading-spinner">Loading patient queue...</div>
            ) : (
              <div className="empty-queue">No patients currently waiting</div>
            )
          ) : (
            patients.map((patient, index) => {
              const waitingTime = calculateWaitingTime(patient.arrival_time);
              
              return (
                <div 
                  key={patient.id} 
                  className={`queue-item risk-${patient.risk_level}`}
                >
                  <div className="queue-position">{index + 1}</div>
                  <div className="patient-info">
                    <div className="patient-id">{patient.first_name} {patient.last_name}</div>
                    <div className="patient-details">
                      {patient.chief_complaint && (
                        <span className="chief-complaint">{patient.chief_complaint}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="risk-level">
                      {patient.risk_level === 3 ? 'High' : 
                       patient.risk_level === 2 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  <div className="waiting-time">
                    {formatWaitingTime(waitingTime)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <footer>
        <p>TriageAI Emergency Room Queue System</p>
        <p>Please speak to a staff member if you need immediate assistance</p>
      </footer>
    </div>
  );
};

export default PatientView;
