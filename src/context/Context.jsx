import { createContext, useState, useEffect } from "react";
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
  
  const delayPara = (text) => {
    text.split(" ").forEach((word, index) => {
      setTimeout(() => {
        setResultData((prev) => prev + `${word} `);
      }, 75 * index);
    });
  };

  const newChat = () => {
    setLoading(false);
    setShowResult(false);
    setResultData("");
    setVideos([]);
    setInput("");
  };

  const onSent = async (prompt, username) => {
    setLoading(true);
    setShowResult(true);
    setResultData("");
    setVideos([]);
    
    try {
      const finalPrompt = prompt || input;
      if (!finalPrompt) return;

      setPrevPrompts((prev) => [...prev, finalPrompt]);
      const response = await runChat(finalPrompt);
      setRecentPrompt(finalPrompt);
      await searchVideos(finalPrompt);

      if (username) {
        const usernameEncoded = encodeURIComponent(username);
        const chatEncoded = encodeURIComponent(finalPrompt);
        
        try {
          const url = `${BASE_URL}/update_chat_data?username=${usernameEncoded}&chat=${chatEncoded}`;
          const apiResponse = await fetch(url, { method: "GET" });

          if (!apiResponse.ok) {
            throw new Error(`Error updating chat data: ${apiResponse.statusText}`);
          }
        } catch (error) {
          console.error("Error updating chat data:", error);
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
      setResultData("Sorry, something went wrong.");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const searchVideos = async (query) => {
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}&maxResults=5`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (!searchData.items?.length) {
        setVideos([]);
        return;
      }

      const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
      const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
      const videoDetailsResponse = await fetch(videoDetailsUrl);
      const videoDetailsData = await videoDetailsResponse.json();

      const videosWithComments = searchData.items.map((item) => {
        const stats = videoDetailsData.items.find((video) => video.id === item.id.videoId);
        return {
          ...item,
          commentCount: stats?.statistics?.commentCount || 0,
        };
      });

      setVideos(videosWithComments.sort((a, b) => b.commentCount - a.commentCount));
    } catch (error) {
      console.error("Error fetching YouTube videos:", error);
      setVideos([]);
    }
  };

  const startVoiceRecognition = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        setInput((prev) => prev + event.results[0][0].transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event);
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const ChatComponent = ({ username }) => {
    useEffect(() => {
      const fetchChatData = async () => {
        try {
          const url = `${BASE_URL}/get_chat_data?username=${encodeURIComponent(username)}`;
          const response = await fetch(url);

          if (!response.ok) throw new Error(`Error fetching chat data: ${response.statusText}`);
          const data = await response.json();

          if (data.chat) setPrevPrompts(data.chat);
        } catch (error) {
          console.error("Error fetching chat data:", error);
        }
      };

      fetchChatData();

      const handlePageHide = () => {
        console.log("Page is being hidden or unloaded.");
      };

      window.addEventListener("pagehide", handlePageHide);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") handlePageHide();
      });

      return () => {
        window.removeEventListener("pagehide", handlePageHide);
        document.removeEventListener("visibilitychange", handlePageHide);
      };
    }, [username]);

    return null;
  };

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
    ChatComponent,
  };

  return <Context.Provider value={contextValue}>{props.children}</Context.Provider>;
};

export default ContextProvider;
