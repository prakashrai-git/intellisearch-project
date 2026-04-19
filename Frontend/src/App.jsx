import { useContext, useEffect, useRef } from 'react';
import Sidebar from './component/Sidebar/Sidebar';
import Main from './component/Main/Main';
import { useAuth0 } from '@auth0/auth0-react';
import { Context } from './context/Context';

function App() {
  const { isAuthenticated, user } = useAuth0();
  const { fetchChatData, hasFetchedChatData } = useContext(Context);
  const hasInitialized = useRef(false);

  // ✅ Load chat data ONLY ONCE when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.name && !hasInitialized.current) {
      hasInitialized.current = true;
      console.log("🔄 Loading chat history for user:", user.name);
      fetchChatData(user.name);
    }
    
    // Reset when user logs out
    if (!isAuthenticated) {
      hasInitialized.current = false;
    }
  }, [isAuthenticated, user, fetchChatData]);

  return (
    <>
      <Sidebar />
      <Main />
    </>
  );
}

export default App;