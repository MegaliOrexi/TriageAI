import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { supabase } from '../lib/supabase';
import type { Patient } from '../lib/supabase';

const PatientView: FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

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
        fetchPatientQueue();
      })
      .subscribe();

    // Set up refresh interval
    const intervalId = setInterval(() => {
      fetchPatientQueue();
    }, 30000); // Refresh every 30 seconds

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const fetchPatientQueue = async () => {
    try {
      setLoading(true);
      
      // Try to use the triage API endpoint first
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/triage/queue`);
        if (response.ok) {
          const data = await response.json();
          setPatients(data);
          setLastUpdated(new Date());
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching from API, falling back to direct Supabase query:', err);
      }
      
      // Fallback to direct Supabase query
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('status', 'waiting')
        .order('priority_score', { ascending: false });
      
      if (error) throw error;
      
      setPatients(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching patient queue:', err);
      setError('Unable to load patient queue. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? (
            <div className="loading-spinner">Loading patient queue...</div>
          ) : patients.length === 0 ? (
            <div className="empty-queue">No patients currently waiting</div>
          ) : (
            patients.map((patient, index) => {
              const waitingTime = calculateWaitingTime(patient.arrival_time);
              
              return (
                <div key={patient.id} className={`queue-item risk-${patient.risk_level}`}>
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
