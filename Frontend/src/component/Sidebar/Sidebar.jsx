import React, { useContext, useState, useEffect } from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { onSent, prevPrompts, setRecentPrompt, newChat, setVideos } = useContext(Context);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = (e) => {
    if (window.innerWidth <= 600 && sidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('.hamburger')) {
      setSidebarOpen(false);
    }
  };

  const loadPrompt = async (prompt) => {
    setRecentPrompt(prompt);
    setVideos([]);
    await onSent(prompt);
    setSidebarOpen(false);
  };

  useEffect(() => {
    document.addEventListener('click', closeSidebar);
    return () => document.removeEventListener('click', closeSidebar);
  }, [sidebarOpen]);

  return (
    <>
      {/* Hamburger Button - Opens Sidebar */}
      <button className="hamburger" onClick={toggleSidebar}>
        ☰
      </button>

      {/* Sidebar - Hidden initially */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="top">
          {/* Clicking the + Button Sends User to Search Tab */}
          <div
            onClick={() => {
              newChat();
              document.getElementById('search-input').focus(); // Redirects user to search input
            }}
            className="new-chat"
          >
            <img src={assets.plus_icon} alt="New Chat" />
            <p>New Chat</p>
          </div>
          <div className="recent">
            <p className="recent-title">Recent</p>
            {prevPrompts.map((item, index) => (
              <div onClick={() => loadPrompt(item)} className="recent-entry" key={index}>
                <img src={assets.message_icon} alt="Message" />
                <p>{item.slice(0, 18)}...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Items */}
        <div className="bottom">
          <div className="bottom-item recent-entry">
            <img src={assets.question_icon} alt="Help" />
            <p>Help</p>
          </div>
          <div className="bottom-item recent-entry">
            <img src={assets.history_icon} alt="Activity" />
            <p>Activity</p>
          </div>
          <div className="bottom-item recent-entry">
            <img src={assets.setting_icon} alt="Settings" />
            <p>Settings</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
