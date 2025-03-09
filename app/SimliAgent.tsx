import React, { useRef, useState } from "react";
import { DailyProvider } from "@daily-co/daily-react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import VideoBox from "@/app/Components/VideoBox";
import cn from "./utils/TailwindMergeAndClsx";
import IconSparkleLoader from "@/media/IconSparkleLoader";

interface SimliAgentProps {
  onStart: () => void;
  onClose: () => void;
}

// Get your Simli API key from https://app.simli.com/
const SIMLI_API_KEY = process.env.NEXT_PUBLIC_SIMLI_API_KEY;

const SimliAgent: React.FC<SimliAgentProps> = ({ onStart, onClose }) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);

  const [tempRoomUrl, setTempRoomUrl] = useState<string>("");
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const myCallObjRef = useRef<DailyCall | null>(null);
  const [chatbotId, setChatbotId] = useState<string | null>(null);

  /**
   * Create a new Simli room and join it using Daily
   */
  const handleJoinRoom = async () => {
    // Set loading state
    setIsLoading(true);

    // 1- Create a new simli avatar at https://app.simli.com/
    // 2- Cutomize your agent and copy the code output
    // 3- PASTE YOUR CODE OUTPUT FROM SIMLI BELOW 👇
    /**********************************/

    const response = await fetch("https://api.simli.ai/startE2ESession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiKey: "xhz599jkzxpc67c4uye2hq",
        faceId: "8c25ad04-69d2-4ae1-9885-83a1d193360f",
        voiceId: "4629672e-661d-4f59-93fc-8db4476b585f",
        firstMessage: `Welcome to our conversation today. I'm truly delighted to have this opportunity to speak with you.
Before we begin our discussion, I'd like to take a moment to create the right atmosphere. My goal is to have a meaningful exchange where you feel comfortable sharing your thoughts, experiences, and insights.
I've prepared questions that I believe will help us explore interesting territory together, but please know that this is a conversation, not an interrogation. Feel free to take the discussion in directions you find meaningful.
If at any point you need a moment to gather your thoughts, or if a question doesn't resonate with you, just let me know. We can adjust as we go.
I'm genuinely interested in understanding your perspective and learning from your unique journey. There are no right or wrong answers here—only your authentic thoughts.
Now, with that said, shall we begin?`,
        systemPrompt: `You are an AI avatar conducting a professional interview for a business operations position. Your role is to represent the company professionally while creating a comfortable yet thorough interview experience.
Your interview persona:

Professional, warm, and attentive
Knowledgeable about PayPal's business and the specific role requirements
Focused on gathering relevant information about the candidate's qualifications
Able to listen actively and respond appropriately to the candidate's answers

Interview structure:

Begin with a welcoming introduction
Ask the prepared questions in sequence
Listen to the candidate's responses carefully
Ask relevant follow-up questions when appropriate
Maintain a conversational flow throughout the interview

Opening script:
"Welcome to our conversation today. I'm truly delighted to have this opportunity to speak with you about the business operations role.
Before we begin our discussion, I'd like to take a moment to create the right atmosphere. My goal is to have a meaningful exchange where you feel comfortable sharing your thoughts, experiences, and insights.
I've prepared questions that I believe will help us explore your qualifications for this role, but please know that this is a conversation, not an interrogation. Feel free to elaborate where you think it's important.
If at any point you need a moment to gather your thoughts, or if a question doesn't resonate with you, just let me know. We can adjust as we go.
I'm genuinely interested in understanding your perspective and learning from your unique journey. There are no right or wrong answers here—only your authentic thoughts.
Now, with that said, shall we begin?"

Primary questions to ask:
Tell me about your most challenging project.
What experience do you have with implementing KPIs?
How do you approach cross-functional collaboration?

Guidelines for follow-up:

If the candidate gives a vague or general answer, ask for specific examples
If the candidate mentions an interesting achievement, ask about their personal contribution or the challenges they faced
If the answer seems incomplete, ask how the outcome impacted the business
Look for evidence of the candidate's ability to influence without direct authority

Assessment areas:

Strategic thinking and operational execution
Experience with designing and implementing KPIs
Cross-functional collaboration and communication skills
Leadership experience in complex organizations
Problem-solving approach and process improvement mindset
Cultural fit with our company values`,
      }),
    });

    const data = await response.json();
    const roomUrl = data.roomUrl;

    /**********************************/
    
    // Print the API response 
    console.log("API Response", data);

    // Create a new Daily call object
    let newCallObject = DailyIframe.getCallInstance();
    if (newCallObject === undefined) {
      newCallObject = DailyIframe.createCallObject({
        videoSource: false,
      });
    }

    // Setting my default username
    newCallObject.setUserName("User");

    // Join the Daily room
    await newCallObject.join({ url: roomUrl });
    myCallObjRef.current = newCallObject;
    console.log("Joined the room with callObject", newCallObject);
    setCallObject(newCallObject);

    // Start checking if Simli's Chatbot Avatar is available
    loadChatbot();
  };  

  /**
   * Checking if Simli's Chatbot avatar is available then render it
   */
  const loadChatbot = async () => {
    if (myCallObjRef.current) {
      let chatbotFound: boolean = false;

      const participants = myCallObjRef.current.participants();
      for (const [key, participant] of Object.entries(participants)) {
        if (participant.user_name === "Chatbot") {
          setChatbotId(participant.session_id);
          chatbotFound = true;
          setIsLoading(false);
          setIsAvatarVisible(true);
          onStart();
          break; // Stop iteration if you found the Chatbot
        }
      }
      if (!chatbotFound) {
        setTimeout(loadChatbot, 500);
      }
    } else {
      setTimeout(loadChatbot, 500);
    }
  };  

  /**
   * Leave the room
   */
  const handleLeaveRoom = async () => {
    if (callObject) {
      await callObject.leave();
      setCallObject(null);
      onClose();
      setIsAvatarVisible(false);
      setIsLoading(false);
    } else {
      console.log("CallObject is null");
    }
  };

  /**
   * Mute participant audio
   */
  const handleMute = async () => {
    if (callObject) {
      callObject.setLocalAudio(false);
    } else {
      console.log("CallObject is null");
    }
  };

  return (
    <>
      {isAvatarVisible && (
        <div className="h-[350px] w-[350px]">
          <div className="h-[350px] w-[350px]">
            <DailyProvider callObject={callObject}>
              {chatbotId && <VideoBox key={chatbotId} id={chatbotId} />}
            </DailyProvider>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center">
        {!isAvatarVisible ? (
          <button
            onClick={handleJoinRoom}
            disabled={isLoading}
            className={cn(
              "w-full h-[52px] mt-4 disabled:bg-[#343434] disabled:text-white disabled:hover:rounded-[100px] bg-simliblue text-white py-3 px-6 rounded-[100px] transition-all duration-300 hover:text-black hover:bg-white hover:rounded-sm",
              "flex justify-center items-center"
            )}
          >
            {isLoading ? (
              <IconSparkleLoader className="h-[20px] animate-loader" />
            ) : (
              <span className="font-abc-repro-mono font-bold w-[164px]">
                Test Interaction
              </span>
            )}
          </button>
        ) : (
          <>
            <div className="flex items-center gap-4 w-full">
              <button
                onClick={handleLeaveRoom}
                className={cn(
                  "mt-4 group text-white flex-grow bg-red hover:rounded-sm hover:bg-white h-[52px] px-6 rounded-[100px] transition-all duration-300"
                )}
              >
                <span className="font-abc-repro-mono group-hover:text-black font-bold w-[164px] transition-all duration-300">
                  Stop Interaction
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default SimliAgent;
