import { useEffect } from 'react';
import { useStore } from '../store';
import type { DBSnippet } from '../db';

export default function MessageListener() {
  const { addSnippet, setExtensionConnected } = useStore();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate event validity
      if (!event.data || typeof event.data !== 'object') return;

      const { type, payload } = event.data;

      switch (type) {
        case 'SCRIPTFORGE_NEW_SNIPPET': {
          console.log('IdeaMeow: received new snippet', payload);
          if (payload && payload.id && payload.content) {
            addSnippet(payload as DBSnippet);
          }
          break;
        }
        case 'SCRIPTFORGE_PONG_EXTENSION': {
          console.log('IdeaMeow: Chrome Extension detected active');
          setExtensionConnected(true);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Initial ping to the extension bridge to verify connection
    const pingExtension = () => {
      window.postMessage({ type: 'SCRIPTFORGE_PING_EXTENSION' }, '*');
    };

    // Ping immediately
    pingExtension();

    // Setup an interval to check extension heartbeat periodically
    const intervalId = setInterval(pingExtension, 5000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(intervalId);
    };
  }, [addSnippet, setExtensionConnected]);

  return null; // Side-effect only component
}
