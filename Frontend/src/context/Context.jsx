import { createContext, useState, useCallback, useRef, useEffect } from "react";
import runChat from "../config/gemini";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [prevPrompts, setPrevPrompts] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [videos, setVideos] = useState([]);

  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  
  // Track if chat data has been fetched to prevent infinite calls
  const hasFetchedChatData = useRef(false);
  
  const delayPara = useCallback((text) => {
    const words = text.split(" ");
    words.forEach((word, index) => {
      setTimeout(() => {
        setResultData((prev) => prev + (index === 0 ? word : " " + word));
      }, 75 * index);
    });
  }, []);

  const newChat = useCallback(() => {
    setLoading(false);
    setShowResult(false);
    setResultData("");
    setVideos([]);
    setInput("");
    setRecentPrompt("");
  }, []);

  const searchVideos = useCallback(async (query) => {
    if (!query) return;
    
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=5`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (!searchData.items || !searchData.items.length) {
        setVideos([]);
        return;
      }

      const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
      const videoDetailsResponse = await fetch(videoDetailsUrl);
      const videoDetailsData = await videoDetailsResponse.json();

      const videosWithComments = searchData.items.map((item) => {
        const stats = videoDetailsData.items?.find((video) => video.id === item.id.videoId);
        return {
          ...item,
          commentCount: stats?.statistics?.commentCount || 0,
        };
      });

      setVideos(videosWithComments.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0)));
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      setVideos([]);
    }
  }, [YOUTUBE_API_KEY]);

  const onSent = useCallback(async (prompt, username) => {
    setLoading(true);
    setShowResult(true);
    setResultData("");
    setVideos([]);
    
    try {
      const finalPrompt = prompt || input;
      if (!finalPrompt) {
        setLoading(false);
        return;
      }

      setPrevPrompts((prev) => [...prev, finalPrompt]);
      const response = await runChat(finalPrompt);
      setRecentPrompt(finalPrompt);
      await searchVideos(finalPrompt);

      // Update chat data using POST method
      if (username) {
        try {
          const url = `${BASE_URL}/api/update_chat_data`;
          console.log("Sending update request to:", url);
          
          const apiResponse = await fetch(url, { 
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username,
              chat: finalPrompt
            })
          });

          if (!apiResponse.ok) {
            throw new Error(`Error updating chat data: ${apiResponse.statusText}`);
          }
          
          const result = await apiResponse.json();
          console.log("✅ Chat data updated:", result);
        } catch (error) {
          console.error("❌ Error updating chat data:", error);
        }
      }

      // Clean and format response
      const cleanedResponse = response
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .split(". ")
        .map((sentence) => sentence.trim())
        .filter(Boolean)
        .join(".<br><br>");

      delayPara(cleanedResponse);
    } catch (error) {
      console.error("Error processing response:", error);
      setResultData("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setInput("");
    }
  }, [input, searchVideos, delayPara, BASE_URL]);

  const startVoiceRecognition = useCallback(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? " " : "") + transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event);
        alert("Error with speech recognition. Please try again.");
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  }, []);

  // Function to fetch chat data (can be called manually)
  const fetchChatData = useCallback(async (username) => {
    if (!username) return;
    
    try {
      const url = `${BASE_URL}/api/get_chat_data?username=${encodeURIComponent(username)}`;
      console.log("📡 Fetching chat data from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) throw new Error(`Error fetching chat data: ${response.statusText}`);
      const data = await response.json();

      if (data.chat && Array.isArray(data.chat)) {
        const messages = data.chat.map(chatItem => chatItem.message);
        setPrevPrompts(messages);
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Error fetching chat data:", error);
      return false;
    }
  }, [BASE_URL]);

  const contextValue = {
    prevPrompts,
    setPrevPrompts,
    onSent,
    setRecentPrompt,
    recentPrompt,
    loading,
    showResult,
    input,
    setInput,
    newChat,
    resultData,
    setResultData,
    startVoiceRecognition,
    videos,
    setVideos,
    fetchChatData, // Expose this function instead of ChatComponent
    hasFetchedChatData,
  };

  return <Context.Provider value={contextValue}>{props.children}</Context.Provider>;
};

export default ContextProvider;