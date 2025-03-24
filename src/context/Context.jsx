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

  const delayPara = (index, nextWord) => {
    setTimeout(() => {
      setResultData((prev) => prev + nextWord);
    }, 75 * index);
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
    let response;

    try {
      const finalPrompt = prompt || input;
      if (!finalPrompt) return;

      setPrevPrompts((prev) => [...prev, finalPrompt]);
      response = await runChat(finalPrompt);
      setRecentPrompt(finalPrompt);
      await searchVideos(finalPrompt);

      console.log(username, finalPrompt);

      if (username) {
        try {
          const usernameEncoded = encodeURIComponent(username);
          const chatEncoded = encodeURIComponent(finalPrompt);
          // const url = `http://localhost:5000/update_chat_data?username=${usernameEncoded}&chat=${chatEncoded}`;
          const url = `https://intellisearch-project.onrender.com/update_chat_data?username=${usernameEncoded}&chat=${chatEncoded}`;


          const apiResponse = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (!apiResponse.ok) {
            throw new Error(`Error updating chat data: ${apiResponse.statusText}`);
          }
        } catch (error) {
          console.error("Error updating chat data:", error);
        }
      }

      const cleanedResponse = response
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const formattedResponse = cleanedResponse
        .split(". ")
        .map((sentence) => sentence.trim())
        .filter(Boolean)
        .join(".<br><br>");

      setResultData(formattedResponse);

      const words = formattedResponse.split(" ");
      words.forEach((word, index) => {
        delayPara(index, `${word}${index < words.length - 1 ? " " : ""}`);
      });
    } catch (error) {
      console.error("Error processing response:", error);
      setResultData("Sorry, something went wrong.");
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const searchVideos = async (query) => {
    const apiKey = "AIzaSyDPR9IStKyzn3jdSa1IsqXBtZalERRHpj0";
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${apiKey}&maxResults=5`;

    try {
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.items?.length) {
        const videoIds = searchData.items.map((item) => item.id.videoId).join(",");
        const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
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
      } else {
        setVideos([]);
      }
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
          const response = await fetch(
            // `http://localhost:5000/get_chat_data?username=${encodeURIComponent(username)}`
             `https://intellisearch-project.onrender.com/get_chat_data?username=${encodeURIComponent(username)}`
          );

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
