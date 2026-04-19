// eslint-disable-next-line no-unused-vars
import React, { useContext, useState } from 'react';
import './Main.css';
import { assets } from '../../assets/assets'; 
import { Context } from '../../context/Context';
// eslint-disable-next-line no-unused-vars
import { useAuth0 } from "@auth0/auth0-react";

const Main = () => {
  const {
    onSent,
    recentPrompt,
    showResult,
    loading,
    resultData,
    setInput,
    input,
    startVoiceRecognition,
    videos,
  } = useContext(Context);

  const { loginWithRedirect, isAuthenticated, logout, user } = useAuth0();

  const handleEnterPress = (e) => {
    if (e.key === 'Enter') {
      onSent(input, isAuthenticated ? user.name : "");
    }
  };
  
  const [showInfo, setShowInfo] = useState(false);

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  return (
    <div className='main'>
      <div className="nav">
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <li>
            {isAuthenticated ? (
              <>
                {/* ✅ REMOVED ChatComponent from here - now in App.jsx */}
                <img
                  style={{
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    border: '2px solid #ccc',
                    borderColor: '#ffffff'
                  }}
                  src={user.picture}
                  onClick={toggleInfo}
                />

                {showInfo && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '50px',
                      right: '0',
                      backgroundColor: '#1A1A1A',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '15px',
                      width: '200px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      zIndex: 1,
                      wordWrap: 'break-word',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'normal',
                      overflow: 'hidden'
                    }}
                  >
                    <h4 
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: '16px',
                        textAlign: 'center',
                        maxWidth: '100%',
                        wordWrap: 'break-word',
                      }}
                    >
                      {user.name}
                    </h4>
                    <hr />
                    <p 
                      style={{
                        margin: '0 0 10px 0',
                        fontSize: '12px',
                        textAlign: 'center',
                        color: '#ffff',
                        maxWidth: '100%',
                        wordWrap: 'break-word',
                      }}
                    >
                      <h4>Email:-</h4> 
                      {user.email}
                    </p>
                    <hr />
                    
                    <button
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#ff4d4d",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        marginTop: '10px',
                        width: "100%",
                      }}
                      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                style={{
                  padding: "8px 12px",
                  backgroundColor: "fff",
                  color: "#1A1A1A",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: 'bold'
                }}
                onClick={() => loginWithRedirect()}
              >
                Log in
              </button>
            )}
          </li>
        </div>
      </div>

      <div className="main_container">
        {!showResult ? (
          <>
            <div className="greet" id="center-text">
              <p><span>Hello</span></p>
              <p>How can I help you today?</p>
            </div>
            <div className="cards" id="card">
              {[
                "Suggest beautiful places for an upcoming road trip",
                "Briefly summarize this concept: urban planning",
                "Brainstorm team bonding activities for our work retreat",
                "Improve the readability of the following code"
              ].map((text, index) => (
                <div key={index} className="card" onClick={() => {
                  setInput(text);
                  onSent(text, isAuthenticated ? user.name : "");
                }}>
                  <p>{text}</p>
                  <img 
                    src={[assets.compass_icon, assets.bulb_icon, assets.message_icon, assets.code_icon][index]} 
                    alt="Icon" 
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className='result'>
            <div className="result-title">
              <img src={assets.user_icon} alt='User' />
              <p>{recentPrompt}</p>
            </div>
            <div className="result-data">
              {loading ? (
                <div className='loader'>
                  <hr />
                  <hr />
                  <hr />
                </div>
              ) : (
                <p dangerouslySetInnerHTML={{ __html: resultData }}></p>
              )}
            </div>
            <div className="video-results">
              {videos.map((video, index) => (
                <div key={video.id.videoId} className="video-item">
                  <h4>{index + 1}. {video.snippet.title}</h4>
                  <img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} />
                  <p>{video.snippet.description}</p>
                  <a href={`https://www.youtube.com/watch?v=${video.id.videoId}`} target="_blank" rel="noopener noreferrer">
                    Watch Video
                  </a>
                  <br></br>
                  <br></br>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="main-bottom">
          <div className="search-box">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={handleEnterPress}
              type="text"
              placeholder='Enter a prompt here'
            />
            <div className="search-actions">
              <button onClick={startVoiceRecognition}><img src={assets.mic_icon} alt="Mic" /></button>
              {input && <img onClick={() => onSent(input, isAuthenticated ? user.name : "")} src={assets.send_icon} alt="Send" />}
            </div>
          </div>
          <p className="bottom-info">
            Intelli Search Machine may display inaccurate info, including about people, so double-check its response.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Main;