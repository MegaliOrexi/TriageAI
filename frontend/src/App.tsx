import { useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(() => {
      // Session handling moved to main.tsx
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      () => {
        // Session handling moved to main.tsx
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>TriageAI</h1>
      </header>
    </div>
  );
}

export default App;
